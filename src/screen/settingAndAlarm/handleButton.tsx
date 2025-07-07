import { Alert, BackHandler } from 'react-native';
import RNFS from 'react-native-fs';
import {
  PropsAppSetting,
  saveValueAppSettingToNvm,
} from '../../service/storage';
import { isNumeric, showAlert, showToast } from '../../util';
import { hookProps, store } from './controller';
import {
  GetFileListMatchVersionMeter,
  endPoints,
  getNsxUrl,
} from '../../service/api';
import { UpdateDbMatchSeriVersionFromString } from '../../database/service/matchSeriVersionService';
import {
  PATH_EXECUTE_CSDL,
  PATH_EXPORT_XML,
  PATH_IMPORT_CSDL,
  PATH_IMPORT_XML,
} from '../../shared/path';
import { deleteDataDB } from '../../database/repository';
import { deleteDataDB as deleteDataDbSeriVersion } from '../../database/repository/matchSeriVersionRepository';
import * as Keychain from 'react-native-keychain';
import TouchID from 'react-native-touch-id';
import { PropsLoginServerNPCReturn, loginNPC } from '../../service/api/serverData';
import { UpdateMaCongToObjFromStorageAndServer } from '../../service/storage/maCongTo';

const TAG = 'Handle Button Setting:';

export const onNumRetriesReadSubmit = (text: string) => {
  let err = false;
  let status = '';
  if (isNumeric(text) === true) {
    if (Number(text) <= 0) {
      status = 'Số lần đọc lại phải lơn hơn 0';
      err = true;
    }
  } else {
    err = true;
    status = 'Số không hợp lệ';
    Alert.alert('Lỗi', 'Số không hợp lệ', [
      {
        text: 'OK',
      },
    ]);
  }
  if (err === true) {
    Alert.alert('Lỗi', status, [
      {
        text: 'OK',
      },
    ]);
    store.setState(state => {
      state.appSetting.numRetriesRead = '1';
      return { ...state };
    });
  }
};

export const onLowerThresholdDoneSubmit = (text: string) => {
  if (isNumeric(text) === true) {
  } else {
    Alert.alert('Lỗi', 'Ngưỡng nhỏ hơn không hợp lệ', [
      {
        text: 'OK',
      },
    ]);
    return;
  }

  let uppervalue;

  if (store.state.appSetting.setting.typeAlarm === 'Value') {
    uppervalue = Number(store.state.appSetting.setting.upperThresholdValue);
  } else {
    uppervalue = Number(store.state.appSetting.setting.upperThresholdPercent);
  }
  const lower = Number(text);
  if (Number(text) < 0 || lower >= uppervalue) {
    Alert.alert('Lỗi', 'Ngưỡng nhỏ hơn phải lớn hơn bằng 0', [
      {
        text: 'OK',
      },
    ]);
    store.setState(state => {
      if (state.appSetting.setting.typeAlarm === 'Value') {
        state.appSetting.setting.lowerThresholdValue = (
          uppervalue - 1 > 0 ? uppervalue - 1 : 0
        ).toString();
      } else {
        state.appSetting.setting.lowerThresholdPercent = (
          uppervalue - 1 > 0 ? uppervalue - 1 : 0
        ).toString();
      }
      return { ...state };
    });
    return;
  }
};
export const onUpperThresholdDoneSubmit = (text: string) => {
  if (isNumeric(text) === true) {
  } else {
    Alert.alert('Lỗi', 'Ngưỡng lớn hơn không hợp lệ', [
      {
        text: 'OK',
      },
    ]);
    return;
  }
  let lowerValue;

  if (store.state.appSetting.setting.typeAlarm === 'Value') {
    lowerValue = Number(store.state.appSetting.setting.lowerThresholdValue);
  } else {
    lowerValue = Number(store.state.appSetting.setting.lowerThresholdPercent);
  }
  const upper = Number(text);
  if (upper <= lowerValue) {
    Alert.alert('Lỗi', 'Ngưỡng lớn hơn phải lớn hơn Ngưỡng nhỏ hơn', [
      {
        text: 'OK',
      },
    ]);
    store.setState(state => {
      if (state.appSetting.setting.typeAlarm === 'Value') {
        state.appSetting.setting.upperThresholdValue = (
          lowerValue + 1
        ).toString();
      } else {
        state.appSetting.setting.upperThresholdPercent = (
          lowerValue + 1
        ).toString();
      }
      return { ...state };
    });
    return;
  }
};

export const onCheckBoxShowDataOkInWritwRegister = () => {
  store.setState(state => {
    state.appSetting.showResultOKInWriteData = state.appSetting
      .showResultOKInWriteData
      ? false
      : true;
    //console.log(state.appSetting.showResultOKInWriteData);
    return { ...state };
  });
};
export async function onSavePress() {
  await saveValueAppSettingToNvm(store?.state.appSetting as PropsAppSetting);
  showToast('Đã lưu');
}

export function onBtnAdvancePress() {
  hookProps.setState(state => {
    state.showAdvanced = !state.showAdvanced;
    return { ...state };
  });
}

