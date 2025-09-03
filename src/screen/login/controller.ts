import React, { useState } from 'react';
import {
  LoginModeType,
  updateValueAppSettingFromNvm,
} from '../../service/storage';
import { PropsStore, TYPE_TOUCH_ID, storeContext } from '../../store';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { StackRootNavigationProp } from '../../navigation/model/model';
import { Alert, TextInput } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getUserStorage } from '../../service/storage/user';
import TouchID from 'react-native-touch-id';
import { showAlert, showToast } from '../../util';
import { onFingerPress } from './handleButton';
import { checkUpdateFromStore } from '../../service/user';

const TAG = 'Login Controller';

type PropsHookState = {
  status: string;
  user: string;
  password: string;
  imeiDevice: string;
  btnSignInBusy: boolean;
  showPassword: boolean;
};

type PropsHook = {
  state: PropsHookState;
  setState: React.Dispatch<React.SetStateAction<PropsHookState>>;
  refPassword: React.RefObject<TextInput>;
};

export const hookProps = {} as PropsHook;
export let store = {} as PropsStore;
export let navigation = {} as StackRootNavigationProp;

export const GetHookProps = (): PropsHook => {
  const [state, setState] = useState<PropsHookState>({
    status: '',
    user: '',
    password: '',
    imeiDevice: '',
    btnSignInBusy: false,
    showPassword: false,
  });
  hookProps.state = state;
  hookProps.setState = setState;

  store = React.useContext(storeContext);

  navigation = useNavigation<StackRootNavigationProp>();


  return hookProps;
};
let firstTime = true;

export const olState = {
  userName: '',
  loginMode: '',
  imeiDevice: '',
};
let bFirstTimeGetStorage = true;
export const onInit = async () => {
  navigation.addListener('focus', async () => {
    hookProps.setState(state => {
      state.password = '';
      return { ...state };
    });

    if (true) {
      bFirstTimeGetStorage = false;
      const appSetting = await updateValueAppSettingFromNvm();

      let typeTouchID: TYPE_TOUCH_ID = 'TouchID';
      try {
        let isSupport = await TouchID.isSupported();
        if (isSupport === 'FaceID') {
          typeTouchID = 'FaceID';
        } else if (isSupport === 'TouchID') {
          typeTouchID = 'TouchID';
        }
      } catch (err: any) {
        typeTouchID = 'NoSupport';
      } finally {
      }


      // console.log('appSetting', appSetting);

      store.setState(state => {
        state.appSetting = appSetting;
        state.typeTouchID = typeTouchID;
        return { ...state };
      });

      if (appSetting.server.host.trim().length === 0) {
        // showToast('Cấu hình địa chỉ IP');
        // navigation.navigate('SettingIPPort');
        return;
      } else {
        if (
          firstTime &&
          typeTouchID === 'TouchID' 
        ) {
          firstTime = false;
          console.log('here');
          onFingerPress(false);
        }
      }
    }
  });
  try {
    const user = await getUserStorage();
    hookProps.state.user = user.userAccount;

    olState.userName = user.userAccount;
    olState.imeiDevice = user.code;

    const { data }: { data: string } = await axios.get(
      'http://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh',
    );
    const onlineDate = new Date(data);
    const curDate = new Date();
    const secDif = (curDate.getTime() - onlineDate.getTime()) / 1000;
    if (Math.abs(secDif) > 120) {
      Alert.alert(
        'Thời gian sai',
        'Thời gian của thiết bị chưa đúng, vui lòng chỉnh lại để đám bảo tính đúng của dữ liệu khi ghi chỉ số',
      );
    } else {
      console.log(TAG, 'time is true');
    }
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  try {
    const deviceId = await DeviceInfo.getUniqueId();

    console.log('deviceId1:', deviceId);

    let imeiDevice = '';

    if (deviceId !== olState.imeiDevice && olState.imeiDevice?.length > 2) {
      const loginMode = olState.loginMode as unknown as LoginModeType;
      if (loginMode === 'NPC' || loginMode === 'ĐL Hà Nội') {
        // await showAlert(
        //   'Bạn muốn chọn imei device nào ?',
        //   {
        //     label: 'imei cũ',
        //     func: () => {
        //       imeiDevice = olState.imeiDevice;
        //     },
        //   },
        //   {
        //     label: 'imei thiết bị',
        //     func: () => {
        //       imeiDevice = deviceId;
        //     },
        //   },
        // );
        imeiDevice = olState.imeiDevice;
      } else {
        imeiDevice = deviceId;
      }
    } else {
      imeiDevice = deviceId;
    }

    hookProps.setState(state => {
      state.imeiDevice = imeiDevice;
      return { ...state };
    });

    //checkUpdateFromStore();
  } catch {}
  // // const imeiDevice = '356136106876529';
  // hookProps.setState(state => {
  //   state.imeiDevice = imeiDevice; //deviceId;
  //   store.state.online.moreInfoUser.imeiDevice = imeiDevice;
  //   return { ...state };
  // });
};
