import { PropsKHCMISModel } from '../../database/model';
import {
  getLabelAndIsManyPriceByCodeMeter,
  IsAbnormal,
  IsReadRFSucceed,
  IsWriteByHand,
  TYPE_READ_RF,
} from '../../service/hhu/defineEM';
import { showAlert } from '../../util';
import { exportDateToExcel } from '../../util/excel';
import { PropsDatatable } from '../writeDataByBookCode/controller';
import {
  addMoreItemToRender,
  hookProps,
  navigation,
  PropsTable,
} from './controller';

type PropsFilter = {
  station: string;
  isReadSucceed: boolean;
  isNoRead: boolean;
  isReadFailed: boolean;
  isWriteHand: boolean;
  isAbnormal: boolean;
  isNegativeCapacity: boolean;
  isUpperThreshold: boolean;
  isLowerThreshold: boolean;
  searchText?: string;
};

const funcFilter = (
  dataDB: PropsKHCMISModel[],
  filter: PropsFilter,
): { dataTable: PropsTable; totalBCS: number; totalSucceed: number } => {
  let totalBCS = 0;
  let totalSucceed = 0;
  let dataTb: PropsTable = {
    render: [],
    noRender: [],
  };

  console.log('filter:', filter);
  for (let item of dataDB) {

    if(filter.station === 'Tất cả')
    {

    }else{

      if (item.MA_TRAM !== filter.station) {
        continue;
      }
    }

    const labelAndIsManyPrice = getLabelAndIsManyPriceByCodeMeter(
      item.MA_CTO,
          item.SERY_CTO,
    );
    dataTb.noRender.push({
      checked: false,
      data: item,
      id: item.id,
      show: true,
      stt: item.TT.toString(),
      isManyPrice: labelAndIsManyPrice.isManyPrice,
      labelMeter: labelAndIsManyPrice.label,
      versionMeter: item.RF
    });
  }
  //console.log('dataTb:', dataTb.length);
  dataTb.noRender = dataTb.noRender.map(itm => {
    //console.log('a');
    if (
      filter.isReadSucceed ||
      filter.isNoRead ||
      filter.isReadFailed ||
      filter.isWriteHand ||
      filter.isAbnormal ||
      filter.isNegativeCapacity ||
      filter.isUpperThreshold ||
      filter.isLowerThreshold 
    ) {
      //console.log('a');
      itm.show = false;
      for (let i = 0; i < 1; i++) {
        if (filter.isReadSucceed) {
          if (IsReadRFSucceed(itm.data.LoaiDoc as TYPE_READ_RF)) {
            itm.show = true;
            break;
          }
        }
        if (filter.isNoRead) {
          if (itm.data.LoaiDoc === TYPE_READ_RF.HAVE_NOT_READ) {
            itm.show = true;
            break;
          }
        }
        
        if (filter.isReadFailed) {
          if (itm.data.LoaiDoc === TYPE_READ_RF.READ_FAILED) {
            itm.show = true;
            break;
          }
        }
        if (filter.isAbnormal) {
          if (IsAbnormal(itm.data.LoaiDoc as TYPE_READ_RF)) {
            itm.show = true;
            break;
          }
        }
        if (filter.isWriteHand) {
          if (IsWriteByHand(itm.data.LoaiDoc as TYPE_READ_RF)) {
            itm.show = true;
            break;
          }
        }
        if (filter.isNegativeCapacity) {
          if (
            itm.data.LoaiDoc === TYPE_READ_RF.ABNORMAL_NEGATIVE ||
            itm.data.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE 

            ) {
            itm.show = true;
            break;
          }
        }
        if (filter.isUpperThreshold) {
          if (
            itm.data.LoaiDoc === TYPE_READ_RF.ABNORMAL_UPPER ||
            itm.data.LoaiDoc === TYPE_READ_RF.ABNORMAL_CAPACITY ||
            itm.data.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER
          ) {
            itm.show = true;
            break;
          }
        }
        if (filter.isLowerThreshold) {
          if (
            itm.data.LoaiDoc === TYPE_READ_RF.ABNORMAL_LOWER ||
            itm.data.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER
          ) {
            itm.show = true;
            break;
          }
        }
      }
    } else {
      itm.show = true;
      //console.log('b');
    }

    //console.log('k:', itm.show);

    if (filter.searchText) {
      //console.log('k:', filter.column);
      let searchText = filter.searchText.toLowerCase();
      if (itm.show === true) {
        itm.show = false;
        for (let i = 0; i < 1; i++) {
          if (itm.labelMeter.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.SERY_CTO.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.LOAI_BCS.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.MA_QUYEN.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.MA_COT.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.TEN_KHANG.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.MA_KHANG.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
          if (itm.data.DIA_CHI.toLowerCase().includes(searchText)) {
            itm.show = true;
            break;
          }
        }
      }
    }
    //console.log('itm.show:', itm.show);
    if (itm.show === true) {
      totalBCS++;
      if (
        IsReadRFSucceed(itm.data.LoaiDoc as TYPE_READ_RF) ||
        IsWriteByHand(itm.data.LoaiDoc as TYPE_READ_RF) 
      ) {
        totalSucceed++;
      }
    }
    itm.data = { ...itm.data };
    return { ...itm };
  });

  dataTb.render = [];

  dataTb = addMoreItemToRender(dataTb);

  return {
    dataTable: dataTb,
    totalBCS: totalBCS,
    totalSucceed: totalSucceed,
  };
};

export const onChangeTextSearch = (searchText: string) => {
  if (!hookProps.state.selectedStation) {
    return;
  }
  hookProps.setState(state => {
    let isReadSucceed = state.arrCheckBoxRead.find(
      itm => itm.label === 'Thành công RF',
    )?.checked;
    let isNoRead = state.arrCheckBoxRead.find(
      itm => itm.label === 'Chưa đọc',
    )?.checked;
    let isReadFailed = state.arrCheckBoxRead.find(
      itm => itm.label === 'Đọc lỗi',
    )?.checked;
    let isAbnormal = state.arrCheckBoxRead.find(
      itm => itm.label === 'Bất thường',
    )?.checked;
    let isWriteHand = state.arrCheckBoxRead.find(
      itm => itm.label === 'Ghi tay',
    )?.checked;
    let isNegative = state.arrCheckBoxRead.find(
      itm => itm.label === 'Sản lượng âm',
    )?.checked;
    let isUpperThreshold = state.arrCheckBoxRead.find(
      itm => itm.label === 'Vượt ngưỡng trên',
    )?.checked;
    let isLowerThreshold = state.arrCheckBoxRead.find(
      itm => itm.label === 'Vượt ngưỡng dưới',
    )?.checked;

    const result = funcFilter(state.dataDB, {
      station: state.selectedStation as string,
      isReadSucceed: isReadSucceed as boolean,
      isNoRead: isNoRead as boolean,
      isAbnormal: isAbnormal as boolean,
      isReadFailed: isReadFailed as boolean,
      isWriteHand: isWriteHand as boolean,
      searchText: searchText,
      isNegativeCapacity: isNegative as boolean,
      isUpperThreshold: isUpperThreshold as boolean,
      isLowerThreshold: isLowerThreshold as boolean
    });
    state.dataTable = result.dataTable;
    state.totalBCS = result.totalBCS.toString();
    state.totalSucceed = result.totalSucceed.toString();
    return { ...state };
  });
};

export const onStationSelected = (sation: string) => {
  hookProps.setState(state => {
    state.status = 'Đang cập nhật dữ liệu';
    return { ...state };
  });

  let isReadSucceed = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Thành công RF',
  )?.checked;
  let isNoRead = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Chưa đọc',
  )?.checked;
  let isReadFailed = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Đọc lỗi',
  )?.checked;
  let isAbnormal = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Bất thường',
  )?.checked;
  let isWriteHand = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Ghi tay',
  )?.checked;
  let isNegative = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Sản lượng âm',
  )?.checked;
  let isUpperThreshold = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Vượt ngưỡng trên',
  )?.checked;
  let isLowerThreshold = hookProps.state.arrCheckBoxRead.find(
    itm => itm.label === 'Vượt ngưỡng dưới',
  )?.checked;
  //console.log('k');
  const result = funcFilter(hookProps.state.dataDB, {
    station: sation as string,
    isReadSucceed: isReadSucceed as boolean,
    isNoRead: isNoRead as boolean,
    isAbnormal: isAbnormal as boolean,
    isReadFailed: isReadFailed as boolean,
    isWriteHand: isWriteHand as boolean,
    isNegativeCapacity: isNegative as boolean,
    isUpperThreshold: isUpperThreshold as boolean,
    isLowerThreshold: isLowerThreshold as boolean
  });




  hookProps.setState(state => {
    state.status = '';
    state.selectedStation = sation;
    state.dataTable = result.dataTable;
    state.totalBCS = result.totalBCS.toString();
    state.totalSucceed = result.totalSucceed.toString();
    return { ...state };
  });
};

