import { useContext } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  EmitterSubscription,
  EventSubscription,
  Platform,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import RNFS from 'react-native-fs';
import { checkTabelDBIfExist } from '../../../database/repository';
import {
  UpdateDataSeriVersionToLocaleVariable,
  UpdateFirstTimeSeriVersion,
} from '../../../database/service/matchSeriVersionService';
import { onReceiveSharingIntent } from '../../../service/event';
import { UPDATE_FW_HHU } from '../../../service/event/constant';
import {
  connectLatestBLE,
  handleUpdateValueForCharacteristic as hhuHandleReceiveData,
  initModuleBle,
} from '../../../service/hhu/bleHhuFunc';
import { InitSTARMeter, ObjSend } from '../../../service/hhu/hhuFunc';
import {
  requestPermissionBleConnectAndroid,
  requestPermissionWriteExternalStorage,
} from '../../../service/permission';
import { updateValueAppSettingFromNvm } from '../../../service/storage';
import { UpdateMaCongToObjFromStorageAndServer } from '../../../service/storage/maCongTo';
import {
  PATH_EXECUTE_CSDL,
  PATH_EXPORT_EXCEL,
  PATH_EXPORT_LOG,
  PATH_EXPORT_XML,
  PATH_IMPORT_CSDL,
  PATH_IMPORT_XML,
} from '../../../shared/path';
import { PropsStore, storeContext } from '../../../store';
import { handleDiscoverPeripheral, hhuHandleDisconnectedPeripheral } from '../../../screen/overview/controller';

const TAG = 'controllerDrawerContent:';

export let store = {} as PropsStore;



let hhuDiscoverPeripheral: EventSubscription | null ;
let hhuDisconnectListener: EventSubscription | null = null;
let hhuReceiveDataListener: EventSubscription | null = null;

let updateFWListener: EmitterSubscription | undefined;

export const GetHookProps = () => {
  store = useContext(storeContext);
};

let intervalCheckAppUpdate;
function checkUpdateAppMobileInterval() {
  // if (intervalCheckAppUpdate) {
  // } else {
  //   checkUpdateAppMobile();
  //   intervalCheckAppUpdate = setInterval(() => {
  //     console.log('check update app mobile ....');
  //     checkUpdateAppMobile();
  //   }, 5 * 60 * 1000); //
  // }
}




export const onInit = async (navigation: any) => {
  let appSetting = await updateValueAppSettingFromNvm();
  store?.setState(state => {
    state.appSetting = appSetting;
    return { ...state };
  });

  // 🔌 Setup BLE event listeners — đảm bảo chỉ 1 lần
  if (!hhuDiscoverPeripheral) {
    hhuDiscoverPeripheral = BleManager.onDiscoverPeripheral(
      handleDiscoverPeripheral
    );
  }

  if (!hhuReceiveDataListener) {
    hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
      hhuHandleReceiveData
    );
  }

  if (!hhuDisconnectListener) {
    hhuDisconnectListener = BleManager.onDisconnectPeripheral(
      hhuHandleDisconnectedPeripheral
    );
  }
  try {
    await initModuleBle();

    // init HHM meter
    InitSTARMeter();

    if (store?.state.hhu.connect === 'DISCONNECTED') {
      let requestScan = true;
      if (Platform.OS === 'android') {
        requestScan = await requestPermissionBleConnectAndroid();
      }
      if (requestScan) {
        connectLatestBLE(store);
      }
    }
  } catch (err: any) {
    store?.setState(state => {
      state.hhu.idConnected = '';
      state.hhu.connect = 'DISCONNECTED';
      return { ...state };
    });
    console.log(TAG, 'err:', err);
  }

  try {
    let result = await requestPermissionWriteExternalStorage();

    if (result === true) {
      try {
        let folderExist = await RNFS.exists(PATH_IMPORT_CSDL);
        if (!folderExist) {
          console.log('create folder for list csdl');
          await RNFS.mkdir(PATH_IMPORT_CSDL);
        }

        folderExist = await RNFS.exists(PATH_EXECUTE_CSDL);
        if (!folderExist) {
          console.log('create folder for excecute csdl');
          await RNFS.mkdir(PATH_EXECUTE_CSDL);
        }

        folderExist = await RNFS.exists(PATH_IMPORT_XML);
        if (!folderExist) {
          await RNFS.mkdir(PATH_IMPORT_XML);
        }

        folderExist = await RNFS.exists(PATH_EXPORT_XML);
        if (!folderExist) {
          await RNFS.mkdir(PATH_EXPORT_XML);
        }

        folderExist = await RNFS.exists(PATH_EXPORT_LOG);
        if (!folderExist) {
          await RNFS.mkdir(PATH_EXPORT_LOG);
        }

        folderExist = await RNFS.exists(PATH_EXPORT_EXCEL);
        if (!folderExist) {
          console.log('create folder for export csdl');
          await RNFS.mkdir(PATH_EXPORT_EXCEL);
        }
      } catch (err: any) {
        console.log(TAG, err.message);
      }

      onReceiveSharingIntent();

      await checkTabelDBIfExist();
      const rest = await UpdateDataSeriVersionToLocaleVariable();
      if (rest !== true) {
        console.log(TAG, 'update first time version');
        await UpdateFirstTimeSeriVersion();
      }

      await UpdateMaCongToObjFromStorageAndServer();
      checkUpdateAppMobileInterval();
    }
  } catch (err: any) {
    console.log(TAG, err);
  }

  // 🔄 Update FW listener — chỉ 1 lần
  if (!updateFWListener) {
    updateFWListener = DeviceEventEmitter.addListener(UPDATE_FW_HHU, () => {
      Alert.alert('Cập nhật HHU', 'Cập nhật phần mềm cho thiết bị cầm tay', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('BoardBLE', {
              title: 'Thiết bị cầm tay',
              info: 'Cập nhật phần mềm cho thiết bị cầm tay',
              isUpdate: true,
            });
          },
          style: 'default',
        },
      ]);
    });
  }
};




export const onDeInit = async () => {
  console.log('remove listener ble');
  // if (hhuDisconnectListener) {
  //   hhuDisconnectListener.remove();
  // }
  // if (hhuReceiveDataListener) {
  //   hhuReceiveDataListener.remove();
  // }
  if (updateFWListener) {
    updateFWListener.remove();
  }
  updateFWListener = undefined;
  hhuDisconnectListener = null;
  hhuReceiveDataListener = null;
};
