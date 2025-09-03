import { Alert, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { sleep } from '.';
import { Buffer } from 'buffer'; // cần import Buffer
import { handleUpdateValueForCharacteristic } from '../service/hhu/bleHhuFunc';
const TAG = 'Ble.ts:';

let service: string ;
let characteristic: string;

export const requestBlePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    try {
      let allow = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (allow) {
        return true;
      } else {
        let granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        console.log(granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('permission is ok');
        } else {
          console.log('permission is denied');
        }
      }
    } catch {}
  }
  return Promise.resolve(true);
};

export const connect = async (id: string): Promise<boolean> => {
  for (let i = 0; i < 2; i++) {
    try {
      await BleManager.stopScan();
      // let waitOk = false;
      // setTimeout(() => {
      //   if (waitOk === false) {
      //     console.log('connect timeout, disconnect');

      //     BleManager.disconnect(id);
      //   }
      // }, 5000);
      await BleManager.connect(id);
      //waitOk = true;
      //BleManager.createBond(id);
      return true;
    } catch (err: any) {
      console.log(TAG, err);
      console.log('aaa id:', id);

      return false;
    }
    await sleep(1000);
  }
  return false;
};

export const startNotification = async (idPeripheral: string) => {
  try {
    const res = await BleManager.retrieveServices(idPeripheral);

    const info = res as unknown as {
      characteristics: {
        characteristic: string;
        service: string;
        properties?: {
          Notify?: 'Notify';
          Read?: 'Read';
          Write?: 'Write';
          WriteWithoutResponse?: 'WriteWithoutResponse';
        };
      }[];
    };


    let element = info.characteristics.find(element => {
      return (
        element.characteristic &&
        element.properties?.Write &&
        element.properties?.Notify &&
        element.service
      );
    });
    console.log('element:', element);
    if (!element) {
      console.log(TAG, 'no find element');
      return;
    }
    service = element.service;
    characteristic = element.characteristic;
    
    BleManager.startNotification(
      idPeripheral, service, characteristic
    )
      .then(() => {
        
        console.log("Notification started");
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
   
  } catch (err: any) {
    console.log(TAG, err);
  }
};

export const send = async (idPeripheral: string, data: number[]) => {
  try {
    const isConnected = await BleManager.isPeripheralConnected(idPeripheral, []);

    if (!isConnected) {
      Alert.alert('Chưa kết nối với thiết bị');
      return; // hoặc tự reconnect rồi mới ghi
    }

    // 🟢 Nếu đã kết nối thì ghi
    await BleManager.write(idPeripheral, service, characteristic, data);

    console.log(TAG + "Data sent:", data);
  } catch (err: any) {
    console.log(TAG + "Error sending:", err);
  }
};
function toHexString(byteArray: number[]) {
  return byteArray
    .map(b => b.toString(16).padStart(2, '0')) // Chuyển sang hex, thêm 0 nếu 1 ký tự
    .join(' ');
}
export const stopNotification = async (idPeripheral: string) => {
  try {
    await BleManager.stopNotification(idPeripheral, service, characteristic);
  } catch (err: any) {
    console.log(TAG, err);
  }
};