export const onCheckBoxTypeReadChange = (label: string) => {
  hookProps.setState(state => {
    state.arrCheckBoxRead = state.arrCheckBoxRead.map(cb => {
      if (cb.label === label) {
        cb.checked = !cb.checked;
      }
      return { ...cb };
    });

    let isReadSucceed = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Thành công RF',
    )?.checked;
    let isNoRead = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Chưa đọc',
    )?.checked;
    let isReadFailed = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Đọc lỗi',
    )?.checked;
    let isAbnormal = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Bất thường',
    )?.checked;
    let isWriteHand = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Ghi tay',
    )?.checked;
    let isNegative = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Sản lượng âm',
    )?.checked;
    let isUpperThreshold = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Vượt ngưỡng trên',
    )?.checked;
    let isLowerThreshold = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Vượt ngưỡng dưới',
    )?.checked;
    //console.log('k');

    const result = funcFilter(hookProps.state.dataDB, {
      station: hookProps.state.selectedStation as string,
      isReadSucceed: isReadSucceed as boolean,
      isNoRead: isNoRead as boolean,
      isAbnormal: isAbnormal as boolean,
      isReadFailed: isReadFailed as boolean,
      isWriteHand: isWriteHand as boolean,
      isNegativeCapacity: isNegative as boolean,
      isUpperThreshold: isUpperThreshold as boolean,
      isLowerThreshold: isLowerThreshold as boolean
    });

    state.dataTable = result.dataTable;
    state.totalBCS = result.totalBCS.toString();
    state.totalSucceed = result.totalSucceed.toString();
    return { ...state };
  });
};

