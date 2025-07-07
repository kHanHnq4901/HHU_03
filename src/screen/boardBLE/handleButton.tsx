import {
  ObjSend,
  readVersion,
  resetBoard,
  setNameHHU,
  TYPE_HHU_CMD,
} from '../../service/hhu/hhuFunc';
import { hookProps, setStatus, store, variable } from './controller';

import KeepAwake from 'react-native-keep-awake';
import {
  checkUpdateHHU,
  getStringFirmware,
  getVersion,
} from '../../service/api';
import { FillFlash, SendFlashPage } from '../../service/boardRF/bootloader';

const TAG = 'handle Btn boardBLE:';

export const onResetBoardBtnPress = async () => {
  if (hookProps.state.isBusy === true) {
    return;
  }

  hookProps.setState(state => {
    state.isBusy = true;
    state.status = 'Đang thực hiện ...';

    return { ...state };
  });

  let bResult: boolean = await resetBoard(TYPE_HHU_CMD.RESET);

  hookProps.setState(state => {
    if (bResult === true) {
      state.status = 'Reset thành công';
    } else {
      state.status = 'Reset thất bại';
    }
    state.isBusy = false;
    return { ...state };
  });
};
export const onReadVersionBtnPress = async () => {
  if (hookProps.state.isBusy === true) {
    return;
  }

  hookProps.setState(state => {
    state.isBusy = true;
    state.status = 'Đang đọc ...';

    return { ...state };
  });

  let version = await readVersion();
  if (version) {
    let arr = version.split('.');
    arr.pop();
    const shortVersion = arr.join('.').toLocaleLowerCase().replace('v', '');
    store?.setState(state => {
      state.hhu.version = version as string;
      state.hhu.shortVersion = shortVersion;
      return { ...state };
    });
  }

  hookProps.setState(state => {
    if (version) {
      state.status = 'Version: ' + version;
    } else {
      state.status = 'Đọc thất bại';
    }
    state.isBusy = false;
    return { ...state };
  });
};
variable.onOkChangeName = async text => {
  hookProps.setState(state => {
    state.showModalSetName = false;
    return { ...state };
  });

  let result = await resetBoard(TYPE_HHU_CMD.RESET_TO_SET_NAME);
  if (result === true) {
    //setStatus('Thay đổi tên thành công');
  } else {
    setStatus('Reset thất bại');
    return;
  }
  result = await setNameHHU(text);
  if (result === true) {
    setStatus('Thay đổi tên thành công');
  } else {
    setStatus('Thay đổi tên thất bại');
  }
  //console.log('name: ', text);
};
variable.onDismiss = () => {
  hookProps.setState(state => {
    state.showModalSetName = false;
    return { ...state };
  });
};
export async function onChangeNamePress() {
  if (hookProps.state.isBusy === true) {
    return;
  }
  if (store?.state.hhu.connect !== 'CONNECTED') {
    setStatus('Chưa kết nối bluetooth');
    return;
  }
  hookProps.setState(state => {
    state.showModalSetName = true;
    return { ...state };
  });
}

export const onCheckUpdateBtnPress = async () => {
  if (hookProps.state.isBusy === true) {
    return;
  }
  hookProps.setState(state => {
    state.isBusy = true;
    state.status = 'Đang kiểm tra update ...';

    return { ...state };
  });
  let status: string = '';
  const response = await getVersion();
  console.log('response:', response);
  if (response.bResult === true) {
    status =
      'Version: ' +
      response.version +
      ' Ngày phát hành: ' +
      response.dateIssue +
      (response.priority === 'Bình thường'
        ? ''
        : '.\nMức độ: ' + response.priority);
    checkUpdateHHU(response, true);
  } else {
    status = response.message;
  }
  hookProps.setState(state => {
    state.isBusy = false;
    state.status = status;

    return { ...state };
  });
};

export async function onUpdateFirmWareContainer(reset: boolean = true) {
  KeepAwake.activate();
  await ondUpdateFirmwareBtnPress(reset);
  KeepAwake.deactivate();
}

const ondUpdateFirmwareBtnPress = async (reset: boolean = true) => {
  if (hookProps.state.isBusy === true) {
    return;
  }
  if (store?.state.hhu.connect !== 'CONNECTED') {
    setStatus('Chưa kết nối bluetooth');
    return;
  }
  console.log('reset variable:', reset);
  hookProps.setState(state => {
    state.isBusy = true;
    state.status = 'Đang update';
    //state.showProgress = true;
    state.isUpdatingFirmware = true;
    //state.progressUpdate = 0;

    return { ...state };
  });
  if (reset) {
    let bResult: boolean = await resetBoard(TYPE_HHU_CMD.RESET_TO_PROGRAM);
    if (bResult !== true) {
      hookProps.setState(state => {
        state.isBusy = false;
        state.status = 'Reset thiết bị thất bại';
        state.showProgress = false;
        state.isUpdatingFirmware = false;
        state.progressUpdate = 0;

        return { ...state };
      });
      return;
    }
  }

  const response = await getVersion();

  if (response.bResult === true) {
    hookProps.setState(state => {
      state.isBusy = true;
      state.status = 'Đang update ' + response.version + '...';
      state.showProgress = true;
      state.isUpdatingFirmware = true;
      state.progressUpdate = 0;

      return { ...state };
    });
  } else {
    hookProps.setState(state => {
      state.isBusy = false;
      state.status = response.message;
      state.isUpdatingFirmware = false;

      return { ...state };
    });
  }

  try {
    const retApi = await getStringFirmware();
    //console.log('kkk:', retApi);

    if (retApi.bResult === false) {
      hookProps.setState(state => {
        state.isBusy = false;
        state.status = retApi.message;
        state.isUpdatingFirmware = false;

        return { ...state };
      });
      return;
    }

    console.log('firmware length:', retApi.strFirmware.length);

    let bResult: boolean;

    bResult = FillFlash(retApi.strFirmware);
    let status: string;
    if (bResult === true) {
      bResult = await SendFlashPage();
      status = bResult ? 'Nạp Firmware thành công' : 'Nạp Firmware thất bại';
    } else {
      status = hookProps.state.status + '. Nạp Firmware thất bại';
    }

    if (bResult) {
      ObjSend.isNeedUpdate = false;
    }

    hookProps.setState(state => {
      state.isBusy = false;
      state.status = status;
      state.isUpdatingFirmware = false;
      return { ...state };
    });
    console.log('state.progressUpdate:', hookProps.state.progressUpdate);
  } catch (err :any) {
    console.log('err here');
    console.log(err.message);
  }
};
