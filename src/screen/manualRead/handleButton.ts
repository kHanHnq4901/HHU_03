import { hookProps } from './controller';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

let watchId: number | null = null;
let alertShown = false;

// ✅ Xin quyền vị trí
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'Ứng dụng cần truy cập vị trí để hoạt động chính xác.',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Hủy',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ Quyền truy cập vị trí bị từ chối');
        hookProps.setState(prev => ({
          ...prev,
          isLoading: false,
          textLoading: 'Bạn đã từ chối quyền vị trí',
        }));
        return;
      }
    }
    startWatchingPosition();
  } catch (err) {
    console.error('Lỗi xin quyền vị trí:', err);
  }
};

// ✅ Theo dõi vị trí liên tục
export const startWatchingPosition = () => {
  // Clear watchId cũ nếu có
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }

  // Lấy vị trí ban đầu ngay
  Geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!isNaN(latitude) && !isNaN(longitude)) {
        hookProps.setState(prev => ({
          ...prev,
          currentLocation: [longitude, latitude],
          isLoading: false,
          textLoading: '',
        }));
      }
    },
    (err) => {
      console.log('Lỗi lấy vị trí ban đầu:', err);
      hookProps.setState(prev => ({
        ...prev,
        isLoading: false,
        textLoading: 'Không lấy được vị trí. Hãy bật GPS hoặc di chuyển ra ngoài trời',
      }));

      if (err.code === 2 && !alertShown) {
        alertShown = true;
        Alert.alert(
          'GPS chưa bật',
          'Vui lòng bật dịch vụ định vị (GPS) để sử dụng tính năng này.',
          [{ text: 'OK', onPress: () => (alertShown = false) }]
        );
      }
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );

  // Bắt đầu theo dõi liên tục
  watchId = Geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!isNaN(latitude) && !isNaN(longitude)) {
        hookProps.setState(prev => ({
          ...prev,
          currentLocation: [longitude, latitude],
        }));
      }
    },
    (err) => console.log('Lỗi cập nhật vị trí:', err),  
    {
      enableHighAccuracy: true,
      distanceFilter: 5,  // chỉ cập nhật khi di chuyển >= 5m
      interval: 2000,
      fastestInterval: 2000,
      maximumAge: 1000,
    }
  );
};


export const clearLocationWatch = () => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
};