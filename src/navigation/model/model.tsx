import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PropsKHCMISModel } from '../../database/model';
import { PropsDatatable } from '../../screen/writeDataByBookCode/controller';
import { PropsFileInfo } from '../../shared/file';
export type StackRootParamsList = {
  Login: undefined;
  Drawer: NavigatorScreenParams<DrawerParamsList>;
  BleScreen: undefined;
  SettingIPPort: undefined;
};

export type StackWriteDataList = {
  WriteRegister: ParamsDrawerProps;
  WriteRegisterByHand: {
    row: string[];
  };
};

export type StackViewDataList = {
  ViewRegister: ParamsDrawerProps;
  ViewRegisterDetailed: {
    data: PropsDatatable;
  };
};

export type PropsRouteParamsWriteBook = {
  stationCode: string;
  bookCode: string[];
};
export type PropsRouteParamsWriteColumn = {
  stationCode: string;
  columnCode: string[];
};

export type StackWriteDataByBookCodeList = {
  SelectBook: ParamsDrawerProps;
  WriteBook: PropsRouteParamsWriteBook;
  WriteByHand: {
    // navigation: StackWriteBookCodeNavigationProp;
    data: PropsDatatable;
  };
};
export type StackExportLogList = {
  HomeLog: undefined;
  ViewLogDetail: PropsFileInfo;
};
export type StackWriteDataByColumnCodeList = {
  SelectColumn: ParamsDrawerProps;
  WriteColumn: PropsRouteParamsWriteColumn;
  WriteByHand: {
    // navigation: StackWriteBookCodeNavigationProp;
    data: PropsDatatable;
  };
};

// export type StackRootNavigationProp = CompositeNavigationProp<
//   StackNavigationProp<StackRootParamsList>,
//   DrawerNavigationProp<DrawerParamsList>
// >;

export type StackRootNavigationProp = StackNavigationProp<StackRootParamsList>;

export type StackWiteDataNavigationProp =
  StackNavigationProp<StackWriteDataList>;

export type StackViewDataNavigationProp =
  StackNavigationProp<StackViewDataList>;

export type StackWriteBookCodeNavigationProp =
  StackNavigationProp<StackWriteDataByBookCodeList>;
export type StackWriteColumnCodeNavigationProp =
  StackNavigationProp<StackWriteDataByColumnCodeList>;

export type DrawerNavigationProps = DrawerNavigationProp<DrawerParamsList>;

export type ParamsDrawerProps = {
  title: string;
  info: string;
};

export type DrawerParamsList = {
  Map :  ParamsDrawerProps;
  Overview: ParamsDrawerProps;
  ViewData: NavigatorScreenParams<StackViewDataNavigationProp>;
  WriteData: NavigatorScreenParams<StackWiteDataNavigationProp>;
  ViewDataByVolatge: ParamsDrawerProps;
  WriteDataByColumnCode: NavigatorScreenParams<StackWriteColumnCodeNavigationProp>;
  WriteDataByBookCode: NavigatorScreenParams<StackWriteBookCodeNavigationProp>;
  WriteDataByPosition: ParamsDrawerProps;
  ReadParameter: ParamsDrawerProps;
  AbnormalRegister: ParamsDrawerProps;
  ImportExportCSDL: ParamsDrawerProps;
  ExportXml: ParamsDrawerProps;
  ImportXml: ParamsDrawerProps;
  LogData: ParamsDrawerProps;
  ImportExportCMIS: ParamsDrawerProps;
  CkeckSignal: ParamsDrawerProps;
  SettingAndAlarm: ParamsDrawerProps;
  BoardBLE: ParamsDrawerProps & {
    isUpdate?: boolean;
  };
  ChangePassword: ParamsDrawerProps;
  SupportCustomer: ParamsDrawerProps;
  About: ParamsDrawerProps;
  GuideBook: undefined;
  
};
