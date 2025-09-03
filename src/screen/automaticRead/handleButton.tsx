import { hookProps } from './controller';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

let watchId: number | null = null;
let alertShown = false;

// Dừng lấy vị trí liên tục
export const stopWatchingPosition = () => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
};

// Bắt đầu lấy vị trí liên tục
export const startWatchingPosition = () => {
  stopWatchingPosition(); // đảm bảo không có watch cũ

  // Cập nhật trạng thái loading
  hookProps.setState(prev => ({
    ...prev,
    isLoading: true,
    textLoading: 'Đang lấy vị trí...',
  }));

  watchId = Geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!isNaN(latitude) && !isNaN(longitude)) {
        hookProps.setState(prev => ({
          ...prev,
          currentLocation: [longitude, latitude],
          isLoading: false,
          textLoading: 'Vị trí đã sẵn sàng',
        }));
        alertShown = false; // reset alert nếu vị trí đã lấy được
      }
    },
    (err) => {
      console.log('Lỗi watchPosition:', err);

      hookProps.setState(prev => ({
        ...prev,
        isLoading: true,
        textLoading: 'Chưa lấy được vị trí. Hãy di chuyển ra ngoài hoặc bật GPS',
      }));

      // Nếu POSITION_UNAVAILABLE, cảnh báo 1 lần
      if (err.code === 2 && !alertShown) {
        Alert.alert(
          'GPS chưa bật hoặc tín hiệu yếu',
          'Vui lòng bật dịch vụ định vị (GPS) và ra ngoài trời để sử dụng tính năng này.',
          [{ text: 'OK' }]
        );
        alertShown = true;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
      distanceFilter: 1, // cập nhật khi di chuyển >1m
      interval: 1000, // Android: lấy vị trí mỗi 1s
      fastestInterval: 500, // Android: tối đa 0.5s
    }
  );
};

// Yêu cầu quyền vị trí trước khi bắt đầu
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Yêu cầu quyền vị trí',
          message: 'Ứng dụng cần truy cập vị trí để xác định vị trí hiện tại',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Hủy',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        hookProps.setState(prev => ({
          ...prev,
          isLoading: false,
          textLoading: 'Quyền vị trí bị từ chối',
        }));
        return;
      }
    }

    // Bắt đầu theo dõi vị trí
    //startWatchingPosition();

  } catch (err) {
    console.log('Lỗi requestLocationPermission:', err);
    hookProps.setState(prev => ({
      ...prev,
      isLoading: false,
      textLoading: 'Lỗi lấy vị trí',
    }));
  }
};
