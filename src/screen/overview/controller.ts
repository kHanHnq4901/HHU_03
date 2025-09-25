import Geolocation from '@react-native-community/geolocation';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, EmitterSubscription, EventSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import * as permission from 'react-native-permissions';
import {
  requestBluetoothPermissions,
  requestPermissionBleConnectAndroid,
  requestPermissionGPSAndroid,
  requestPermissionGPSIos,
  requestPermissionScan,
} from '../../service/permission';
import { PropsStore, storeContext } from '../../store';
import BleManager from 'react-native-ble-manager';
import { onScanPress } from './handleButton';
import { showAlert, showToast } from '../../util';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackRootParamsList } from '../../navigation/model/model';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import { ObjSend } from '../../service/hhu/hhuFunc';
import { PropsLineModel, PropsMeterDataModel, PropsMeterModel, TABLE_NAME_INFO_LINE, TABLE_NAME_INFO_METER, TABLE_NAME_METER_DATA } from '../../database/entity';
import { checkTabelDBIfExist, getDBConnection } from '../../database/repository';
import { useFocusEffect } from '@react-navigation/native';
  let hhuDiscoverPeripheral: EventSubscription | null= null;
  let hhuDisconnectListener: EventSubscription | null = null;
  let hhuReceiveDataListener: EventSubscription | null = null;
export type PropsItemBle = {
  isConnectable?: boolean;
  name: string;
  id: string;
  rssi?: number;
};

type PropsBLE = {
  isScan: boolean;

  listBondedDevice: PropsItemBle[];
  listNewDevice: { name: string; id: string; rssi: number }[];
  // idConnected: string | null;
};