export type PropsPencil = {
  data: PropsDatatable;
};

export const onPencilPress = (props: PropsPencil) => {
  //console.log('navigation:', props.navigation);
  navigation.navigate('ViewRegisterDetailed', {
    data: props.data,
  });
};
export async function onExportExcelPress(){

  let ok = false;
  await showAlert('Bạn có muốn xuất dữ liệu ra file excel ?', 
    {
      label: 'OK',
      func: () => {
        ok = true;
      },
    },
    {
      label: 'Hủy',
      func: () => {},
    },
  );

  if(!ok){
    return;
  }

  hookProps.setState(state => {
    state.isBusy = true;
    return {...state};
  });

  try{

    const data : PropsKHCMISModel[] = [];

    for(let kh of hookProps.state.dataTable.render)
    {
      if(kh.show)
      {
        data.push(kh.data);
      }
    }
    for(let kh of hookProps.state.dataTable.noRender)
    {
      if(kh.show)
      {
        data.push(kh.data);
      }
    }

    const nameSheet = GetNameSheet();
    
    await exportDateToExcel('Glx_HU_01_export', nameSheet, data);

  }catch(err: any){
    showAlert('Lỗi:'+ String(err.message));
  }

  finally{{
    hookProps.setState(state => {
      state.isBusy = false;
      return {...state};
    });
  }}

}

function GetNameSheet(): string{

  let nameSheet = '';

    let isReadSucceed = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Thành công RF',
    )?.checked;
    let isNoRead = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Chưa đọc',
    )?.checked;
    let isReadFailed = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Đọc lỗi',
    )?.checked;
    let isAbnormal = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Bất thường',
    )?.checked;
    let isWriteHand = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Ghi tay',
    )?.checked;
    let isNegative = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Sản lượng âm',
    )?.checked;
    let isUpperThreshold = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Vượt ngưỡng trên',
    )?.checked;
    let isLowerThreshold = hookProps.state.arrCheckBoxRead.find(
      itm => itm.label === 'Vượt ngưỡng dưới',
    )?.checked;

  if (isReadSucceed) {
    nameSheet += 'Thành công RF, '
  }
  if (isNoRead) {
    nameSheet += 'Chưa đọc, '
  }
  
  if (isReadFailed) {
    nameSheet += 'Đọc lỗi, '
  }
  if (isAbnormal) {
    nameSheet += 'Bất thường, '
  }
  if (isWriteHand) {
    nameSheet += 'Ghi tay, '
  }
  if (isNegative) {
    nameSheet += 'SL âm, '
  }
  if (isUpperThreshold) {
    nameSheet += 'Vượt trên, '
  }
  if (isLowerThreshold) {
    nameSheet += 'Vượt dưới, '
  }

  return nameSheet;
}