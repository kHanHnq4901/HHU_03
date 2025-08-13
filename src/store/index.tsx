import React, { Dispatch, SetStateAction, useState } from 'react';
import { PropsKHCMISModel } from '../database/model';
import { getDefaultStorageValue, PropsAppSetting } from '../service/storage';
import { Platform } from 'react-native';
import {
  PropsLoginServerNPCReturn,
  dateReleaseApi,
} from '../service/api/serverData';
import { Device } from 'react-native-ble-plx';

export type TYPE_TOUCH_ID = 'FaceID' | 'TouchID' | 'NoSupport';

export type PropsInfoNPCUser = {
  userName: string;
  passWord: string;
  dateReleaseApi: string;
  imeiDevice: string;
};
export type PropsInfoDLHNUser= {
  userId : string ;
  userName: string;
  passWord: string;
  token: string;
  imeiDevice: string;
};

type PropsState = {
  hhu: {
    characteristicUUID: string;
    serviceUUID: string;
    isConnected: boolean;
    connect: 'DISCONNECTED' | 'CONNECTED' | 'CONNECTING';
    idConnected: string | null;
    name :string ;
    version: string;
    shortVersion: string;
    rssi: number;
    device: Device | null;
  };
  net: {
    netconnected: boolean;
    netReachAble: boolean;
  };
  app: {
    mdVersion: boolean;
    enableDebug: boolean;
  };
  alert: {
    show: boolean;
  };
  appSetting: PropsAppSetting;
  modal: {
    showInfo: boolean;
    showWriteRegister: boolean;
    modalAlert: {
      title: string;
      content: string;
      onDissmiss: (value?: any) => void;
      onOKPress: () => void;
    };
  
  };

  userRole: 'customer' | 'dvkh' | 'admin' | 'sx';
  typeTouchID: TYPE_TOUCH_ID;
  NPCUser: {
    user: PropsLoginServerNPCReturn;
    moreInfoUser: PropsInfoNPCUser;
  };
  DLHNUser: {
    //user: PropsLoginServerReturn;
    moreInfoUser: PropsInfoDLHNUser;
  };
  isCredential: boolean;
  
};

type PropsDataDB = {
  item: PropsKHCMISModel;
  id: string;
};

type PropsData = {
  dataBD: PropsDataDB[];
  codeStation: string[];
  codeBook: string[];
  codeColumn: string[];
};

export type PropsStore = {
  data: PropsData[];
  setData: Dispatch<SetStateAction<PropsData[]>>;
  state: PropsState;
  setState: Dispatch<React.SetStateAction<PropsState>>;
};

export const storeContext = React.createContext<PropsStore>(null);

export const StoreProvider = ({ children }) => {
  const [data, setData] = useState<PropsData[]>([]);

  const [hook, setHook] = useState<PropsState>({
    hhu: {
      isConnected: false,
      connect: 'DISCONNECTED',
      idConnected: null,
      version: '',
      shortVersion: '',
      rssi: 0,
      name: '',
      serviceUUID: '',          
      characteristicUUID: '',
      device: null,
    },
    net: {
      netReachAble: false,
      netconnected: false,
    },
    app: {
      enableDebug: false,
      mdVersion: false,
    },
    alert: {
      show: false,
    },
    appSetting: getDefaultStorageValue(),
    modal: {
      showInfo: false,
      showWriteRegister: false,
      modalAlert: {
        title: '',
        content: '',
        onDissmiss: (value?: any) => {},
        onOKPress: () => {},
      },
    },
    userRole: 'customer',
    typeTouchID: Platform.OS === 'ios' ? 'FaceID' : 'TouchID',
    NPCUser: {
      user: {} as PropsLoginServerNPCReturn,
      moreInfoUser: {
        userName: '',
        passWord: '',
        dateReleaseApi: dateReleaseApi,
        imeiDevice: '',
      },
    },
    DLHNUser: {
      moreInfoUser: {
        userName: '',
        passWord: '',
        token: '',
        imeiDevice: '',
      }
    },
    isCredential: false,
    
  });

  const initialalue: PropsStore = {
    data: data,
    setData: setData,
    state: hook,
    setState: setHook,
  };

  return (
    <storeContext.Provider value={initialalue}>
      {children}
    </storeContext.Provider>
  );
};
