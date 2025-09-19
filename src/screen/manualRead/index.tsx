import React, { useEffect, useRef, useState } from 'react';
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
  LineLayer,
} from '@track-asia/trackasia-react-native';
import * as turf from '@turf/turf';
import { LoadingOverlay } from '../../component/loading ';
import { clearLocationWatch, requestLocationPermission, readMetersOnce, stopReading, getDirections, readOneMeter } from './handleButton';
import { formatDistance, getDistanceValue } from '../../util/location';
import { PulsingDot } from '../../component/PointAnnotation';
import { BlinkingDot } from '../../component/blinkingDot';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const ManualReadScreen = () => {
  // Khởi tạo hookProps
  GetHookProps();
  const polyline = require('@trackasia/polyline');
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  useEffect(() => {
    requestLocationPermission();

    return () => {
      console.log("📴 Rời khỏi màn hình → dừng đọc và clear location");
      stopReading();
      clearLocationWatch();
    };
  }, []);
  const decodePolyline = (encoded: string) => {
    return polyline.decode(encoded).map(([lat, lng]) => [lng, lat]); // đảo lại
  };
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
  if (!hookProps.state.currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Đang lấy vị trí...</Text>
      </View>
    );
  }
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
         {routeCoords.length > 0 && (
          <ShapeSource
            id="route"
            shape={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeCoords,
              },
              properties: {},
            }}
          >
            <LineLayer
              id="routeLine"
              style={{
                lineColor: "#2196F3",
                lineWidth: 4,
              }}
            />
          </ShapeSource>
        )}
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
        {hookProps.state.listMeter.map((meter, index) => {
          if (!meter.COORDINATE) return null;
          const [latStr, lonStr] = meter.COORDINATE.split(',').map(v => v.trim());
          const latitude = parseFloat(latStr);
          const longitude = parseFloat(lonStr);
          if (isNaN(latitude) || isNaN(longitude)) return null;
          let dotColor = '#9e9e9e';
          let DotComponent = PulsingDot;
          switch (Number(meter.STATUS)) {
            case 0: dotColor = '#9e9e9e'; break;
            case 1: dotColor = '#4caf50'; break;
            case 2: dotColor = '#f44336'; break;
            case 4: dotColor = '#ff9800'; break;
            case 6: dotColor = '#00f'; DotComponent = BlinkingDot; break;
          }
          return (
            <PointAnnotation
              key={`${index}-${meter.STATUS}`} 
              id={`${index}`}
              coordinate={[longitude, latitude]}
            >
              <PulsingDot color={dotColor} />
            </PointAnnotation>
          );
        })}
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
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: '#4caf50' }]}
        onPress={readMetersOnce}
      >
        <Text style={styles.floatingButtonText}>Đọc</Text>
      </TouchableOpacity>
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
            data={hookProps.state.filteredMeters || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.meterItemRow}>
                {/* Thông tin bên trái */}
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => moveToMeter(item)}
                >
                  <Text style={{ fontWeight: "600" }}>{item.LINE_NAME}</Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>
                    {item.METER_NO} - {item.CUSTOMER_NAME} -{" "}
                    {formatDistance(
                      getDistanceValue(item.COORDINATE, hookProps.state.currentLocation)
                    )}
                  </Text>
                </TouchableOpacity>
                <View style={styles.itemButtons}>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: "#2196F3" }]}
                    onPress={async () => {
                      const origin = `${hookProps.state.currentLocation[1]},${hookProps.state.currentLocation[0]}`; // lat,lng
                      const destination = item.COORDINATE; // "lat,lng"

                      const data = await getDirections(origin, destination, store.state.appSetting.setting.vehicle);
                      if (data?.routes?.[0]?.overview_polyline?.points) {
                        const coords = decodePolyline(data.routes[0].overview_polyline.points);
                        setRouteCoords(coords);
                        hookProps.setState(prev => ({ ...prev, modalVisible: false }));
                        if (coords.length > 0) {
                          cameraRef.current?.fitBounds(
                            coords[0],
                            coords[coords.length - 1],
                            [50, 50, 50, 50]
                          );
                        }
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="directions" size={18} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: "#4CAF50" }]}
                    onPress={async () => {
                      hookProps.setState(prev => ({ ...prev, modalVisible: false }));
                      console.log("📖 Đọc công tơ", item.METER_NO);
                      await readOneMeter(item.METER_NO);
                    }}
                  >
                    <MaterialCommunityIcons name="access-point" size={18} color="#fff" />
                  </TouchableOpacity>

                  {/* Nút mới xem dữ liệu */}
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: "#FF9800" }]}
                    onPress={() => {
                      console.log("👁️ Xem dữ liệu công tơ", item.METER_NO);
                      hookProps.setState(prev => ({ 
                        ...prev, 
                        modalVisible: false, 
                        selectedMeterNo: item.METER_NO, 
                        isShowDataModal: true // ví dụ dùng để mở modal xem dữ liệu
                      }));
                    }}
                  >
                    <MaterialCommunityIcons name="file-document" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalActionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  meterItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemButtons: {
    flexDirection: "row",
    marginLeft: 8,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  
});
