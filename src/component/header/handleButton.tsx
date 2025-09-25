import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { connectLatestBLE } from '../../service/hhu/bleHhuFunc';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { store } from './controller';
import { navigationRef } from '../../navigation/StackRootNavigator';
import BleManager from 'react-native-ble-manager';

async function requestBlePermissions() {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
  }
}

export async function onBlePress() {
  console.log ('onBlePress')
  // Xin quyền nếu cần
  //await requestBlePermissions();

  const connectState = store.state.hhu.connect;
  console.log('Trạng thái kết nối hiện tại:', connectState);

  if (connectState === 'DISCONNECTED') {
    try {
      await connectLatestBLE(store);
      console.log('Kết nối lại thiết bị cũ');
    } catch (err) {
      console.log('Lỗi khi kết nối lại:', err);
    }
    return;
  }

  if (connectState === 'CONNECTING') {
    console.log('Đang kết nối, bỏ qua thao tác...');
    return;
  }
  if (connectState === 'CONNECTED') {
    Alert.alert(
      'Ngắt kết nối Bluetooth?',
      'Bạn có muốn ngắt kết nối thiết bị Bluetooth không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          onPress: async () => {
            try {
              let peripheralId = store.state.hhu.idConnected;
  
              if (!peripheralId) {
                let peripherals: any[] = [];
                if (Platform.OS === 'android') {
                  // Android: lấy các thiết bị đã paired
                  peripherals = await BleManager.getBondedPeripherals();
                }
                if (peripherals.length > 0) {
                  peripheralId = peripherals[0].id;
                }
              }
  
              if (peripheralId) {
                console.log('Ngắt kết nối với:', peripheralId);
                await BleManager.disconnect(peripheralId);
                store.setState(state => {
                  state.hhu.idConnected = '';
                  state.hhu.connect = 'DISCONNECTED';
                  return { ...state };
                });
              } else {
                console.log('Không tìm thấy thiết bị để ngắt kết nối.');
              }
            } catch (err) {
              console.log('Lỗi khi ngắt kết nối:', err);
            }
          },
        },
      ]
    );
  }
  // CONNECTED → hỏi ngắt kết nối

}

export function onBleLongPress() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('BleScreen');
  }
}
