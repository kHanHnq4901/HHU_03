import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { GetHook, onDeInit, onInit } from './controller';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { store } from '../login/controller';
import Geolocation from '@react-native-community/geolocation';
import {
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
} from '@track-asia/trackasia-react-native';
import * as turf from '@turf/turf';

export const ManualReadScreen = () => {
  GetHook();
  const [meters, setMeters] = React.useState<any[]>([]);
  const [selectedMeter, setSelectedMeter] = React.useState<any | null>(null);
  const [currentLocation, setCurrentLocation] = React.useState<[number, number]>([105.8544, 21.0285]); // Hà Nội mặc định
  const [isLoading, setIsLoading] = React.useState(true); // Loading trạng thái vị trí

  const watchId = React.useRef<number | null>(null);

  React.useEffect(() => {
    requestLocationPermission();
    fetchMeters();
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Quyền truy cập vị trí bị từ chối');
          setIsLoading(false);
          return;
        }
      }
      startWatchingPosition();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const startWatchingPosition = () => {
    // Lấy vị trí tức thì
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isNaN(longitude) && !isNaN(latitude)) {
          setCurrentLocation([longitude, latitude]);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Lỗi lấy vị trí ban đầu:', err);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Theo dõi liên tục
    watchId.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isNaN(longitude) && !isNaN(latitude)) {
          setCurrentLocation([longitude, latitude]);
        }
      },
      (err) => console.error('Lỗi lấy vị trí:', err),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 2000,
        fastestInterval: 2000,
        maximumAge: 1000,
      }
    );
  };

  const fetchMeters = async () => {
    try {
      const res = await axios.get('http://14.225.244.63:8088/api/GetMeterAccount', {
        params: {
          userID: store.state.infoUser.moreInfoUser.userId,
          token: store.state.infoUser.moreInfoUser.token,
        },
      });
        
      if (Array.isArray(res.data)) {
        setMeters(res.data);
      } else {
        console.warn('API trả về không phải array:', res.data);
      }
    } catch (err) {
      console.error('❌ Lỗi khi gọi API GetMeterAccount:', err);
    }
  };

  const getCircleGeoJSON = (center: [number, number], radiusInMeters = 500) => {
    return turf.circle(center, radiusInMeters / 1000, { steps: 64, units: 'kilometers' });
  };

  const mapElement = React.useMemo(() => (
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
      <Camera
        zoomLevel={15}
        centerCoordinate={currentLocation}
      />

      {/* Marker vị trí hiện tại */}
      <PointAnnotation
        key="current-location"
        id="current-location"
        coordinate={currentLocation}
      >
        <View style={styles.currentLocationDot} />
      </PointAnnotation>

      {/* Marker đồng hồ */}
      {meters.map((meter, index) => {
        const longitude = parseFloat(meter.LONGITUDE);
        const latitude = parseFloat(meter.LATITUDE);
        if (!isNaN(longitude) && !isNaN(latitude)) {
          return (
            <PointAnnotation
              key={`meter-${index}`}
              id={`meter-${index}`}
              coordinate={[longitude, latitude]}
              onSelected={() => setSelectedMeter(meter)}
            >
              <View style={styles.dot} />
            </PointAnnotation>
          );
        }
        return null;
      })}

      {/* Vẽ vòng tròn */}
      <ShapeSource id="circle" shape={getCircleGeoJSON(currentLocation)}>
        <FillLayer
          id="circleFill"
          style={{
            fillColor: 'rgba(0,150,255,0.2)',
            fillOutlineColor: 'rgba(0,150,255,0.8)',
          }}
        />
      </ShapeSource>
    </MapView>
  ), [meters, currentLocation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {mapElement}

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
    bottom: 20,
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
});
