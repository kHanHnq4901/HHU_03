import { Platform } from 'react-native';
import { DrawerParamsList } from '../navigation/model/model';
import { StackViewDataNavigator } from '../navigation/StackViewData';
import { StackWriteBookCodeNavigator } from '../navigation/StackWriteByBookCode';
import { StackWriteColumnCodeNavigator } from '../navigation/StackWriteByColumnCode';
import { AboutScreen } from '../screen/about';
import { BoardBLEScreen } from '../screen/boardBLE';
import { ExportXmlScreen } from '../screen/exportXml';
import { ImportXmlScreen } from '../screen/importXml';
import { OverViewScreen } from '../screen/overview';
import { AutomaticReadScreen } from '../screen/automaticRead';
import { ManualReadScreen } from '../screen/manualRead';
import { StatisticsScreen} from '../screen/statistics'
import { ReadParameterScreen } from '../screen/readParameter';
import { SettingAndAlarmScreen } from '../screen/settingAndAlarm';
import {ConfigMeterScreen} from '../screen/configMeter';
import VersionCheck from 'react-native-version-check';
import { StackDataLogNavigator } from '../navigation/StackDataLog';
import { ImportExportCSDLScreen } from '../screen/importexportCSDL';
import { JSX } from 'react';

export const version = VersionCheck.getCurrentVersion();

console.log('current version:' +  Platform.OS + ': ', version);


// export const widthScreen = Dimensions.get('screen').width;
// export const heighScreen = Dimensions.get('screen').height;

type ScreenProps = {
  title: string;
  info: string;
  id: keyof DrawerParamsList;
  icon: string;
  component: (() => JSX.Element) | null;
  showHeader?: boolean;
};

type DataScreensProps = ScreenProps[];

export type TYPE_DEVICE = 'HHU';

export const screenDatas: DataScreensProps = [
  {
    title: 'Đọc tự động',
    info: 'Hiển thị các điểm đo trên bản đồ và ghi cs theo bản đồ',
    id: 'AutomaticRead',
    icon: 'map',
    component: AutomaticReadScreen,
    showHeader : true,
  },
  {
    title: 'Đọc bán tự động',
    info: 'Hiển thị các điểm đo trên bản đồ và ghi cs theo bản đồ',
    id: 'ManualRead',
    icon: 'map',
    component: ManualReadScreen,
    showHeader : true,
  },
  {
    title: 'Tổng quan',
    info: 'Hiển thị tỉ lệ thu lập dữ liệu của thiết bị HHU',
    id: 'Overview',
    icon: 'pie-chart',
    component: OverViewScreen,
    showHeader : false,
  },
  {
    title: 'Cài đặt',
    info: `
    Cài đặt ngưỡng cảnh báo bất thường cho điện năng khi thực hiện chức năng 'Ghi chỉ số'
    `,
    id: 'SettingAndAlarm',
    icon: 'settings',
    component: SettingAndAlarmScreen,
  },
  {
    title: 'Thiết bị cầm tay',
    info: `
    Reset, cập nhật frimware cho thiết bị cầm tay
    `,
    id: 'BoardBLE',
    icon: 'journal',
    component: BoardBLEScreen,
  },
  {
    title: 'Thống kê',
    info: 'Thống kê',
    id: 'Statistics',
    icon: 'chart-bar',
    component: StatisticsScreen,
  },
  {
    title: 'Cấu hình',
    info: 'Cấu hình',
    id: 'ConfigMeter',
    icon: 'chart-bar',
    component: ConfigMeterScreen,
  },
];
