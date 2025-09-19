import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { GetHookProps, hookProps, store } from './controller';
import {
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
} from '@track-asia/trackasia-react-native';
import * as turf from '@turf/turf';
import { LoadingOverlay } from '../../component/loading ';
import { clearLocationWatch, requestLocationPermission, startAutoRead, stopAutoRead } from './handleButton';
import { formatDistance, getDistanceValue } from '../../util/location';
import { PulsingDot } from '../../component/PointAnnotation';
import { BlinkingDot } from '../../component/blinkingDot';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const AutomaticReadScreen = () => {
  // Khởi tạo hookProps
  GetHookProps();

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  // Khi mount → request location + cleanup khi unmount
  useEffect(() => {
    requestLocationPermission();

    return () => {
      console.log("📴 Rời khỏi màn hình → dừng đọc và clear location");
      stopAutoRead();
      clearLocationWatch();
    };
  }, []);

  // Lọc danh sách meter theo selectedStatus và sắp xếp theo khoảng cách
  useEffect(() => {
    if (hookProps.state.selectedStatus === null || !hookProps.state.currentLocation) return;

    hookProps.setState(prev => ({
      ...prev,
      filteredMeters: prev.listMeter
        .filter(m => Number(m.STATUS) === hookProps.state.selectedStatus)
        .sort((a, b) => {
          const distA = getDistanceValue(a.COORDINATE, prev.currentLocation);
          const distB = getDistanceValue(b.COORDINATE, prev.currentLocation);
          return distA - distB;
        }),
    }));
  }, [hookProps.state.selectedStatus, hookProps.state.listMeter, hookProps.state.currentLocation]);

  // Nếu chưa có vị trí hiện tại → hiển thị loading
  if (!hookProps.state.currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  // Hàm di chuyển camera tới meter
  const moveToMeter = (meter: any) => {
    if (!meter.COORDINATE) return;
    const [latStr, lonStr] = meter.COORDINATE.split(',').map((v: string) => v.trim());
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);
    if (!isNaN(latitude) && !isNaN(longitude)) {
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: Number(store.state.appSetting.setting.zoomLevel),
        animationDuration: 1000,
      });
      hookProps.setState(prev => ({ ...prev, modalVisible: false }));
    }
  };

  // Tính số lượng meter theo từng STATUS
  const counts = hookProps.state.listMeter.reduce((acc: Record<number, number>, item: any) => {
    const status = item.STATUS ?? 0;
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={{ flex: 1 }}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />


      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        mapStyle="https://maps.track-asia.com/styles/v2/streets.json?key=f4a6c08959b47211756357354b1b73ac74"
        compassEnabled
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        attributionEnabled
      >
        <Camera
          ref={cameraRef}
          zoomLevel={Number(store.state.appSetting.setting.zoomLevel)}
          centerCoordinate={hookProps.state.currentLocation}
        />

        {/* Marker vị trí hiện tại */}
        <PointAnnotation
          key="current-location"
          id="current-location"
          coordinate={hookProps.state.currentLocation}
          anchor={{ x: 0.5, y: 1 }}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={40}
            color="#d32f2f" // đỏ đặc trưng Google Maps
            style={{ textShadowColor: "#000", textShadowRadius: 2 }}
          />
        </PointAnnotation>

        {/* Meter markers */}
        {hookProps.state.listMeter.map((meter, index) => {
          if (!meter.COORDINATE) return null;
          const [latStr, lonStr] = meter.COORDINATE.split(',').map(v => v.trim());
          const latitude = parseFloat(latStr);
          const longitude = parseFloat(lonStr);
          if (isNaN(latitude) || isNaN(longitude)) return null;

          let dotColor = '#9e9e9e';
          let DotComponent = PulsingDot; // default
          switch (Number(meter.STATUS)) {
            case 0: dotColor = '#9e9e9e'; break;
            case 1: dotColor = '#4caf50'; break;
            case 2: dotColor = '#f44336'; break;
            case 4: dotColor = '#ff9800'; break;
            case 6: dotColor = '#00f'; DotComponent = BlinkingDot; break; // nhấp nháy màu xanh dương
          }

          return (
            <PointAnnotation
              key={`${index}-${meter.STATUS}`} // React sẽ re-render khi STATUS thay đổi
              id={`${index}`}
              coordinate={[longitude, latitude]}
            >
              <PulsingDot color={dotColor} />
            </PointAnnotation>
          );
        })}

        {/* Vòng tròn bán kính */}
        {hookProps.state.currentLocation && (
          <ShapeSource
            id="circle"
            shape={turf.circle(
              hookProps.state.currentLocation as [number, number],
              Number(store.state.appSetting.setting.distance) / 1000,
              { steps: 64, units: "kilometers" }
            )}
          >
            <FillLayer
              id="circleFill"
              style={{
                fillColor: "rgba(0,150,255,0.2)",
                fillOutlineColor: "rgba(0,150,255,0.8)",
              }}
            />
          </ShapeSource>
        )}
      </MapView>
      {hookProps.state.readingStatus && (
        <View style={[styles.readingBar, 
          hookProps.state.readingStatus.status === "reading" && { backgroundColor: "#2196f3" },
          hookProps.state.readingStatus.status === "success" && { backgroundColor: "#4caf50" },
          hookProps.state.readingStatus.status === "fail" && { backgroundColor: "#f44336" },
        ]}>
          <Text style={styles.readingText}>
            {hookProps.state.readingStatus.status === "reading" && `Đang đọc: ${hookProps.state.readingStatus.meterNo} (${hookProps.state.readingStatus.name})`}
            {hookProps.state.readingStatus.status === "success" && `✅ Đọc thành công: ${hookProps.state.readingStatus.meterNo}`}
            {hookProps.state.readingStatus.status === "fail" && `❌ Đọc thất bại: ${hookProps.state.readingStatus.meterNo}`}
          </Text>
        </View>
      )}

      {/* Status Bar */}
      <View style={styles.statusBar}>
        {[
          { status: 2, label: 'Thất bại', color: '#f44336' },
          { status: 0, label: 'Chưa đọc', color: '#9e9e9e' },
          { status: 1, label: 'Đã đọc', color: '#4caf50' },
          { status: 4, label: 'Cảnh báo', color: '#ff9800' },
        ].map(({ status, label, color }) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusItem, { backgroundColor: color }]}
            onPress={() => hookProps.setState(prev => ({
              ...prev,
              selectedStatus: status,
              modalVisible: true,
            }))}
          >
            <Text style={styles.statusNumber}>{counts[status] || 0}</Text>
            <Text style={styles.statusLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* Floating Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: hookProps.state.isAutoReading ? '#f44336' : '#4caf50' },
        ]}
        onPress={() => {
          if (hookProps.state.isAutoReading) {
            stopAutoRead();
          } else {
            startAutoRead();
          }
        }}
      >
        <Text style={styles.floatingButtonText}>
          {hookProps.state.isAutoReading ? 'Kết thúc' : 'Bắt đầu'}
        </Text>
      </TouchableOpacity>

      {/* Modal danh sách meter */}
      <Modal
        visible={hookProps.state.modalVisible}
        animationType="slide"
        onRequestClose={() => hookProps.setState(prev => ({ ...prev, modalVisible: false }))}
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {hookProps.state.selectedStatus === 2 && 'Danh sách Thất bại'}
              {hookProps.state.selectedStatus === 0 && 'Danh sách Chưa đọc'}
              {hookProps.state.selectedStatus === 1 && 'Danh sách Đã đọc'}
              {hookProps.state.selectedStatus === 4 && 'Danh sách Cảnh báo'}
            </Text>

            <FlatList
              data={hookProps.state.filteredMeters || []} // Hiển thị filteredMeters theo status
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => moveToMeter(item)}>
                  <View style={styles.meterItem}>
                    <Text style={{ fontWeight: '600' }}>{item.LINE_NAME}</Text>
                    <Text style={{ color: '#666' }}>
                      {item.METER_NO} - {item.CUSTOMER_NAME} - {formatDistance(getDistanceValue(item.COORDINATE, hookProps.state.currentLocation))}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => hookProps.setState(prev => ({ ...prev, modalVisible: false }))}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },
  statusItem: { flex: 1, borderRadius: 8, padding: 8, marginHorizontal: 4, alignItems: 'center' },
  statusNumber: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statusLabel: { fontSize: 13, fontWeight: '600', color: '#fff', marginTop: 2 },
  floatingButton: { position: 'absolute', bottom: 80, alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
  floatingButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  meterItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  modalCloseButton: { marginTop: 10, backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center' },
  readingBar: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  readingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

});
