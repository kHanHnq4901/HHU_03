import { checkUpdateHHU } from '../../service/api';
import { BleFunc_SaveStorage, BleFunc_StartNotification } from '../../service/hhu/bleHhuFunc';
import { ObjSend, readVersion } from '../../service/hhu/hhuFunc';
import { requestBluetoothPermissions, requestPermissionScan } from '../../service/permission';
import BleManager from 'react-native-ble-manager';
import * as Ble from '../../util/ble';
import { showAlert, sleep } from '../../util';
import { hookProps, requestGps, setStatus, store } from './controller';
import { Platform } from 'react-native';

const TAG = 'handleBtn Ble:';

export const connectHandle = async (id: string, name: string) => {
  try {
    // Nếu đã kết nối rồi, ngắt kết nối cũ nếu khác id
    if (store?.state.hhu.connect === 'CONNECTED' && store?.state.hhu.idConnected !== id) {
      await BleManager.disconnect(store.state.hhu.idConnected, true);
    }

    if (name) {
      setStatus('Đang kết nối tới ' + name + ' ...');
      store?.setState(state => {
        state.hhu.name = name;
        return { ...state };
      });
    }

    let succeed = false;
    try {
      store?.setState(state => {
        state.hhu.connect = 'CONNECTING';
        return { ...state };
      });

      // Thực hiện kết nối
      succeed = await Ble.connect(id);
    } catch (err: any) {
      store?.setState(state => {
        state.hhu.idConnected = '';
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      setStatus('Kết nối thất bại: ' + err.message);
      return; // thoát nếu kết nối thất bại
    }

    if (!succeed) {
      setStatus('Kết nối thất bại');
      return;
    }
    // Xóa thiết bị vừa kết nối khỏi listNewDevice
    hookProps.setState(state => {
      state.ble.listNewDevice = state.ble.listNewDevice.filter(item => item.id !== id);
      return { ...state };
    });
    // Nếu kết nối thành công
    setStatus('Kết nối thành công');
    BleFunc_StartNotification(id);

    store?.setState(state => {
      state.hhu.idConnected = id;
      state.hhu.connect = 'CONNECTED';
      state.hhu.rssi = 0;
      return { ...state };
    });

    BleFunc_SaveStorage(id);

    // Bắt tay
    ObjSend.id = id;
    await sleep(500);
    ObjSend.isShakeHanded = true;



    // Đọc version HHU
    for (let k = 0; k < 2; k++) {
      await sleep(500);
      const version = await readVersion();
      if (version) {
        const arr = version.split('.');
        arr.length = 2;
        const shortVersion = arr.join('.').toLowerCase().replace('v', '');
        store.setState(state => {
          state.hhu.version = version;
          state.hhu.shortVersion = shortVersion;
          return { ...state };
        });
        console.log('Read version succeed: ' + version);
        console.log('Short version: ' + shortVersion);
        checkUpdateHHU();
        break;
      } else {
        console.log('Read version failed, try again');
      }
    }
  } catch (err: any) {
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
    console.log('data disconnect peripheral:', id);
    await BleManager.disconnect(id, true);
    store.setState(state => {
      state.hhu.name = '';
      state.hhu.idConnected = '';
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });
    console.log (store.state.hhu.connect)
    ObjSend.id = null;
  } catch {}
};


