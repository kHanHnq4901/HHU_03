import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { NativeScrollEvent, Platform, ScrollView } from 'react-native';
import { PropsKHCMISModel } from '../../database/model';
import { CMISKHServices } from '../../database/service';
import {
  PropsRouteParamsWriteBook,
  StackWriteBookCodeNavigationProp,
} from '../../navigation/model/model';
import {
  IsReadRFSucceed,
  IsWriteByHand,
  TYPE_READ_RF,
  getLabelAndIsManyPriceByCodeMeter,
} from '../../service/hhu/defineEM';
import { sizeScreen } from '../../theme/index';
import { showAlert } from '../../util';
import Geolocation from '@react-native-community/geolocation';
import { turnOnLocation } from '../ble/controller';
import { testUpdateDataToDB, testUpdateDataToDBDLHN } from './handleButton';
var LocationEnabler =
  Platform.OS === 'android' ? require('react-native-location-enabler') : null;

const {
  PRIORITIES: { HIGH_ACCURACY },
  useLocationSettings,
} =
  Platform.OS === 'android'
    ? LocationEnabler.default
    : {
        PRIORITIES: { HIGH_ACCURACY: null },
        useLocationSettings: null,
      };
let enableLocationHook = {} as {
  enabled: any;
  requestResolution: () => void;
};

export const requestGps = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return true;
  }
  try {
    const value = await turnOnLocation();
    if (value === true) {
      if (Platform.OS === 'android') {
        if (enableLocationHook.enabled !== true) {
          // console.log(
          //   'requestResolution:',
          //   enableLocationHook.requestResolution,
          // );
          enableLocationHook.requestResolution();
          return true;
        } else {
        }
      }

      return true;
    }
    if (value === false) {
      showAlert(
        'Thiết bị cần bật GPS cho chức năng ghi chỉ số và tìm kiếm thiết bị bluetooth',
      );
    }
  } catch (err :any) {
    showAlert('Lỗi: ' + err.message);
  }

  return false;
};
export const itemPerRender = 10;

type PropsCheckBox = {
  checked: boolean;
  label: 'Chưa đọc' | 'Đọc lỗi' | 'Ghi tay' | 'Bất thường';
  // value: 'Chưa đọc' | 'Đọc lỗi' | 'Ghi tay' | 'Bất thường';
};

export type PropsDatatable = {
  id: string;
  show: boolean;
  stt: string;
  checked: boolean;
  data: PropsKHCMISModel;
  isManyPrice: boolean;
  labelMeter: string;
  versionMeter: string;
};

export type PropsTable = {
  render: PropsDatatable[];
  noRender: PropsDatatable[];
};

