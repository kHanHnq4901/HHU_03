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
import * as Keychain from 'react-native-keychain';
import TouchID from 'react-native-touch-id';
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
        );
      } else {
        state.appSetting.setting.lowerThresholdPercent = (
          uppervalue - 1 > 0 ? uppervalue - 1 : 0
        );
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
        );
      } else {
        state.appSetting.setting.upperThresholdPercent = (
          lowerValue + 1
        );
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


