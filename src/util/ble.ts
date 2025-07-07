import { PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { sleep } from '.';

const TAG = 'Ble.ts:';

let service: string | null = null;
let characteristic: string | null = null;

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

      //Promise.reject(err);
    }
    await sleep(1000);
  }
  return false;
};

export const startNotification = async (idPeripheral: string) => {
  try {
    console.log('idPeripheral:', idPeripheral);
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

    // for(let i = 0; i < info.characteristics.length; i++){

    //   if(info.characteristics[i].characteristic?.length > 20 && info.characteristics[i].service?.length > 20){

    //   }
    // }

    //console.log(TAG, 'info: ' + String(info));

    //console.log(TAG, JSON.stringify(info.characteristics));
    //console.log(TAG, 'length:', info.characteristics.length);
    let element = info.characteristics.find(element => {
      return (
        element.characteristic &&
        element.properties?.Write &&
        element.properties?.Notify &&
        element.service
      );
    });
    //console.log('element:', element);
    if (!element) {
      console.log(TAG, 'no find element');
      return;
    }
    service = element.service;
    characteristic = element.characteristic;

    // console.log('service:', service);
    // console.log('characteristic:', characteristic);

    await BleManager.startNotification(idPeripheral, service, characteristic);
  } catch (err: any) {
    console.log(TAG, err);
  }
};

export const send = async (idPeripheral: string, data: any[]) => {
  try {
    //console.log('Service UUID: ', service);
    //console.log('characteristic UUID: ', characteristic);

    await BleManager.write(idPeripheral, service, characteristic, data);
  } catch (err: any) {
    console.log(TAG + 'here:', err);
  }
};

export const stopNotification = async (idPeripheral: string) => {
  try {
    await BleManager.stopNotification(idPeripheral, service, characteristic);
  } catch (err: any) {
    console.log(TAG, err);
  }
};
