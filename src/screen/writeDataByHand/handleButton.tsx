import { formatDateTimeDB } from '../../service/hhu/aps/util';
import { isNumeric, showAlert, showToast } from '../../util';
import { PropsDatatable } from '../writeDataByBookCode/controller';
import { hookProps, LabelDropdown } from './controller';
import { PropsResponseUpdateDataToDB, updateDataToDB } from '../writeDataByBookCode/handleButton';
import { PropsCondition } from '../../database/repository';
import { PropsKHCMISModel, dataDBTabel } from '../../database/model';
import { VersionMeter } from '../../service/hhu/defineEM';
import { CMISKHServices } from '../../database/service';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { onDeletePicture } from '../../component/getPicture/handle';

const TAG = 'Handle Write Data By Hand:';

let goBackBusy = false;
export async function onGoBackPress(navigation: any, item: PropsKHCMISModel){

    if(goBackBusy)
    {
      console.log('goBackBusy');
      
      return;
    }

    goBackBusy = true;

    console.log('goBack');

    await WhetherSaveImage(item);

    goBackBusy = false;
    
    navigation.goBack();
}

export const checkCondition = (isManyPrice: boolean): boolean => {
  let status = '';
  let res = true;
  let csMoi = hookProps.state.CS_Moi.trim();
  let PMax = hookProps.state.Pmax.trim();

  if(csMoi === '')
  {
    csMoi = '0';
    //hookProps.state.CS_Moi = 
  }
  if(PMax === '')
  {
    PMax = '0';
  }

  if (isNumeric(csMoi) === false) {
    status += 'Chỉ số mới không hợp lệ ';
    res = false;
  } else {
    if (Number(csMoi) < 0) {
      status += 'Chỉ số mới phải lớn hơn hoặc bằng 0 ';
      res = false;
    }
  }
  if (isManyPrice) {
    if (isNumeric(PMax) === false) {
      status += 'Pmax không hợp lệ ';
      res = false;
    } else {
      if (Number(PMax) < 0) {
        status += 'Pmax phải lớn hơn hoặc bằng 0 ';
        res = false;
      }
    }
    if (!hookProps.state.datePmax) {
      status += 'Chưa chọn ngày Pmax ';
      res = false;
    }
  }
  if (res === false) {
    hookProps.setState(state => {
      state.status = status;
      return { ...state };
    });
    return false;
  } else {
    return true;
  }
};

export const onWriteByHandDone = async (props: PropsDatatable) => {
  hookProps.setState(state => {
    state.status = status;
    state.isWriting = true;
    return { ...state };
  });

  const NO = props.data.SERY_CTO;
  const loaiBCS = props.data.LOAI_BCS;
  const RF = props.data.RF;
  const isManyPrice = props.isManyPrice;

  let objUpdateDb : PropsResponseUpdateDataToDB = {
    bSucceed: false,
    bIsCancelled: false
  };

  //console.log('aaa:',hookProps.state.dateLatch.toLocaleString('vi'));
  

  try {
    objUpdateDb = await updateDataToDB({
      seri: NO,
      BCSCMIS: loaiBCS,
      RfCode: RF,
      newCapacity: Number(hookProps.state.CS_Moi) - Number(props.data.CS_CU), // dont care
      oldCapacity: Number(props.data.SL_CU), // dont care
      date: hookProps.state.dateLatch,
      T0: hookProps.state.CS_Moi,
      Pmax: isManyPrice ? hookProps.state.Pmax : undefined,
      datePmax: isManyPrice ? formatDateTimeDB(hookProps.state.datePmax) : formatDateTimeDB(new Date('1970-01-01T00:00:00')),
      isWriteHand: true,
      ghiChu:
        hookProps.state.ghichu.trim().length === 0
          ? undefined
          : hookProps.state.ghichu,
    });
  } catch (err :any) {
    console.log(TAG, 'err:', err.message);
    
    //writeDBSuccess = false;
  }

  let status = '';

  if (objUpdateDb.bSucceed === true) {
    status = 'Ghi tay thành công ' + loaiBCS + ' của ' + NO;
  } else if(objUpdateDb.bIsCancelled === false) {
    status = 'Ghi DB lỗi';
  }

  hookProps.setState(state => {
    state.status = status;
    state.isWriting = false;
    return { ...state };
  });
  // hookPropsWriteRegister.setState(state => {
  //   state.status = status;
  //   if (writeDBSuccess) {
  //     hookPropsWriteRegister.setState(state => {
  //       state.dataTable = state.dataTable.map(item => {
  //         if (item.id === props.id) {
  //           props.data.LoaiDoc = TYPE_READ_RF.WRITE_BY_HAND;
  //           props.data.CS_MOI = Number(hookProps.state.CS_Moi);
  //           props.data.NGAY_MOI = formatDateTimeDB(new Date());
  //           if (isManyPrice) {
  //             props.data.PMAX = Number(hookProps.state.Pmax);
  //           }
  //           if (isManyPrice) {
  //             props.data.NGAY_PMAX = formatDateTimeDB(hookProps.state.datePick);
  //           }
  //           if (hookProps.state.ghichu.trim().length > 0) {
  //             props.data.GhiChu = hookProps.state.ghichu;
  //           }
  //           item = { ...item };
  //         }
  //         return item;
  //       });
  //       return { ...state };
  //     });
  //   } else {
  //     state.status += ' .Ghi DB lỗi';
  //   }

  //   return { ...state };
  // });
};

