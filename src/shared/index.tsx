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
import { MapScreen } from '../screen/map';
import { ReadParameterScreen } from '../screen/readParameter';
import { SettingAndAlarmScreen } from '../screen/settingAndAlarm';
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
    title: 'Bản đồ',
    info: 'Hiển thị các điểm đo trên bản đồ và ghi cs theo bản đồ',
    id: 'Map',
    icon: 'map',
    component: MapScreen,
  },
  {
    title: 'Tổng quan',
    info: 'Hiển thị tỉ lệ thu lập dữ liệu của thiết bị HHU',
    id: 'Overview',
    icon: 'pie-chart',
    component: OverViewScreen,
  },
  {
    title: 'Xem chỉ số',
    info: 'Xem toàn bộ dữ liệu. \nNhấn vào biểu tượng quyển sách để xem chi tiết',
    id: 'ViewData',
    icon: 'reader-sharp',
    component: StackViewDataNavigator,
  },
  {
    title: 'Ghi chỉ số',
    info: ` Ghi chỉ số theo cột, trạm ...
    Double click vào tiêu đề 'Đọc' của bảng dữ liệu để chọn hoặc bỏ chọn tất cả
    Nhấn giữ vào dòng bất kỳ để ghi dữ liệu bằng tay. Chế độ ghi tay chỉ cho phép khi đọc dữ liệu RF bị lỗi`,
    id: 'WriteData',
    icon: 'ios-pencil',
    component: null, //StackWriteDataNavigator,
  },
  // {
  //   title: 'Xem điện áp',
  //   info: 'info',
  //   id: 'WriteRegister',
  //   icon: 'md-speedometer',
  //   component: null,
  // },
  {
    title: 'Ghi theo mã quyển',
    info: `
    Ghi chỉ số theo mã quyển

    B1: Chọn trạm biến áp
    B2: Chọn các quyển muốn ghi chỉ số
        Ghi tất cả quyển nếu không quyển nào được chọn
    B3: Chọn công tơ cần ghi chỉ số
    B4: Ấn phím đọc
    `,
    id: 'WriteDataByBookCode',
    icon: 'ios-pencil',
    component: StackWriteBookCodeNavigator,
  },
  {
    title: 'Ghi theo mã cột',
    info: `
    Ghi chỉ số theo mã cột

    B1: Chọn trạm biến áp
    B2: Chọn các cột muốn ghi chỉ số
        Ghi tất cả cột nếu không cột nào được chọn
    B3: Chọn công tơ cần ghi chỉ số
    B4: Ấn phím đọc
    `,
    id: 'WriteDataByColumnCode',
    icon: 'ios-pencil',
    component: StackWriteColumnCodeNavigator,
  },
  {
    title: 'Ghi điện theo vị trí',
    info: 'info',
    id: 'WriteDataByPosition',
    icon: 'ios-navigate',
    component: null,
  },
  {
    title: 'Đọc RF',
    info: `
    Đọc dữ liệu tức thời công tơ bất kỳ, dữ liệu sẽ không được lưu vào DB.
    Chức năng Khởi tạo, Dò sóng , Reset module công tơ
    `,

    id: 'ReadParameter',
    icon: 'ios-book-outline',
    component: ReadParameterScreen,
    // showHeader: false,
  },
  {
    title: 'Chỉ số bất thường',
    info: 'info',
    id: 'AbnormalRegister',
    icon: 'md-warning',
    component: null,
  },
  
  {
    title: 'Xuất dữ liệu',
    info: `
    Xuất cơ sở dữ liệu:
      +Nhấn nút 'Xuất' trên màn hình
      +Chọn ứng dụng muốn chia sẻ CSDL
    `,
    id: 'ExportXml',
    icon: 'md-print',
    component: ExportXmlScreen,
  },
  
  {
    title: 'Nhập dữ liệu',
    info: `
    +Đẩy file xml lên zalo..., hoặc truyền file vào thiết bị qua cổng usb, 
      +Chọn chia sẻ file, 
      +Chọn 'Ứng dụng khác'(đối với zalo)
      +Chọn ứng dụng HHU Gelex
    `,
    id: 'ImportXml',
    icon: 'code-download',
    component: ImportXmlScreen,
  },
  
  {
    title: 'Nhập xuất CMIS',
    info: 'info',
    id: 'ImportExportCMIS',
    icon: 'barcode',
    component: null,
  },
  {
    title: 'Kiểm tra tín hiệu',
    info: 'info',
    id: 'CkeckSignal',
    icon: 'cellular',
    component: null,
  },
  {
    title: 'Cài đặt',
    info: `
    Cài đặt ngưỡng cảnh báo bất thường cho điện năng khi thực hiện chức năng 'Ghi chỉ số'
    `,
    id: 'SettingAndAlarm',
    icon: 'ios-build',
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
    title: 'Dữ liệu Log',
    info: `
    
    `,
    id: 'LogData',
    icon: 'terminal-outline',
    component: StackDataLogNavigator,
  },
  {
    title: 'Quản trị CSDL',
    info: `
    Nhập cơ sở dữ liệu:
      +Đẩy file cơ sở dữ liệu lên zalo ..., 
      +Chọn chia sẻ file, 
      +Chọn 'Ứng dụng khác'
      +Chọn ứng dụng HHU Gelex
      +Trở lại ứng dụng HHU Gelex
      +Vào màn hình nhập xuất CSDL
      +Chọn file vừa được chia sẻ
      +Nhấn nút 'Nhập' trên màn hình

      
    Xuất cơ sở dữ liệu:
      +Nhấn nút 'Xuất' trên màn hình
      +Chọn ứng dụng muốn chia sẻ CSDL
    `,
    id: 'ImportExportCSDL',
    icon: 'server',
    component: ImportExportCSDLScreen,
  },
  {
    title: 'Đổi mật khẩu',
    info: 'info',
    id: 'ChangePassword',
    icon: 'key',
    component: null,
  },
  {
    title: 'Hỗ trợ',
    info: 'info',
    id: 'SupportCustomer',
    icon: 'ios-help-circle',
    component: null, //SupportCustomerScreen,
  },
  {
    title: 'Giới thiệu',
    info: 'Giới thiệu',
    id: 'About',
    icon: 'information-circle',
    component: AboutScreen,
  },
];
