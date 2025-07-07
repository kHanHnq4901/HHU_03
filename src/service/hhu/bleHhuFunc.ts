import * as Ble from '../../util/ble';
import AsyncStorage from '@react-native-community/async-storage';
import { Buffer } from 'buffer';
import { HhuObj, ObjSend, readVersion, ShakeHand } from './hhuFunc';
import {
  BufferToString,
  ByteArrayToString,
  showAlert,
  showToast,
  sleep,
} from '../../util';
import BleManager from 'react-native-ble-manager';
import { PropsStore } from '../../store';
import { checkUpdateHHU } from '../api';
import { Platform } from 'react-native';

const KEY_STORAGE = 'BLE_INFO';
const TAG = 'Ble Func:';

type PropsBleInfo = {
  id: string;
};

// type IdentityFrameType = {
//   u32Tick: number;
//   u16Length: number;
//   au8IdentityBuff: any[];
//   u8CountRecIdentity: number;
//   bActive: boolean;
//   bIdentityFinish: boolean;
// };

// const HhuObj.identityFrame: IdentityFrameType = {
//   u32Tick: 0,
//   u16Length: 0,
//   au8IdentityBuff: new Array(5),
//   u8CountRecIdentity: 0,
//   bActive: false,
//   bIdentityFinish: false,
// };

export const BleFunc_StartNotification = async (id: string) => {
  console.log('start notification');
  await Ble.startNotification(id);
};

export const BleFunc_StopNotification = async (id: string) => {
  console.log('stop notification');
  await Ble.stopNotification(id);
};

export const BleFunc_Send = async (id: string, data: any[]) => {
  try {
    let dumy: any[] = [];
    dumy.push(0xfe);
    dumy.push(0xfe);
    dumy.push(data.length & 0xff);
    dumy.push((data.length >> 8) & 0xff);
    dumy.push((dumy[2] + dumy[3]) & 0xff);
    //await Ble.send(id, dumy);
    //await Ble.send(id, dumy);

    for (let i = 0; i < data.length; i++) {
      dumy.push(data[i]);
    }

    await Ble.send(id, dumy);

    //console.log(dumy);
    // console.log(data);
  } catch (err: any) {
    console.log(err);
  }
};

export const BleFunc_SaveStorage = async (id: string) => {
  const item: PropsBleInfo = {
    id: id,
  };
  try {
    AsyncStorage.setItem(KEY_STORAGE, JSON.stringify(item));
  } catch (err: any) {
    console.log(TAG, String(err));
  }
};

export const BleFunc_TryConnectToLatest = async (): Promise<{
  result: boolean;
  id: string;
}> => {
  try {
    const resString = await AsyncStorage.getItem(KEY_STORAGE);
    if (resString) {
      const data = JSON.parse(resString) as PropsBleInfo;
      let result;

      console.log('try connect to data.id: ', data.id);
      // if (Platform.OS === 'ios') {
      //   await BleManager.refreshCache(data.id);
      // }
      for (let i = 0; i < 1; i++) {
        result = await Ble.connect(data.id);

        console.log('Connect result: ', result);
        if (result) {
          break;
          // await Ble.startnotification(data.id);
          // const dumy = [0];
          // await Ble.send(data.id, dumy);
          // await Ble.stopNotification(data.id);
        }
        await sleep(500);
      }

      return { result: result, id: data.id };
    } else {
      return { result: false, id: null };
    }
  } catch (err: any) {
    console.log(TAG, String(err) + new Error().stack);
  }
  return { result: false, id: null };
};

export async function initModuleBle() {
  await BleManager.start({ showAlert: false });
}

