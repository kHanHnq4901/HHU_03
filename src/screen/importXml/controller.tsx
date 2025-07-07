import React, { useState } from 'react';
import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { PropDataBookDLHN } from '../../component/bookServer';
import { store } from '../../component/drawer/drawerContent/controller';
import { PropsGetMaSoReturn, PropsSoapGetMaSoAndDataDLHNReturn } from '../../service/api/serverData';
import { RECEIVE_FILE_XML } from '../../service/event/constant';
import { PropsDropdown } from '../../service/hhu/defineEM';
import { PropsStorageDLHN, getLastInfoDLHN } from '../../service/storage/storageDLHN';
import { PropsFileInfo, getListFileFromStorage } from '../../shared/file';
import { PATH_IMPORT_XML } from '../../shared/path';

const TAG = 'Import Xml Controller: ';

export type HookState = {
  xmlList: PropsFileInfo[];
  isBusy: boolean;
  // dataServerDLHN: PropsGetBookListDLHNServerReturn;
  dataServerDLHN: PropsSoapGetMaSoAndDataDLHNReturn[];
  bookServerDLHN: PropDataBookDLHN[];
  infoDLHN: {
    listMaso: PropsGetMaSoReturn[];
    storage: PropsStorageDLHN;
    loaiCSDropDown : PropsDropdown[];
  }

  searchFound: number;
  searchTotal: number;
  
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

export const hookProps = {} as HookProps;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    xmlList: [],
    isBusy: false,
    // dataServerDLHN: {
    //   data: [],
    //   paging: {
    //     pageIndex: 0,
    //     pageSize: 0,
    //     totalCount: 0,
    //     totalPages: 0,
    //   },
    //   statusCode: 0,
    // },
    dataServerDLHN: [],
    bookServerDLHN: [],
    infoDLHN: {
      listMaso: [],
      storage: {
        maDoi: '',
        maDonvi: '',
        maSoGCS: '',
        ky: '',
        thang: '',
        nam: '',
        loaiCS: 'CSC'
      },
      loaiCSDropDown: [
        {
        label: 'CSC',
        value: 0,
      },
        {
        label: 'DDK',
        value: 0,
      },
    ],
    },
    searchFound: 0,
    searchTotal: 0,
  });
  hookProps.state = state;
  hookProps.setState = setState;

  return hookProps;
};

let listener : EmitterSubscription;

export const updateXmlFile = async () => {
  const xmlList = await getListFileFromStorage(PATH_IMPORT_XML);
  hookProps.setState(state => {
    state.xmlList = xmlList;
    return { ...state };
  });
};

export const onInit = async (navigation : any) => {
  listener = DeviceEventEmitter.addListener(RECEIVE_FILE_XML, () => {
    updateXmlFile();
  });
  navigation.addListener('focus', async () => {
    updateXmlFile();
  });
  if(store.state.appSetting.loginMode === 'ĐL Hà Nội')
  {
    // await onImportFromServerPress();
    const infoDLHN = await getLastInfoDLHN();
    hookProps.setState(state => {
      state.infoDLHN.storage = infoDLHN;
      return {...state}
    });
  }
};

export const onDeInit = () => {
  if (listener) {
    listener.remove();
  }
};
