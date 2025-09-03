import { checkUpdateHHU } from '../../service/api';
import { BleFunc_SaveStorage, BleFunc_StartNotification, connectLatestBLE } from '../../service/hhu/bleHhuFunc';
import { ObjSend, readVersion } from '../../service/hhu/hhuFunc';
import { requestBluetoothPermissions, requestPermissionScan } from '../../service/permission';
import BleManager from 'react-native-ble-manager';
import * as Ble from '../../util/ble';
import { showAlert, sleep } from '../../util';
import { hookProps, requestGps, setStatus, store } from './controller';
import { Alert, Platform } from 'react-native';
import { navigationRef } from '../../navigation/StackRootNavigator';

const TAG = 'handleBtn Ble:';

export const connectHandle = async (id: string, name: string) => {
  try {
    if (store?.state.hhu.connect === 'CONNECTED') {
      if (store?.state.hhu.idConnected === id) {
        // read rssi

        // let rssi: number = 0;
        // try {
        //   //console.log(TAG, 'a');
        //   if (store.state.hhu.rssi === 0) {
        //     console.log(TAG, 'read rssi');
        //     rssi = await BleManager.getRssi(id);
        //     //console.log(TAG, 'b');
        //     store?.setValue(state => {
        //       state.hhu.rssi = rssi;
        //       return { ...state };
        //     });
        //    await BleFunc_StartNotification(id);
        //     console.log(TAG, 'get rssi: ' + rssi);
        //   }
        // } catch (err: any) {
        //   console.log(TAG, err.message);
        // }

        return;
      }
      await BleManager.disconnect(store.state.hhu.idConnected, true);
    }
    if (name) {
      setStatus('Đang kết nối tới  ' + name + ' ...');
      store?.setState(state => {
        state.hhu.name = name;
        return { ...state };
      });
    }
    let succeed: boolean = false;
    try {
      store?.setState(state => {
        state.hhu.connect = 'CONNECTING';
        return { ...state };
      });
      //await BleManager.refreshCache(id);
      succeed = await Ble.connect(id);
    } catch (err :any) {
      store?.setState(state => {
        state.hhu.idConnected = '';
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      setStatus('Kết nối thất bại: ' + err.message);
    }

    if (succeed) {
      setStatus('Kết nối thành công');
      BleFunc_StartNotification(id);
      let rssi: number = 0;
      // try {
      //   rssi = await BleManager.getRssi(id);
      // } catch (err: any) {
      //   console.log(TAG, err.message);
      // }
      store?.setState(state => {
        state.hhu.idConnected = id;
        state.hhu.connect = 'CONNECTED';
        state.hhu.rssi = rssi;
        return { ...state };
      });
      BleFunc_SaveStorage(id);
      ObjSend.id = id;
      await sleep(500);
      
        setStatus('Bắt tay thành công');
        ObjSend.isShakeHanded = true;
        for (let k = 0; k < 2; k++) {
          await sleep(500);
          const version = await readVersion();
          if (version) {
            let arr = version.split('.');
            arr.length = 2;
            const shortVersion = arr
              .join('.')
              .toLocaleLowerCase()
              .replace('v', '');
            store.setState(state => {
              state.hhu.version = version;
              state.hhu.shortVersion = shortVersion;
              return { ...state };
            });
            console.log('Read version succeed:' + version);
            console.log('Short version:' + shortVersion);
            checkUpdateHHU();

            break;
          } else {
            console.log('Read version failed');
            console.log('Try read version');
          }
        }
      
    } else {
      setStatus('Kết nối thất bại');
    }
    //navigation.goBack();
  } catch (err :any) {
    console.log(TAG, err);
    setStatus('Kết nối thất bại: ' + err.message);
  }
};

// Hàm scan
export const onScanPress = async () => {
  if (hookProps.state.ble.isScan) {
    return;
  }

  hookProps.setState(state => {
    state.status = ''; // Không xóa listNewDevice nữa
    return { ...state };
  });

  const requestScanPermission = await requestBluetoothPermissions();

  try {
    if (requestScanPermission) {
      console.log('here request');

      try {
        await BleManager.enableBluetooth();

        if (Platform.OS === 'android') {
          await BleManager.start({ showAlert: false });
          console.log("BLE Module initialized");
        }

        // Bắt đầu quét
        BleManager.scan([], 5, true).then(() => {
          console.log("Scan started");
          hookProps.setState(state => {
            state.ble.isScan = true;
            return { ...state };
          });

          // Sau 5s thì dừng quét
          setTimeout(() => {
            BleManager.stopScan().then(() => {
              console.log("Scan stopped");
              hookProps.setState(state => {
                state.ble.isScan = false;
                return { ...state };
              });
            });
          }, 5000);
        });

      } catch (err) {
        showAlert('Thiết bị cần được bật Bluetooth');
        return;
      }

    } else {
      console.log('requestGps failed');
    }
  } catch (err: any) {
    console.log(TAG, 'err:', err);
  }
};

export const disConnect = async (id: string) => {
  try {
    //console.log('here:', store.state.bleConnected);
    if (store?.state.hhu.connect === 'CONNECTED') {
      console.log('diconnect...');
      setStatus('Ngắt kết nối bluetooth');
      //await Ble.stopNotification(id);
      if (id === null) {
      } else {
        await BleManager.disconnect(id, true);
      }
    }
  } catch {}
};
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
              let peripheralId = ObjSend.id;
  
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