export function onTextSubmitIp(str: string) {
  const reg1 = /\d+\.\d+\.\d+\.\d+/;
  const reg2 = /\./g;
  if (reg1.test(str) !== true) {
    Alert.alert('Địa chỉ IP không đúng định dạng');
    return;
  }
  let count = 0;
  let match;
  while ((match = reg2.exec(str) !== null)) {
    count++;
    console.log(match);
  }
  if (count !== 3) {
    Alert.alert('Địa chỉ IP không đúng định dạng');
    return;
  }
}
export function onTextSubmitPort(str: string) {
  const reg1 = /\D+/;
  if (reg1.test(str) === true) {
    Alert.alert('Cổng không đúng định dạng');
    return;
  }
}

export async function onUpdateSeriVersionPress() {
  try {
    if (hookProps.state.isBusy) {
      return;
    }
    hookProps.setState(state => {
      state.isBusy = true;
      return { ...state };
    });
    const response = await GetFileListMatchVersionMeter();
    if (response.bSucceed) {
      await UpdateDbMatchSeriVersionFromString(response.obj as string);
    } else {
    }

    await UpdateMaCongToObjFromStorageAndServer();
    
  } catch (err: any) {
    showAlert('Lỗi: ' + err.message);
  } finally {
    hookProps.setState(state => {
      state.isBusy = false;
      return { ...state };
    });
  }
}

export async function onBtnClearAllData() {
  await showAlert(
    'Bạn có chắc muốn xoá toàn bộ dữ liệu ?',
    {
      label: 'Huỷ',
      func: () => {},
    },
    {
      label: 'Vẫn xoá',
      func: async () => {
        try {
          await deleteDataDB();
          await deleteDataDbSeriVersion();
        } catch (err: any) {
          console.log(TAG, 'err:', err);
        }
        try {
          let folderExist = await RNFS.exists(PATH_IMPORT_CSDL);
          if (folderExist === true) {
            await RNFS.unlink(PATH_IMPORT_CSDL);
          }
          folderExist = await RNFS.exists(PATH_EXECUTE_CSDL);
          if (folderExist === true) {
            await RNFS.unlink(PATH_EXECUTE_CSDL);
          }

          folderExist = await RNFS.exists(PATH_IMPORT_XML);
          if (folderExist === true) {
            await RNFS.unlink(PATH_IMPORT_XML);
          } else {
            console.log('PATH_IMPORT_XML is exist');
          }
          folderExist = await RNFS.exists(PATH_EXPORT_XML);
          if (folderExist === true) {
            await RNFS.unlink(PATH_EXPORT_XML);
          }
        } catch (err :any) {
          console.log(TAG, err.message);
        } finally {
          showAlert('Đã xoá. Bạn cần phải thoát ứng dụng', {
            label: 'OK',
            func: () => {
              BackHandler.exitApp();
            },
          });
        }
      },
    },
  );
}

export async function onbtnAllowSigninByFingerPress() {
  let isSupport: any;
  try {
    isSupport = await TouchID.isSupported();
  } catch (err: any) {
    console.log('err:', err);
    showAlert('Thiết bị không hỗ trợ');
    return;
  }
  hookProps.setState(state => {
    state.showModalEnterPass = true;
    return { ...state };
  });
}

export async function onModalOkEnterPasswordPress(password: string) {
  hookProps.setState(state => {
    state.showModalEnterPass = false;
    return { ...state };
  });
  try {
    console.log({
      imei: store.state.NPCUser.moreInfoUser.imeiDevice,
      userName: store.state.NPCUser.moreInfoUser.userName,
      password: password.trim(),
    });

    const retLogin = await loginNPC({
      imei: store.state.NPCUser.moreInfoUser.imeiDevice,
      userName: store.state.NPCUser.moreInfoUser.userName,
      password: password.trim(),
    });
    if (retLogin.bSucceed) {
      console.log('Đăng nhập thành công');

      store.state.isCredential = true;

      const loginServer = retLogin.obj as PropsLoginServerNPCReturn;

      const save = await Keychain.setGenericPassword(
        store.state.NPCUser.moreInfoUser.userName,
        password,
      );

      if (save) {
        store.setState(state => {
          store.state.NPCUser.user = loginServer;
          store.state.isCredential = true;
          return { ...state };
        });

        showAlert('Thêm thành công');
      } else {
        showAlert('Lỗi');
      }
    } else {
      showAlert('Mật khẩu không chính xác');
    }
  } catch (e: any) {
    showAlert('Lỗi: ' + e.message);
  } finally {
  }
}
export function onModalCancelPress() {
  hookProps.setState(state => {
    state.showModalEnterPass = false;
    return { ...state };
  });
}

export function onClearFingerPress() {
  Keychain.resetGenericPassword();
  if (store.state.isCredential !== false) {
    store.setState(state => {
      state.isCredential = false;
      return { ...state };
    });
  }

  showToast('Xóa thành công');
}
