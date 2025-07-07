import React, { useState } from 'react';
import { PropsKHCMISModel } from '../../database/model';
import { GetLoaiDocRFString, TYPE_READ_RF, VersionMeter, getLabelAndIsManyPriceByCodeMeter } from '../../service/hhu/defineEM';
import { PropsData } from '../ViewDetailRegister/index';
import SelectDropdown from 'react-native-select-dropdown';
import { UserImageProps } from '../../component/getPicture';
import { uniqueId } from 'lodash';
import { GetImageInDB } from '../../database/service';
import { isValidDate } from '../../service/hhu/aps/util';

export type LabelDropdown = 'IEC' | 'DLMS v2' | 'DLMS v1';
export type HookState = {
  CS_Moi: string;
  dateLatch: Date;
  Pmax: string;
  datePmax: Date;
  ghichu: string;
  status: string;
  allowWrite: boolean;
  isWriting: boolean;
  dropdownStationCode: LabelDropdown[];
  selectedItemDropdown: LabelDropdown | null;
  currentTypeMeter: LabelDropdown;
  images: UserImageProps[];
  oldStrImageIdentity: string;
  isGelexMeter: boolean;
  dataTable: PropsData;
  stateRFString: string;
};

export type HookProps = {
  state: HookState;
  setState: React.Dispatch<React.SetStateAction<HookState>>;
  refTypeMeter: React.RefObject<SelectDropdown>;
};

const TAG = ' Controller WriteByHand: ';

export const hookProps = {} as HookProps;

export const GetHook = (): HookProps => {
  const [state, setState] = useState<HookState>({
    CS_Moi: '',
    dateLatch: new Date(),
    Pmax: '',
    datePmax: new Date(),
    ghichu: '',
    status: '',
    allowWrite: false,
    isWriting: false,
    dropdownStationCode: ['IEC', 'DLMS v1', 'DLMS v2'],
    selectedItemDropdown: null,
    currentTypeMeter: 'IEC',
    images: [],
    oldStrImageIdentity: '',
    isGelexMeter: true,
    dataTable: [],
    stateRFString: '',
  });
  hookProps.state = state;
  hookProps.setState = setState;

  hookProps.refTypeMeter = React.createRef<SelectDropdown>();

  return hookProps;
};

export const onInit = async (item: PropsKHCMISModel) => {
  if(item.hasImage ==='1')
  {
    //console.log('push image here', item.image.substring(item.image.length - 10 ,item.image.length));
    
    hookProps.state.images = [];
    const bas64String = await GetImageInDB(item.SERY_CTO, item.LOAI_BCS);
    //console.log(bas64String);
    
    if(bas64String)
    {
      console.log('push image from db to hook');
      
      hookProps.state.oldStrImageIdentity = bas64String.substring( bas64String.length >= 10 ?  bas64String.length  - 10 : 0, bas64String.length); 
      hookProps.state.images.push({
        base64: bas64String,
        fileName: uniqueId(),
      });
      hookProps.setState(state => {
        return {...state}
      });
    }
    
  }

  
};

export const onBeforeInit = async (
  item: PropsKHCMISModel,
  isManyPrice: boolean,
) => {

  const labelAndManyPrice = getLabelAndIsManyPriceByCodeMeter(item.MA_CTO,
  item.SERY_CTO,);

  hookProps.state.stateRFString = item.LoaiDoc;
  
  const dataTable: PropsData = getTableContent(item);

  const strRFState = GetLoaiDocRFString(item.LoaiDoc as TYPE_READ_RF);

  dataTable.push({
    label: 'Trạng thái trước',
    content: strRFState,
  });

  hookProps.setState(state => {
    state.CS_Moi = item.CS_MOI.toString();
    //console.log('item.NGAY_MOI:', item.NGAY_MOI);

    state.dateLatch = new Date(item.NGAY_MOI);
    if (isManyPrice) {
      state.Pmax = item.PMAX.toString();
      state.datePmax = new Date(item.NGAY_PMAX);
      if(isValidDate(state.datePmax) === false)
      {
        state.datePmax = new Date();
      }
    }
    if (
      // item.LoaiDoc === TYPE_READ_RF.READ_FAILED ||
      // item.LoaiDoc === TYPE_READ_RF.ABNORMAL_CAPACITY
      item.LoaiDoc !== TYPE_READ_RF.READ_SUCCEED
    ) {
      state.allowWrite = true;
    } else {
      state.allowWrite = false;
    }
    // console.warn('test allowWrite here');
    //state.allowWrite = true;


    state.currentTypeMeter =
      item.RF === VersionMeter.IEC
        ? 'IEC'
        : item.RF === VersionMeter.DLMS_ONE_CHANEL
        ? 'DLMS v2'
        : 'DLMS v1';
    const indexTypeMeter = hookProps.state.dropdownStationCode.findIndex(
      it => it === state.currentTypeMeter,
    );
    hookProps.refTypeMeter?.current?.selectIndex(indexTypeMeter);

    if(labelAndManyPrice.label === 'not GELEX')
    {
      state.isGelexMeter = false;
    }

    state.ghichu = item.GhiChu;

    state.dataTable = dataTable;

    //console.log('item Rf bẻoe Init:', item.RF);
    return { ...state };
  });
};

export const onDeInit = () => {};

export const getTableContent = (item: PropsKHCMISModel): PropsData => {
  const data: PropsData = [];
  data.push({
    label: 'KH',
    content: item.TEN_KHANG,
  });
  data.push({
    label: 'Mã KH',
    content: item.MA_KHANG,
  });
  data.push({
    label: 'Đ/c',
    content: item.DIA_CHI,
  });
  if(hookProps.state.isGelexMeter)
  {
    data.push({
      label: 'Kiểu CT:',
      content: hookProps.state.currentTypeMeter,
    });
  }
 
  data.push({
    label: 'Bộ CS',
    content: item.LOAI_BCS,
  });
  data.push({
    label: 'CS cũ',
    content: item.CS_CU + ' (kWh)',
  });
  data.push({
    label: 'SL cũ',
    content: item.SL_CU + ' (kWh)',
  });
  // data.push({
  //   label: 'Ngày mới',
  //   content: new Date(item.NGAY_MOI).toLocaleDateString('vi'),
  // });

  return data;
};