export const connectLatestBLE = async (store: PropsStore) => {
  console.log(TAG, 'try connect to latest');

  store.setState(state => {
    state.hhu.connect = 'CONNECTING';
    return { ...state };
  });

  let isEnable = true;
    try {
      await BleManager.enableBluetooth();
    } catch (error) {
      isEnable = false;
  }
  if (isEnable !== true) {
    store.setState(state => {
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });
    //if (Platform.OS === 'android')
    showAlert('Thiết bị chưa được bật bluetooth');
    return;
  }
  showToast('Đang thử kết nối với thiết bị Bluetooth trước đó ...');
  let data = await BleFunc_TryConnectToLatest();
  console.log('k');
  if (data.result) {
    let rssi: number = 0;
    // try {
    //   rssi = await BleManager.getRssi(data.id);
    // } catch (err: any) {
    //   console.log(TAG, err.message);
    // }

    store.setState(state => {
      state.hhu.connect = 'CONNECTED';
      state.hhu.idConnected = data.id;
      state.hhu.rssi = rssi;
      return { ...state };
    });
    ObjSend.id = data.id;
    let result;
    for (let k = 0; k < 2; k++) {
      await sleep(500);
      result = await ShakeHand();
      if (result === true || result === 1) {
        ObjSend.isShakeHanded = true;
        break;
      } else {
        ObjSend.isShakeHanded = false;
      }

      console.log('Try shakehand');
    }
    if (ObjSend.isShakeHanded === false) {
      console.log('ShakeHand failed. Disconnect');
      showToast('ShakeHand failed. Disconnect');
      await BleManager.disconnect(ObjSend.id, true);
    } else {
      showToast('Bắt tay thành công');
      if (result === true) {
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
      }
    }
  } else {
    store.setState(state => {
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });
    console.log(TAG + 'hhu:', data);
    showToast('Kết nối bluetooth thất bại');
  }
};

export const handleUpdateValueForCharacteristic = (data: any[]) => {
  //console.log('data update for characteristic:', data.value);
  // console.log('Rec ' + Date.now());
  // console.log(ByteArrayToString(data.value, 16, true));
  const receiveData = data.value as number[];

  for (let i = 0; i < receiveData.length; i++) {
    const rxData = receiveData[i] & 0xff;
    // Dbg_Print1("%ld-", rxData);
    if (HhuObj.identityFrame.bActive === false) {
      HhuObj.identityFrame.bActive = true;
      HhuObj.identityFrame.u8CountRecIdentity = 0;
      HhuObj.identityFrame.bIdentityFinish = false;
    }
    if (HhuObj.identityFrame.bIdentityFinish === false) {
      HhuObj.identityFrame.au8IdentityBuff[
        HhuObj.identityFrame.u8CountRecIdentity
      ] = rxData;
      HhuObj.identityFrame.u8CountRecIdentity++;
      if (
        HhuObj.identityFrame.u8CountRecIdentity ===
        HhuObj.identityFrame.au8IdentityBuff.length
      ) {
        if (
          HhuObj.identityFrame.au8IdentityBuff[0] === 0xfe &&
          HhuObj.identityFrame.au8IdentityBuff[1] === 0xfe
        ) {
          if (
            ((HhuObj.identityFrame.au8IdentityBuff[2] +
              HhuObj.identityFrame.au8IdentityBuff[3]) &
              0xff) !==
            (HhuObj.identityFrame.au8IdentityBuff[4] & 0xff)
          ) {
            HhuObj.identityFrame.bActive = false;
          } else {
            HhuObj.identityFrame.bIdentityFinish = true;
            HhuObj.identityFrame.u16Length =
              (HhuObj.identityFrame.au8IdentityBuff[2] & 0xff) |
              ((HhuObj.identityFrame.au8IdentityBuff[3] & 0xff) << 8);
            HhuObj.countRec = 0;
          }
        } else {
          HhuObj.identityFrame.bActive = false;
        }
      }
    } else if (HhuObj.identityFrame.bIdentityFinish === true) {
      HhuObj.buffRx[HhuObj.countRec] = rxData;

      HhuObj.countRec = (HhuObj.countRec + 1) % HhuObj.buffRx.byteLength;
      if (HhuObj.countRec === HhuObj.identityFrame.u16Length) {
        // console.log('Rec a frame: ' + HhuObj.countRec + ' bytes:');
        // const arrb = [];
        // for (let k = 0; k < HhuObj.countRec; k++) {
        //   arrb.push(HhuObj.buffRx[k]);
        // }
        // console.log(ByteArrayToString(arrb, 16, true));
        HhuObj.flag_rec = true;
        HhuObj.identityFrame.bActive = false;
      }
    }
  }
};
