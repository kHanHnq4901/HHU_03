import { checkUpdateHHU } from '../../service/api';
import { BleFunc_SaveStorage, BleFunc_StartNotification } from '../../service/hhu/bleHhuFunc';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { requestBluetoothPermissions } from '../../service/permission';
import BleManager from 'react-native-ble-manager';
import * as Ble from '../../util/ble';
import { showAlert, sleep } from '../../util';
import { hookProps, setStatus, store } from './controller';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const TAG = 'handleBtn Ble:';
const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

export const connectHandle = async (id: string, name: string) => {
  try {
    // Ngắt kết nối cũ nếu khác id
    if (store?.state.hhu.connect === 'CONNECTED' && store?.state.hhu.idConnected !== id) {
      await BleManager.disconnect(store.state.hhu.idConnected, true);
      await BleManager.removePeripheral(store.state.hhu.idConnected).catch(() => {});
    }

    if (name) {
      setStatus('Đang kết nối tới ' + name + ' ...');
      store?.setState(state => {
        state.hhu.name = name;
        return { ...state };
      });
    }

    store?.setState(state => {
      state.hhu.connect = 'CONNECTING';
      return { ...state };
    });

    let succeed = false;
    try {
      succeed = await Ble.connect(id);
    } catch (err: any) {
      store?.setState(state => {
        state.hhu.idConnected = '';
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      setStatus('Kết nối thất bại: ' + err.message);
      return;
    }

    if (!succeed) {
      setStatus('Kết nối thất bại');
      return;
    }

    // Nếu kết nối thành công
    setStatus('Kết nối thành công');
    BleFunc_StartNotification(id);

    store?.setState(state => {
      state.hhu.idConnected = id;
      state.hhu.connect = 'CONNECTED';
      state.hhu.rssi = 0;
      return { ...state };
    });

    // Lưu device
    BleFunc_SaveStorage(id);

    // Xóa thiết bị vừa kết nối khỏi list scan
    hookProps.setState(state => {
      state.ble.listNewDevice = state.ble.listNewDevice.filter(item => item.id !== id);
      return { ...state };
    });
  } catch (err: any) {
    console.log(TAG, err);
    setStatus('Kết nối thất bại: ' + err.message);
  }
};

// Hàm scan (ưu tiên lấy tên từ advertising.localName)
export const onScanPress = async () => {
  if (hookProps.state.ble.isScan) return;

  hookProps.setState(state => {
    state.status = '';
    return { ...state };
  });

  const requestScanPermission = await requestBluetoothPermissions();

  try {
    if (!requestScanPermission) {
      console.log('⚠️ requestGps failed');
      return;
    }

    await BleManager.enableBluetooth();

    if (Platform.OS === 'android') {
      await BleManager.start({ showAlert: false });
      console.log("BLE Module initialized");
    }

    // Xóa list device trước khi scan
    hookProps.setState(state => {
      state.ble.listNewDevice = [];
      return { ...state };
    });

    // Listener phát hiện thiết bị
    const discoverListener = bleManagerEmitter.addListener(
      "BleManagerDiscoverPeripheral",
      (peripheral) => {
        const advName = peripheral?.advertising?.localName;
        const deviceName = advName || peripheral.name || "Unknown";

        console.log("📡 Found device:", { id: peripheral.id, name: deviceName });

        hookProps.setState(state => {
          const exists = state.ble.listNewDevice.some(d => d.id === peripheral.id);
          if (!exists) {
            state.ble.listNewDevice.push({
              id: peripheral.id, name: deviceName,
              rssi: 0
            });
          }
          return { ...state };
        });
      }
    );

    // Bắt đầu quét
    await sleep(500); // delay để tránh lấy tên cũ
    BleManager.scan([], 5, true).then(() => {
      console.log("🔍 Scan started");
      hookProps.setState(state => {
        state.ble.isScan = true;
        return { ...state };
      });

      setTimeout(async () => {
        await BleManager.stopScan();
        console.log("🛑 Scan stopped");
        hookProps.setState(state => {
          state.ble.isScan = false;
          return { ...state };
        });
        discoverListener.remove();
      }, 5000);
    });
  } catch (err: any) {
    console.log(TAG, 'err:', err);
    showAlert("Thiết bị cần được bật Bluetooth");
  }
};

export const disConnect = async (id: string) => {
  try {
    console.log('🔌 Disconnect peripheral:', id);
    await BleManager.disconnect(id, true);

    // Xóa cache sau khi disconnect
    await BleManager.removePeripheral(id).catch(() => {});
    if (Platform.OS === 'android') {
      await BleManager.removeBond(id).catch(() => {});
    }

    store.setState(state => {
      state.hhu.name = '';
      state.hhu.idConnected = '';
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });

    ObjSend.id = null;
  } catch (err) {
    console.log("⚠️ disconnect error:", err);
  }
};
