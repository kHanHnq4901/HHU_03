import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { NativeScrollEvent } from 'react-native';
import { PropsKHCMISModel } from '../../database/model';
import { CMISKHServices } from '../../database/service';
import { StackViewDataNavigationProp } from '../../navigation/model/model';
import { sizeScreen } from '../../theme';
import { PropsDatatable } from '../writeDataByBookCode/controller';
import { IsReadRFSucceed, IsWriteByHand, TYPE_READ_RF } from '../../service/hhu/defineEM';

const TAG = 'View Register Controller: ';

const itemPerRender = 10;

type PropsCheckBox = {
  checked: boolean;
  label: 'Thành công RF' | 'Chưa đọc' | 'Đọc lỗi' | 'Ghi tay' | 'Bất thường' | 'Sản lượng âm' | 'Vượt ngưỡng trên' | 'Vượt ngưỡng dưới';
  // value: 'Chưa đọc' | 'Đọc lỗi' | 'Ghi tay' | 'Bất thường';
};


export type PropsTable = {
  render: PropsDatatable[];
  noRender: PropsDatatable[];
};

export type HookState = {
  dataDB: PropsKHCMISModel[];
  arrStation: string[];
  arrCheckBoxRead: PropsCheckBox[];
  status: string;
  dataTable: PropsTable;
  totalBCS: string;
  totalSucceed: string;
  selectedStation: string | null;
  isBusy: boolean;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
};

export const hookProps = {} as HookProps;
export let navigation: StackViewDataNavigationProp;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<HookState>({
    dataDB: [],
    arrStation: [],
    arrCheckBoxRead: [
      {
        label: 'Thành công RF',
        //value: 'Chưa đọc',
        checked: false,
      },
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
      {
        label: 'Sản lượng âm',
        //value: 'Bất thường',
        checked: false,
      },
      {
        label: 'Vượt ngưỡng trên',
        //value: 'Bất thường',
        checked: false,
      },
      {
        label: 'Vượt ngưỡng dưới',
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
    selectedStation: null,
    isBusy: false,
  });
  hookProps.state = state;
  hookProps.setState = setState;
  navigation = useNavigation<StackViewDataNavigationProp>();

  return hookProps;
};

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

export function onScrollToEnd() {
  if (hookProps.state.dataTable.noRender.length > 0) {
    hookProps.setState(state => {
      state.dataTable = addMoreItemToRender(state.dataTable);
      return { ...state };
    });
  }
}

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

const getDataDb = async (ref: any) => {
  let items: PropsKHCMISModel[];
  let dataDB: PropsKHCMISModel[] = [];
  let stationSet = new Set<string>();
  //let totalMeterDBSet = new Set<string>();
  let arrStationCode: string[] = [];
  //let dataTable: PropsDatatable[] = [];
  let totalBCS = 0;
  let totalSucceed = 0;
  //let stt = 1;

  //console.log(TAG, 'routeParams', routeParams);
  try {
    //if (store?.state.appSetting.showResultOKInWriteData === true) {
    items = await CMISKHServices.findAll();
    dataDB = items;
    for (let item of dataDB) {
      stationSet.add(item.MA_TRAM);
      if(
        IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF)  ||
        IsWriteByHand(item.LoaiDoc as TYPE_READ_RF)

        ){
          totalSucceed ++;
        }
    }

    totalBCS = items.length;


    arrStationCode = Array.from(stationSet);

    arrStationCode = ['Tất cả', ...arrStationCode];

    //console.log('dataTable:', dataTable.length);
    //console.log('arrStationCode:', arrStationCode);
    hookProps.setState(state => {
      state.dataDB = dataDB;
      state.arrStation = arrStationCode;
      state.totalBCS = totalBCS.toString();
      state.totalSucceed = totalSucceed.toString();
      //state.dataTable = dataTable;
      state.selectedStation = null;
      return { ...state };
    });
    if (arrStationCode.length > 0) {
      ref?.current?.openDropdown();
    }

    //}
  } catch (err : any) {
    console.log(TAG, err.message);
  }
};

export const onInit = async (ref: any) => {
  navigation.addListener('focus', () => {
    getDataDb(ref);
  });
};

export const onDeInit = () => {};
