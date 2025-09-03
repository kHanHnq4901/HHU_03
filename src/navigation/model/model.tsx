import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
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


export type PropsRouteParamsWriteBook = {
  stationCode: string;
  bookCode: string[];
};
export type PropsRouteParamsWriteColumn = {
  stationCode: string;
  columnCode: string[];
};

export type StackExportLogList = {
  HomeLog: undefined;
  ViewLogDetail: PropsFileInfo;
};

// export type StackRootNavigationProp = CompositeNavigationProp<
//   StackNavigationProp<StackRootParamsList>,
//   DrawerNavigationProp<DrawerParamsList>
// >;

export type StackRootNavigationProp = StackNavigationProp<StackRootParamsList>;

export type StackWiteDataNavigationProp =
  StackNavigationProp<StackWriteDataList>;


export type DrawerNavigationProps = DrawerNavigationProp<DrawerParamsList>;

export type ParamsDrawerProps = {
  title: string;
  info: string;
};

export type DrawerParamsList = {
  Overview: ParamsDrawerProps;
  SettingAndAlarm :ParamsDrawerProps;
  BoardBLE: ParamsDrawerProps & {
    isUpdate?: boolean;
  };
  Statistics : ParamsDrawerProps;
  ConfigMeter: ParamsDrawerProps;
  ManualRead : ParamsDrawerProps;
  AutomaticRead :  ParamsDrawerProps;
  ImportMeter : ParamsDrawerProps;
  ReadDataMeter : ParamsDrawerProps;
  DetailLine : ParamsDrawerProps;
  DetailMeter : ParamsDrawerProps;
};