export type HookState = {
  arrColumnColumnCode: string[];
  //dataDB: PropsKHCMISModel[];
  isReading: boolean;
  requestStop: boolean;
  selectAll: boolean;
  arrCheckBoxRead: PropsCheckBox[];
  status: string;
  dataTable: PropsTable;
  totalBCS: string;
  totalSucceed: string;
  selectedColumn: string | null;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

const TAG = ' Controller: ';

export const hookProps = {} as HookProps;
export let navigation: StackWriteBookCodeNavigationProp;
export let refScroll: React.MutableRefObject<ScrollView | null>;
//export const _nodes = new Map();

export function addMoreItemToRender(dataTable: PropsTable): PropsTable {
  let numAddItem = 0;
  while (true) {
    const item = dataTable.noRender.shift();
    if (item) {
      dataTable.render.push(item);
      if (item.show === true) {
        numAddItem++;
      }
    } else {
      break;
    }

    if (numAddItem >= itemPerRender) {
      break;
    }
  }
  return { ...dataTable };
}

export function onScrollToEnd() {
  if (hookProps.state.dataTable.noRender.length > 0) {
    hookProps.setState(state => {
      state.dataTable = addMoreItemToRender(state.dataTable);
      return { ...state };
    });
  }
}

export function GetHookProps(): HookProps {
  const [state, setState] = useState<HookState>({
    arrColumnColumnCode: ['Tất cả'],
    //dataDB: [],
    isReading: false,
    selectAll: false,
    arrCheckBoxRead: [
      {
        label: 'Chưa đọc',
        //value: 'Chưa đọc',
        checked: false,
      },
      {
        label: 'Đọc lỗi',
        //value: 'Đọc lỗi',
        checked: false,
      },
      {
        label: 'Ghi tay',
        //value: 'Ghi tay',
        checked: false,
      },
      {
        label: 'Bất thường',
        //value: 'Bất thường',
        checked: false,
      },
    ],
    status: '',
    dataTable: {
      render: [],
      noRender: [],
    },
    totalBCS: '0',
    totalSucceed: '0',
    selectedColumn: null,
    requestStop: false,
  });
  hookProps.state = state;
  hookProps.setState = setState;
  navigation = useNavigation<StackWriteBookCodeNavigationProp>();
  refScroll = React.useRef<ScrollView | null>(null);
  if (Platform.OS === 'android') {
    const [enabled, requestResolution] = useLocationSettings(
      {
        priority: HIGH_ACCURACY, // default BALANCED_POWER_ACCURACY
        alwaysShow: true, // default false
        needBle: true, // default false
      },
      false /* optional: default undefined */,
    );

    enableLocationHook.enabled = enabled;
    enableLocationHook.requestResolution = requestResolution;
  }
  return hookProps;
}

export function isCloseToBottom({
  layoutMeasurement,
  contentOffset,
  contentSize,
}: NativeScrollEvent): boolean {
  const paddingToBottom = sizeScreen.height * 3;

  const result: boolean =
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom;

  //console.log('contentOffset:', contentOffset);

  // if (result) {
  //   console.log('layoutMeasurement:', layoutMeasurement);
  //   console.log('contentSize:', contentSize);
  // }
  return result;
}

let firstTime = true;

const getDataDb = async (ref, routeParams: PropsRouteParamsWriteBook) => {
  let items: PropsKHCMISModel[];
  let dataDB: PropsKHCMISModel[] = [];
  let columnCodeSet = new Set<string>();
  //let totalMeterDBSet = new Set<string>();
  let arrColumnCode: string[] = [];
  let dataTable: PropsTable = {
    render: [],
    noRender: [],
  };
  let totalBCS = 0;
  let totalSucceed = 0;
  
  //let stt = 1;

  hookProps.setState(state => {
    state.status = 'Đang cập nhật dữ liệu ...';

    return { ...state };
  });

  console.log(TAG, 'firstTime', firstTime);
  try {
    //if (store?.state.appSetting.showResultOKInWriteData === true) {
    items = await CMISKHServices.findAll();
    dataDB = items;
    for (let item of dataDB) {
      if (item.MA_TRAM === routeParams.stationCode) {
        let ok = false;
        if (routeParams.bookCode.length > 0) {
          if (routeParams.bookCode.includes(item.MA_QUYEN)) {
            ok = true;
          }
        } else {
          ok = true;
        }
        if (ok) {
          columnCodeSet.add(item.MA_GC);
          //totalMeterDBSet.add(item.SERY_CTO);
          totalBCS++;
          if (
            IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF) ||
            IsWriteByHand(item.LoaiDoc as TYPE_READ_RF) 
        
          ) {
            totalSucceed++;
          }

          const labelAndIsManyPrice = getLabelAndIsManyPriceByCodeMeter(
            item.MA_CTO,
                 item.SERY_CTO,
          );
          // if(item.SERY_CTO === '2214014113')
          // {
             //console.log('item:', item.SERY_CTO);
            
          // }
          dataTable.noRender.push({
            checked: false,
            data: item,
            id: item.id,
            show: true,
            stt: item.TT.toString(),
            isManyPrice: labelAndIsManyPrice.isManyPrice,
            labelMeter: labelAndIsManyPrice.label,
            versionMeter: item.RF,
          });
          //break;
        }
        //console.log('item:', item);
      }
    }

    arrColumnCode = Array.from(columnCodeSet).sort();
    arrColumnCode.unshift('Tất cả');

    dataTable = addMoreItemToRender(dataTable);

    console.log(
      'dataTable:',
      dataTable.render.length + dataTable.noRender.length,
    );
    //console.log('show first:', dataTable[0]?.show);
    //console.log('arrStationCode:', arrStationCode);
    hookProps.setState(state => {
      //state.dataDB = dataDB;
      state.arrColumnColumnCode = arrColumnCode;
      state.totalBCS = totalBCS.toString();
      state.totalSucceed = totalSucceed.toString();
      state.dataTable = dataTable;
      state.status = '';

      return { ...state };
    });
    if (firstTime) {
      firstTime = false;
      ref?.current?.openDropdown();
    }

    //}
  } catch (err :any) {
    console.log(TAG, err.message);
  }
};

export const onInit = async (routeParams: PropsRouteParamsWriteBook, ref) => {
  navigation.addListener('focus', () => {
    getDataDb(ref, routeParams);
  });
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'playServices',
  });
  Geolocation.requestAuthorization(
    () => {
      console.log('requestAuthorization succeed');
      // if (!intervalGPS) {
      //   intervalGPS = setInterval(() => {
      //     getGeolocation();
      //   }, 7000);
      // }
    },
    error => {
      console.log(error);
    },
  );
  requestGps();
  //testUpdateDataToDB();
  //testUpdateDataToDBDLHN();
};

export const onDeInit = () => {};
