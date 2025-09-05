import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { GetHookProps, hookProps, store } from './controller';
import Geolocation from '@react-native-community/geolocation';
import {
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
} from '@track-asia/trackasia-react-native';
import * as turf from '@turf/turf';
import { LoadingOverlay } from '../../component/loading ';
import { requestLocationPermission, startWatchingPosition } from './handleButton';

export const ManualReadScreen = () => {
  GetHookProps();

  const [selectedMeter, setSelectedMeter] = React.useState<any | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const currentLocation = hookProps.state.currentLocation;
  const listMeter = hookProps.state.listMeter;
  const mapElement = useMemo(() => {
    if (!currentLocation) return null; // trả về null nếu chưa có vị trí

    return (
      <MapView
        style={styles.map}
        mapStyle="https://maps.track-asia.com/styles/v2/streets.json?key=f4a6c08959b47211756357354b1b73ac74"
        compassEnabled
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        attributionEnabled
      >
        <Camera zoomLevel={Number(store.state.appSetting.setting.zoomLevel)} centerCoordinate={currentLocation} />

        {/* Chấm vị trí hiện tại */}
        <PointAnnotation
          key="current-location"
          id="current-location"
          coordinate={currentLocation}
        >
          <View style={styles.currentLocationDot} />
        </PointAnnotation>

        {/* Vẽ chấm đồng hồ */}
        {listMeter?.map((meter, index) => {
          if (!meter.COORDINATE) return null;

          const [latStr, lonStr] = meter.COORDINATE.split(',').map((v) => v.trim());
          const latitude = parseFloat(latStr);
          const longitude = parseFloat(lonStr);

          if (!isNaN(latitude) && !isNaN(longitude)) {
            return (
              <PointAnnotation
                key={`${index}`}
                id={`${index}`}
                coordinate={[longitude, latitude]}
                onSelected={() => setSelectedMeter(meter)}
              >
                <View style={styles.dot} />
              </PointAnnotation>
            );
          }
          return null;
        })}

        {/* Vẽ vòng tròn quanh vị trí hiện tại */}
        <ShapeSource
          id="circle"
          shape={turf.circle(
            currentLocation as [number, number],
            Number(store.state.appSetting.setting.distance) / 1000,
            { steps: 64, units: 'kilometers' }
          )}
        >
          <FillLayer
            id="circleFill"
            style={{
              fillColor: 'rgba(0,150,255,0.2)',
              fillOutlineColor: 'rgba(0,150,255,0.8)',
            }}
          />
        </ShapeSource>
      </MapView>
    );
  }, [listMeter]);

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />
      {mapElement}

      {/* Popup chi tiết */}
      {selectedMeter && (
        <View style={styles.fixedPopup}>
          <Text style={styles.popupTitle}>Thông tin đồng hồ nước</Text>
          <Text style={styles.popupText}>📟 Tên: {selectedMeter.METER_NAME}</Text>
          <Text style={styles.popupText}>📍 Địa chỉ: {selectedMeter.ADDRESS}</Text>
          <Text style={styles.popupText}>🔢 Số công tơ: {selectedMeter.METER_NO}</Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMeter(null)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusItem, { backgroundColor: '#f44336' }]}>
          <Text style={styles.statusNumber}>
            {hookProps.state.statusCount[2] || 0}
          </Text>
          <Text style={styles.statusLabel}>Thất bại</Text>
        </View>

        <View style={[styles.statusItem, { backgroundColor: '#9e9e9e' }]}>
          <Text style={styles.statusNumber}>
            {hookProps.state.statusCount[0] || 0}
          </Text>
          <Text style={styles.statusLabel}>Chưa đọc</Text>
        </View>

        <View style={[styles.statusItem, { backgroundColor: '#4caf50' }]}>
          <Text style={styles.statusNumber}>
            {hookProps.state.statusCount[1] || 0}
          </Text>
          <Text style={styles.statusLabel}>Đã đọc</Text>
        </View>

        <View style={[styles.statusItem, { backgroundColor: '#ff9800' }]}>
          <Text style={styles.statusNumber}>
            {hookProps.state.statusCount[4] || 0}
          </Text>
          <Text style={styles.statusLabel}>Cảnh báo</Text>
        </View>
      </View>

      {/* Floating Start/Stop Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: hookProps.state.isAutoReading ? '#f44336' : '#4caf50' },
        ]}
        onPress={() => {
          if (hookProps.state.isAutoReading) {
            hookProps.setState((prev) => ({ ...prev, isAutoReading: false }));
            console.log('⏹️ Dừng đọc chỉ số tự động');
          } else {
            hookProps.setState((prev) => ({ ...prev, isAutoReading: true }));
            console.log('▶️ Bắt đầu đọc chỉ số tự động');
          }
        }}
      >
        <Text style={styles.floatingButtonText}>
          {hookProps.state.isAutoReading ? 'Kết thúc' : 'Bắt đầu'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  map: { flex: 1 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#fff',
  },
  currentLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007bff',
    borderWidth: 3,
    borderColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedPopup: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  popupTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  popupText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#f44336',
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  statusItem: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80, // Nổi lên trên statusBar
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  statusNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
});