export type HookState = {
  status: string;
  ble: PropsBLE;
  listMeter: PropsMeterModel[];
  statusCount: { [status: number]: number }; 
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = 'Ble Controller: ';

export const hookProps = {} as HookProps;

export let store = {} as PropsStore;


const BleManagerModule = NativeModules.BleManager;

let enableLocationHook = {} as {
  enabled: any;
  requestResolution: () => void;
};

export const requestGps = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return true;
  }
  try {
    const value = await turnOnLocation();
    if (value === true) {
      if (Platform.OS === 'android') {
        if (enableLocationHook.enabled !== true) {
          enableLocationHook.requestResolution();
          return true;
        } else {
        }
      }

      return true;
    }
    if (value === false) {
      setStatus('Bật GPS cho chức năng tìm kiếm thiết bị Bluetooth');
    }
  } catch (err :any) {
    setStatus('Lỗi: ' + err.message);
  }

  return false;
};

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    status: '',
    ble: {
      isScan: false,
      listBondedDevice: [],
      listNewDevice: [],
    },
    listMeter: [],
    statusCount: {},
  });

  // Hàm load dữ liệu tách riêng để tái sử dụng
  const fetchData = useCallback(async () => {
    try {
      const db = await getDBConnection();
      if (!db) return;

      await checkTabelDBIfExist();
      const meterResults = await db.executeSql(
        'SELECT * FROM ' + TABLE_NAME_INFO_METER
      );
      const listMeter = meterResults[0].rows.raw() as PropsMeterModel[];
      const statusCount: { [status: number]: number } = {};

      listMeter.forEach((item) => {
        const status = (item as any).STATUS ?? 0;
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      setState((prev) => ({
        ...prev,
        listMeter,
        statusCount,
      }));
    } catch (error) {
      console.error('❌ Lỗi khi load dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu từ database.');
    }
  }, []);

  // Load khi màn hình focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  hookProps.state = state;
  hookProps.setState = setState;
  store = useContext(storeContext) as PropsStore;

  return hookProps;
};

const handleStopScan = async () => {
  console.log('event stop scan');

  hookProps.setState(state => {
    state.ble.isScan = false;
    return { ...state };
  });
  // const ret = await BleManager.getDiscoveredPeripherals([]);
  // console.log('ret:', ret);
};

export const setStatus = (status: string) => {
  hookProps.setState(state => {
    state.status = status;
    return { ...state };
  });
};

const handleDidUpdateState = (obj: { state: any; }) => {
  console.log('handleDidUpdateState:', obj.state);
  // const state = obj.state;
  // if (state === 'on') {
  //   console.log('state:', state);
  //   BleManager.scan([], 15, false)
  //     .then(() => {
  //       hookProps.setState(state => {
  //         state.ble.isScan = true;
  //         return { ...state };
  //       });
  //     })
  //     .catch(resFail => {
  //       console.log('fail: ', resFail);
  //     });
  // }
};
export const hhuHandleDisconnectedPeripheral = async (data: any) => {
  store.setState(state => {
    state.hhu.name = '';
    state.hhu.idConnected = '';
    state.hhu.connect = 'DISCONNECTED';
    return { ...state };
  });
  console.log (store.state.hhu.connect)
  ObjSend.id = null;
  showToast('Thiết bị đã ngắt kết nối')
};
export const handleDiscoverPeripheral = (peripheral: any) => {
  const connectedId = store?.state.hhu.idConnected;

  // Tạo Map từ list hiện tại
  const peripherals = new Map(
    hookProps.state.ble.listNewDevice.map(itm => [itm.id, itm])
  );

  let res = peripheral as {
    advertising: {
      isConnectable: boolean;
      manufacturerData: any;
      serviceData: any;
      serviceUUIDs: [];
      txPowerLevel: number;
    };
    id: string;
    name: null | string;
    rssi: number;
  };

  // Bỏ qua nếu là thiết bị đang connect
  if (res.id === connectedId) {
    return;
  }

  // Chỉ lưu thiết bị có tên & có thể kết nối
  if (res.name && res.advertising?.isConnectable) {
    peripherals.set(res.id, {
      name: res.name,
      id: res.id,
      rssi: res.rssi
    });

    hookProps.setState(state => {
      state.ble.listNewDevice = Array.from(peripherals.values());
      return { ...state };
    });
  }
};


export const onInit = async (navigation: StackNavigationProp<StackRootParamsList>) => {
  try {
    // Cấu hình GPS
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'playServices',
    });
    Geolocation.requestAuthorization();

    // Xin quyền Bluetooth
    const requestScanPermission = await requestBluetoothPermissions();
    if (requestScanPermission) {
      if (Platform.OS === 'android') {
        await BleManager.start({ showAlert: false });
      }

      try {
        await BleManager.enableBluetooth(); // Không throw nghĩa là đã bật Bluetooth

        if (Platform.OS === 'android') {
          const list = await BleManager.getBondedPeripherals();
          hookProps.setState(state => {
            state.ble.listBondedDevice = list.map(item => ({
              id: item.id,
              isConnectable: item.advertising?.isConnectable ?? false,
              name: item.name ?? '',
            }));
            return { ...state };
          });
        }
      } catch {
        showAlert('Thiết bị cần được bật bluetooth');
      }
    }

     // 🔌 Setup BLE event listeners — đảm bảo chỉ 1 lần
      if (!hhuDiscoverPeripheral) {
        hhuDiscoverPeripheral = BleManager.onDiscoverPeripheral(
          handleDiscoverPeripheral
        );
      }

      // if (!hhuReceiveDataListener) {
      //   hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
      //     hhuHandleReceiveData
      //   );
      // }

      if (!hhuDisconnectListener) {
        hhuDisconnectListener = BleManager.onDisconnectPeripheral(
          hhuHandleDisconnectedPeripheral
        );
      }
    BleManager.onStopScan(handleStopScan);

    // BleManager.onDisconnectPeripheral((data: { peripheral: any; }) => {
    //   console.log('Peripheral disconnected:', data.peripheral);
    // });
    setStatus('');
  } catch (err: any) {
    setStatus('Lỗi: ' + err.message);
  }
};

export const onDeInit = () => {

};


type PropsListBondBle = {
  advertising: {
    isConnectable?: boolean;
    localName?: string;
    manufacturerData?: any;
  };
  id: string;
  name: string;
  rssi: 0;
};
export const turnOnLocation = async (
  requestBle?: boolean,
): Promise<boolean> => {
  let ok: boolean = false;

  let result: permission.PermissionStatus = 'denied';

  if (Platform.OS === 'ios') {
    return await requestPermissionGPSIos();
  } else {
    if (requestBle !== false) {
      ok = await requestPermissionBleConnectAndroid();
    }
    ok = await requestPermissionGPSAndroid();
    return ok;
  }
};