export async function onChangeTypeMeterPress(props: PropsDatatable) {
  const valuesSet = {};

  if (hookProps.state.selectedItemDropdown === null) {
    hookProps.setState(state => {
      state.status = 'Chưa chọn kiểu công tơ muốn chuyển';
      return { ...state };
    });
    return;
  }
  if (
    hookProps.state.currentTypeMeter === hookProps.state.selectedItemDropdown
  ) {
    hookProps.setState(state => {
      state.status = 'Cập nhật kiểu công tơ thành công';
      return { ...state };
    });
    return;
  }

  const condition: PropsCondition = {
    data: {},
    logic: '=',
    operator: 'AND',
  };

  const NO = props.data.SERY_CTO;

  condition.data[dataDBTabel.SERY_CTO.id as string] = NO;

  valuesSet[dataDBTabel.RF.id as string] =
    hookProps.state.selectedItemDropdown === 'IEC'
      ? VersionMeter.IEC
      : hookProps.state.selectedItemDropdown === 'DLMS v2'
      ? VersionMeter.DLMS_ONE_CHANEL
      : VersionMeter.DLMS_MANY_CHANEL;
  console.log('RF update:', valuesSet[dataDBTabel.RF.id as string]);

  for (let i = 0; i < 3; i++) {
    const updateSucceed = await CMISKHServices.update(condition, valuesSet);
    if (updateSucceed) {
      console.log('update table succeed');
      //showToast('Cập nhật thành công');
      hookProps.setState(state => {
        state.currentTypeMeter = hookProps.state
          .selectedItemDropdown as LabelDropdown;
        state.status = 'Cập nhật kiểu công tơ thành công';
        return { ...state };
      });
      return true;
    } else {
      console.log('update table failed');
      hookProps.setState(state => {
        state.status = 'Cập nhật kiểu công tơ thất bại';
        return { ...state };
      });
    }
  }
}

export function onSelectDatePress(date: DateTimePickerEvent) {
  console.log(JSON.stringify(date));

  if (date.type === 'set') {
    hookProps.setState(state => {
      state.dateLatch = new Date(date.nativeEvent.timestamp as string | number);
      return { ...state };
    });
  }
}


export function onSelectDatePmaxPress(date: DateTimePickerEvent) {
  console.log(JSON.stringify(date));

  if (date.type === 'set') {
    console.log('setDate');
    hookProps.setState(state => {
      state.datePmax = new Date(date.nativeEvent.timestamp as number);
      return { ...state };
    });
  }
}

export async function SaveImageToDb(item: PropsKHCMISModel, base64: string) : Promise<boolean>{
  try{

    const valuesSet = {};

    const condition: PropsCondition = {
      data: {},
      logic: '=',
      operator: 'AND',
    };
  
    const NO = item.SERY_CTO;
  
    condition.data[dataDBTabel.SERY_CTO.id as string] = NO;
    condition.data[dataDBTabel.LOAI_BCS.id as string] = item.LOAI_BCS;
  
    valuesSet[dataDBTabel.image.id as string] =
    base64;
    valuesSet[dataDBTabel.hasImage.id as string] =
    '1';
    //console.log('RF update:', valuesSet[dataDBTabel.RF.id as string]);
  
    for (let i = 0; i < 1; i++) {
      const updateSucceed = await CMISKHServices.update(condition, valuesSet);
      if (updateSucceed) {
        console.log('save image succeed');
        return true;
        
      } else {
        console.log('update table failed');
        await showAlert('Lưu ảnh thất bại');
      }
    }

  }catch(err : any){
    await showAlert('Lưu ảnh thất bại :' + err.message ?? String(err));
    
  }
  return false;
}

export async function WhetherSaveImage(item: PropsKHCMISModel){
  if(hookProps.state.images.length == 0){
    return;
  }
  const bas64String = hookProps.state.images[0].base64;
  const identityImage = bas64String ? bas64String.substring( bas64String.length >= 10 ?  bas64String.length  - 10 : 0, bas64String.length): ''; 
  if(hookProps.state.oldStrImageIdentity === identityImage)
  {
    return;
  }
  console.log('sava image to data base');
  showToast('Đang lưu hình ảnh ...');
  await SaveImageToDb(item, bas64String ?? '');
  await onDeletePicture(hookProps.state.images[0], ()=>{});
  
}
