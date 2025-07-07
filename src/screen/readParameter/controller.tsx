import React, { useContext, useState } from 'react';
import {
  getMeterSpeciesDropDownProps,
  PropsCheckBox,
  PropsDropdown,
  SUPPORT_NSX,
  TYPE_METER,
} from '../../service/hhu/defineEM';
import { getArrSeri, saveArrSeri } from '../../service/storage';
import { PropsStore, storeContext } from '../../store';
import { arrSeri, setArrSeri } from './handleButton';
import { NavigationProp } from '@react-navigation/native';

type StateProps = {
  status: string;
  requestStop: boolean;
  seri: string;
  seri18G: string;
  typeRead: RadioButton_TypeReadableData;
  typeMeter: TYPE_METER;
  dataTable: RowTableProps;
  isReading: boolean;
  numberRetries: string;
  dropdown: {
    meterSpecies: {
      open: boolean;
      value: any;
      items: PropsDropdown[];
    };
  };
  is0h: boolean;
  is1c: boolean;
  dateLatch: Date;
  typeData: {
    items: PropsCheckBox[];
  };
  showControl: boolean;
  typeNSX: SUPPORT_NSX;
};

export const itemTypeMeter: PropsCheckBox[] = [
  {
    label: 'IEC',
    value: 'IEC',
  },
  {
    label: 'DLMS',
    value: 'DLMS',
  },
];

export type RadioButton_TypeReadableData =
  | 'Dữ liệu'
  | 'Phiên bản'
  | 'Khởi tạo'
  | 'Dò sóng'
  | 'Reconnect'
  | 'Quét'
  | 'Đồng bộ RTC';

export const dataReadRadioButton: RadioButton_TypeReadableData[] = Array.from(
  new Set<RadioButton_TypeReadableData>([
    'Dữ liệu',
    // 'Phiên bản',

    'Dò sóng',
    // 'Khởi tạo',
    // 'Reconnect',
  ]),
);

export const listNSX : SUPPORT_NSX[] = ['GELEX', 'Hữu Hồng'];

type HookProps = {
  state: StateProps;
  setState: React.Dispatch<React.SetStateAction<StateProps>>;
};

type RowTableProps = string[][]; //[[string, string]];

export const dataHeaderTable = ['Thông số', 'Giá trị'];

export const hookProps = {} as HookProps;

export const GetHookProps = (): HookProps => {
  const [state, setState] = useState<StateProps>({
    status: '',
    requestStop: false,
    seri: '1946004675',
    seri18G: '',
    typeRead: 'Dữ liệu',
    dataTable: [
      // ['U', '0 (V)'],
      // ['I', '2023-07-14 14:26:30'],
      ['U', '0 (V)'],
      ['I', '0 (A)'],
      // ['U', '0 (V)'],
      // ['I', '0 (A)'],
      // ['U', '0 (V)'],
      // ['I', '0 (A)'],
      // ['U', '0 (V)'],
      // ['I', '0 (A)'],
      // ['U', '0 (V)'],
      // ['I', '0 (A)'],
    ],
    isReading: false,
    numberRetries: '1',
    dropdown: {
      meterSpecies: {
        open: false,
        value: null,
        items: getMeterSpeciesDropDownProps(),
      },
    },
    is0h: false,
    is1c: true,
    dateLatch: new Date(),
    typeData: {
      items: [],
    },
    typeMeter: null,
    showControl: true,
    typeNSX: 'GELEX',
  });
  hookProps.state = state;
  hookProps.setState = setState;
  //console.log('hookState:', hookProps.state);
  return hookProps;
};

export const onInit = async (navigation: NavigationProp<ReactNavigation.RootParamList>) => {
  navigation.addListener('focus', async () => {
    const arrSei_ = await getArrSeri();
    setArrSeri(arrSei_);
  });
  navigation.addListener('blur', () => {
    //console.log('obBlur...');
    saveArrSeri(arrSeri);
  });
};
export const onDeInit = () => {
  saveArrSeri(arrSeri);
};
