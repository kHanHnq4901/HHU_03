import { Alert } from 'react-native';
import { screenDatas } from '../../shared';
import { isValidText, showAlert, showSnack } from '../../util';
import { hookProps, navigation, olState, store } from './controller';
import { sha256 } from 'react-native-sha256';
import TouchID from 'react-native-touch-id';
import * as Keychain from 'react-native-keychain';
import {
  PropsLoginServerDLHNReturn,
  PropsLoginServerNPCReturn,
  endPoints,
  login,
  loginDLHN,
  loginNPC,
} from '../../service/api/serverData';
import { getUserStorage, saveUserStorage } from '../../service/storage/user';
import { saveValueAppSettingToNvm } from '../../service/storage';
import { PropsCommonResponse } from '../../service/api';
import { getDefaultIPPort } from '../settingIPportScreen/handle';
import DeviceInfo from 'react-native-device-info';
import SoapRequest from 'react-native-soap-request';
import xml2js, { parseString } from 'react-native-xml2js';
import { exportDateToExcel } from '../../util/excel';

const TAG = 'Handle Button Login:';
type PropsLogin = {
  userAccount: string;
  password: string;
};

async function testSOAP() {
  try {
  } catch (err: any) {
    console.log(TAG, err.message);
  }
}

export async function onGetImageDevicePress() {
  try {
    const deviceId = await DeviceInfo.getUniqueId();

    console.log('deviceId1:', deviceId);

    let imeiDevice = '';

    if (deviceId !== olState.imeiDevice && olState.imeiDevice?.length > 2) {
      await showAlert(
        'Bạn muốn chọn imei device nào ?',
        {
          label: 'imei cũ',
          func: () => {
            imeiDevice = olState.imeiDevice;
          },
        },
        {
          label: 'imei thiết bị',
          func: () => {
            imeiDevice = deviceId;
          },
        },
      );
    } else {
      imeiDevice = deviceId;
    }

    hookProps.setState(state => {
      state.imeiDevice = imeiDevice;
      return { ...state };
    });
  } catch (err: any) {
    console.log(TAG, err.message);
  }
}

async function _AuthenticateOffline(pass: string): Promise<boolean> {
  const hash = await sha256(pass);

  //console.log('hash:', hash);
  //console.log('storageVariable.passwordSx:', store.state.appSetting.passwordSx);

  if (
    hash !== store.state.appSetting.password &&
    hash !== store.state.appSetting.passwordAdmin &&
    hash !== store.state.appSetting.passwordDVKH &&
    hash !== store.state.appSetting.passwordSx
  ) {
    // console.log('hash:' , hash);
    // console.log('password:' , store?.state.appSetting.password);

    return false;
  }
  store.setState(state => {
    if (hash === store?.state.appSetting.passwordAdmin) {
      state.userRole = 'admin';
    } else if (hash === store?.state.appSetting.passwordDVKH) {
      state.userRole = 'dvkh';
    } else if (hash === store?.state.appSetting.passwordSx) {
      state.userRole = 'sx';
    } else {
      state.userRole = 'customer';
    }

    return { ...state };
  });
  return true;
}

export async function onLoginPress(props?: PropsLogin) {
  console.log("đã click vào button")
  let loginSucceed = false;
  let hasSetDefaultIPPort = false;
  const defaultHostPort = getDefaultIPPort();
  // Gán host/port mặc định nếu chưa có
  if (store.state.appSetting.server.host.trim().length === 0) {
    store.state.appSetting.server.host = defaultHostPort.host;
    store.state.appSetting.server.port = defaultHostPort.port;
    hasSetDefaultIPPort = true;
  }

  let user = hookProps.state.user.trim();
  let pass = hookProps.state.password.trim();
  hookProps.setState(state => {
    state.btnSignInBusy = true;
    return { ...state };
  });

  let rest: PropsCommonResponse = {
    obj: null,
    bSucceed: false,
    strMessage: '',
  };
  console.log("user " + user ) 
  console.log("pass " + pass ) 
  rest = await login({
    userName: user,
    password: pass,
  });

  if (rest.bSucceed === false && hasSetDefaultIPPort) {
    store.state.appSetting.server.host = '';
    store.state.appSetting.server.port = '';
  }

  if (rest.bSucceed) {
    store.state.loginInfo = rest.obj;
    loginSucceed = true;

    const objKeyChain = await Keychain.getGenericPassword();

    if (
      user !== olState.userName ||
      objKeyChain === false ||
      objKeyChain.username !== user ||
      objKeyChain.password !== pass
    ) {
      saveUserStorage({
        ...(await getUserStorage()),
        userAccount: user,
      });

      olState.userName = user;

      if (store.state.typeTouchID !== 'NoSupport') {
        await showAlert(
          'Bạn có muốn sử dụng chức năng ' + store.state.typeTouchID + ' cho lần sau?',
          {
            label: 'Để sau',
            func: () => {},
          },
          {
            label: 'Có',
            func: async () => {
              const save = await Keychain.setGenericPassword(user, pass);
              if (save) {
                store.state.isCredential = true;
              } else {
                showAlert('Lỗi thêm ' + store.state.typeTouchID);
              }
            },
          }
        );
      }
    }
  } else {
    showAlert(
      'Lỗi: ' +
        (rest.strMessage.length
          ? rest.strMessage
          : ' Tài khoản hoặc mật khẩu không chính xác ')
    );

    if (props?.password) {
      await Keychain.resetGenericPassword();
    }
  }

  hookProps.setState(state => {
    state.btnSignInBusy = false;
    return { ...state };
  });

  if (loginSucceed) {
    if (olState.loginMode !== store.state.appSetting.loginMode) {
      olState.loginMode = store.state.appSetting.loginMode;
      saveValueAppSettingToNvm(store.state.appSetting);
    }

    const itemOverView = screenDatas.find(item => item.id === 'Overview');
    navigation.navigate('Drawer', {
      screen: 'Overview',
      params: {
        info: itemOverView?.info ?? '',
        title: itemOverView?.title ?? '',
      },
    });
  }
}


export async function onFingerPress(showMessage: boolean) {
  let isSupport: any;
  try {
    isSupport = await TouchID.isSupported();
    console.log('isSupport:', isSupport);
  } catch (err: any) {
    console.log('err:', err);
    if (showMessage) {
      showAlert('Thiết bị lỗi hoặc không hỗ trợ');
    }
  }

  try {
    if (isSupport) {
      const credential = await Keychain.getGenericPassword();
      console.log('credential:', credential);

      if (!credential) {
        if (showMessage) {
          showAlert('Chức năng chưa được cài đặt trong ứng dụng');
        }

        return;
      }

      const result = await TouchID.authenticate('', {
        cancelText: 'Huỷ',
        title: 'Đăng nhập',
        sensorDescription: '',
      });
      console.log('result:', result);
      if (result === true) {
        await onLoginPress({
          userAccount: credential.username,
          password: credential.password,
        });
      }
    }
  } catch (err: any) {
    console.log(TAG, 'Lỗi:', err.message);
  }
}
export function onBtnSettingPress() {
  console.log('navigate to setting IPPort');

  navigation.navigate('SettingIPPort');
}
function getUrl(soapPushData: any) {
  throw new Error('Function not implemented.');
}
