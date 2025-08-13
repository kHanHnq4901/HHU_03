import { checkUpdateHHU } from '../../service/api';
import { BleFunc_SaveStorage } from '../../service/hhu/bleHhuFunc';
import { ObjSend, ShakeHand, readVersion } from '../../service/hhu/hhuFunc';
import { requestBluetoothPermissions, requestPermissionScan } from '../../service/permission';
import BleManager from 'react-native-ble-manager';
import * as Ble from '../../util/ble';
import { showAlert, sleep } from '../../util';
import { hookProps, requestGps, setStatus, store } from './controller';
import { Platform } from 'react-native';

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
        //     await BleFunc_StartNotification(id);
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
        state.hhu.connect = 'DISCONNECTED';
        return { ...state };
      });
      setStatus('Kết nối thất bại: ' + err.message);
    }

    if (succeed) {
      setStatus('Kết nối thành công');
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
      const result = await ShakeHand();
      if (result === true) {
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
      } else if (result === 1) {
        setStatus('Cần nạp firmware HHU');
      } else {
        setStatus('Bắt tay thất bại');
        ObjSend.isShakeHanded = false;
        BleManager.disconnect(ObjSend.id, true);
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

export const onScanPress = async () => {
  if (hookProps.state.ble.isScan) {
    return;
  }

  hookProps.setState(state => {
    state.ble.listNewDevice = [];
    state.status = '';
    return { ...state };
  });

  const requestScanPermission = await requestBluetoothPermissions();

  try {
    if (requestScanPermission) {
      console.log('here request');

      try {
        await BleManager.enableBluetooth(); // Nếu bị từ chối sẽ throw error

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


