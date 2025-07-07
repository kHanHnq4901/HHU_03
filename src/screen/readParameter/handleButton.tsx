import { apsReadRf, PropsLabel, PropsResponse } from '../../service/hhu/aps/hhuAps';
import { getUnitByLabel } from '../../service/hhu/aps/utilFunc';
import {
  CommandRF,
  meterSpecies,
  PropsMeterSpecies,
  SUPPORT_NSX,
  TYPE_METER,
} from '../../service/hhu/defineEM';
import { isAllNumeric, showSnack, showToast, sleep } from '../../util';
import * as controller from './controller';
import { hookProps } from './controller';
import { HhuObj, ObjSend } from '../../service/hhu/hhuFunc';
import { store } from '../../component/drawer/drawerContent/controller';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { HhuApsHHMRead } from '../../service/hhu/otherNsx/huu_hong/hhuApsHHM';
import { Keyboard } from 'react-native';

const TAG = 'handleButton ReadParams';

export let arrSeri: string[] = [];

export const setArrSeri = (_arrSeri: string[]) => {
  arrSeri = _arrSeri;
};

export const filterSeri = (seri: string): any[] => {
  let data: any[] = [];
  if (seri === '') {
    data = [...arrSeri];
  } else {
    for (let item of arrSeri) {
      if (item.includes(seri)) {
        data.push(item);
      }
    }
  }

  return data.reverse();
};

export const onEditSeriDone = (text: string): void => {
  if (text.trim().length === 0) {
    return;
  }
  let arrSet = new Set<string>(arrSeri);
  arrSet.add(text);
  arrSeri = Array.from(arrSet);
  if (arrSeri.length > 5) {
    arrSeri.shift();
  }
};

const checkCondition = (): boolean => {
  Keyboard.dismiss();

  //console.warn("test here");
  if (store?.state.hhu.connect !== 'CONNECTED') {
    showToast('Chưa kết nối bluetooth');
    return false;
  }
  if (ObjSend.isShakeHanded !== true) {
    showToast('Chưa bắt tay được bluetooth');
    return false;
  }

  const strSei = hookProps.state.seri;

  if ((isAllNumeric(strSei) === false || (strSei.trim().length < 2))) {
    console.log(
      'controller.hookProps.state.seri:',
      controller.hookProps.state.seri,
    );

    showToast('Số Seri không hợp lệ');
    return false;
  }

  const isGelex = hookProps.state.typeNSX === 'GELEX';

  if(isGelex)
  {
    if (controller.hookProps.state.typeRead === 'Quét') {
      return true;
    }
    if (controller.hookProps.state.typeRead === 'Đồng bộ RTC') {
      if (
        hookProps.state.dropdown.meterSpecies.value ===
          meterSpecies['CE-18'].id &&
        hookProps.state.dropdown.meterSpecies.value === meterSpecies['ME-40'].id
      ) {
        return true;
      }
    }
    const isnot18GAndRepeater =
      hookProps.state.dropdown.meterSpecies.value !== meterSpecies.Repeater.id &&
      hookProps.state.dropdown.meterSpecies.value !== meterSpecies['CE-18G'].id;
    const isnotElster =
      hookProps.state.dropdown.meterSpecies.value !== meterSpecies.Elster.id;
    const isnotDcu =
      hookProps.state.dropdown.meterSpecies.value !== meterSpecies.Dcu.id;
    if (isnot18GAndRepeater && isnotElster && isnotDcu) {
      if (
        controller.hookProps.state.typeMeter !== 'IEC' &&
        controller.hookProps.state.typeMeter !== 'DLMS'
      ) {
        showToast('Chưa chọn giao thức IEC hay DLMS');
        return false;
      }
    }
    if (controller.hookProps) {
      switch (controller.hookProps.state.typeRead) {
        case 'Dữ liệu':
          if (controller.hookProps.state.dropdown.meterSpecies.value === null) {
            showToast('Chưa chọn loại công tơ');
            return false;
          }
          let hasItem = false;
          for (
            let i = 0;
            i < controller.hookProps.state.typeData.items.length;
            i++
          ) {
            if (controller.hookProps.state.typeData.items[i].checked) {
              hasItem = true;
              break;
            }
          }
          if (hasItem !== true) {
            showToast('Chưa chọn loại dữ liệu');
            return false;
          }
          break;
      }
    }

  }else{
    let hasItem = false;
    for (
      let i = 0;
      i < controller.hookProps.state.typeData.items.length;
      i++
    ) {
      if (controller.hookProps.state.typeData.items[i].checked) {
        hasItem = true;
        break;
      }
    }
    if (hasItem !== true) {
      showToast('Chưa chọn loại dữ liệu');
      return false;
    }
  }
  return true;
};

function updateDataToScreen(result: PropsResponse, i: number){
  console.log(TAG, 'result:', JSON.stringify(result));
  if (result.bSucceed === true) {
    const rows: string[][] = [];
    let row: string[] = [];
    for (let itm in result.obj) {
      const item = itm as keyof typeof result.obj;
      //console.log('type:',typeof result.obj[item]);
      if (typeof result.obj[item] === 'object') {
        if (Array.isArray(result.obj[item]) === true) {
          for (let element of result.obj[item] ?? []) {
            //@ts-expect-error
            for (let ob in element) {
              //console.log('element:', element);
              //@ts-expect-error
              if (element[ob]) {
                row = [];
                row.push(ob);
                row.push(
                  //@ts-expect-error
                  element[ob] + getUnitByLabel(ob as PropsLabel),
                );
                //console.log(row);
                rows.push(row);
              }
            }
          }
        } else {
        }
      } else {
        row = [];
        if (item === 'Serial') {
          //console.log('rows.length:', rows.length);
          if (hookProps.state.dataTable.length > 2) {
            continue;
          } else {
            row.push(item);
            row.push(
              result.obj[item] + getUnitByLabel(item as PropsLabel),
            );
            rows.push(row);
          }
        } else {
          if (result.obj[item]) {
            row.push(item);
            row.push(
              result.obj[item] + getUnitByLabel(item as PropsLabel),
            );
            rows.push(row);
          }
        }
      }
    }

    //console.log('rows:', rows);
    hookProps.setState(state => {
      if(state.typeNSX === 'GELEX')
      {
        state.status =
        'Đọc thành công ' +
        controller.hookProps.state.typeData.items[i].label;
      }else{
        state.status = result.strMessage;
      }
      
      state.dataTable = [...state.dataTable, ...rows];
      //console.log('ok here');
      return { ...state };
    });
  }else{
    hookProps.setState(state => {

      if(result.obj.Serial && state.dataTable.length === 0)
      {
        state.dataTable.push(['Serial', result.obj.Serial]);
      }
      state.status = result.strMessage;
      
      //console.log('ok here');
      return { ...state };
    });
  } 
}

const readData = async () => {
  let numRetries = Number(store?.state.appSetting.numRetriesRead);

  if (numRetries <= 0) {
    numRetries = 1;
  }

  const isGelex = hookProps.state.typeNSX === 'GELEX';

  for (let i = 0; i < controller.hookProps.state.typeData.items.length; i++) {
    if (controller.hookProps.state.requestStop === true) {
      break;
    } else {
      await sleep(150);
    }
    if (controller.hookProps.state.typeData.items[i].checked) {
      try {
        for (let j = 0; j < numRetries; j++) {

          let result : PropsResponse = {
            bSucceed: false,
            strMessage: '',
            obj: {},
          };
          if(isGelex)
          {
            let date: Date;

            if (controller.hookProps.state.is0h) {
              date = controller.hookProps.state.dateLatch;
            } else {
              date = new Date();
            }
  
            const idMeterSpecies =
              controller.hookProps.state.dropdown.meterSpecies.value;
            let is0h = controller.hookProps.state.is0h;
  
            

            if (
              store?.state.userRole !== 'admin' &&
              store?.state.userRole !== 'dvkh'
            ) {
              const isOnePrice =
                idMeterSpecies === meterSpecies['CE-18'].id ||
                idMeterSpecies === meterSpecies['ME-40'].id;
              if (isOnePrice) {
                is0h = false;
              }
            }
  
            if (idMeterSpecies === meterSpecies['CE-18G'].id) {
              is0h = false;
            }
  
            console.log('is0h:', is0h);
  
            result = await apsReadRf({
              seri: controller.hookProps.state.seri,
              command: controller.hookProps.state.typeData.items[i]
                .value as number,
              labelMeterSpecies: idMeterSpecies,
              is0h: is0h,
              is1Ch: controller.hookProps.state.is1c,
              date: date,
              typeMeter: controller.hookProps.state.typeMeter,
              seri18G: controller.hookProps.state.seri18G,
            });
            if(result.bSucceed)
            {
              updateDataToScreen(result, i);
            }else {
              hookProps.setState(state => {
                if (j !== numRetries - 1) {
                  state.status =
                    'Thực hiện thất bại ' +
                    ' lần ' +
                    (j + 1).toString() +
                    '. Đang thử lại ...';
                } else {
                  state.status =
                    'Thực hiện thất bại ' +
                    controller.hookProps.state.typeData.items[i].label +
                    ': ' +
                    result.strMessage;
                }
          
                result.strMessage;
                //state.dataTable = rows;
                //console.log('ok here');
                return { ...state };
              });
            }
            
          }else{
            await HhuApsHHMRead({
              seri: controller.hookProps.state.seri,
              cmd: controller.hookProps.state.typeData.items[i]
              .value as unknown as CommandRF,
              callBackReadDoneOnePara: (rest) => {
                updateDataToScreen(rest, i);
              },
            });
            // hookProps.setState(state => {
            //   state.status = 'Đọc xong ' + controller.hookProps.state.typeData.items[i].label;
            //   return { ...state };
            // });
            
          }
          
          // console.log('test here .....');
          // showSnack('Đọc lần ' + ( j + 1 ) + '/' + numRetries);
          // await sleep(200);
          break;
          
        }
      } catch (err : any) {
        console.log(TAG, err.message);
        return;
      }
    }
  }
};

const readUtil = async (commandID: number) => {
  let numRetries = 1;
  if (store.state.appSetting.numRetriesRead.trim().length !== 0) {
    numRetries = Number(store.state.appSetting.numRetriesRead);
    if (numRetries === 0) {
      numRetries = 1;
    }
  }
  let labelMeterSpecies: keyof PropsMeterSpecies =
    controller.hookProps.state.dropdown.meterSpecies.value;
  let typeMeter: TYPE_METER;

  if (commandID === CommandRF.FIND_BROADCAST) {
    if (labelMeterSpecies !== 'Dcu') {
      labelMeterSpecies = 'Broadcast_Meter';
    }

    typeMeter = 'IEC';
  } else {
    typeMeter = controller.hookProps.state.typeMeter;
  }

  for (let j = 0; j < numRetries; j++) {
    const result = await apsReadRf({
      seri: controller.hookProps.state.seri,
      command: commandID,
      labelMeterSpecies: labelMeterSpecies,
      is0h: controller.hookProps.state.is0h,
      is1Ch: controller.hookProps.state.is1c,
      date: new Date(),
      typeMeter: typeMeter,
    });

    console.log(TAG, 'result:', result);
    if (result.bSucceed === true) {
      const rows: string[][] = [];
      let row: string[] = [];
      for (let i in result.obj) {
        //console.log('i:', i);
        row = [];
        if (hookProps.state.dataTable.length > 0) {
          if (i === 'Serial') {
            continue;
          }
        }
        row.push(i);
        //@ts-expect-error
        row.push(result.obj[i] + getUnitByLabel(i as PropsLabel));
        rows.push(row);
      }
      //console.log('rows:', rows);
      hookProps.setState(state => {
        state.status = 'Thực hiện thành công ';
        state.dataTable = [...state.dataTable, ...rows];
        //console.log('ok here');
        return { ...state };
      });

      // console.log('test here .....');
      // showSnack('Đọc lần: ' + (j + 1 ) + '/' + numRetries);
      // await sleep(200);
      break;
    } else {
      if (store?.state.hhu.connect !== 'CONNECTED') {
        return;
      }
      hookProps.setState(state => {
        if (j !== numRetries - 1) {
          state.status =
            'Thực hiện thất bại ' +
            ' lần ' +
            (j + 1).toString() +
            '. Đang thử lại ...';
        } else {
          state.status = 'Thực hiện thất bại';
        }

        result.strMessage;
        //state.dataTable = rows;
        //console.log('ok here');
        return { ...state };
      });
    }
  }
};

export const onBtnReadPress = async () => {

  if (checkCondition() === false) {
    return;
  }

  hookProps.setState(state => {
    state.isReading = true;
    state.requestStop = false;
    state.status = 'Đang đọc ...';
    state.dataTable = [];
    return { ...state };
  });

  const isGelex = hookProps.state.typeNSX === 'GELEX';

  if(isGelex)
  {
    //init: 0x73 , reset 0x74, search 0x72, data
  
    switch (controller.hookProps.state.typeRead) {
      case 'Dữ liệu':
        await readData();
        break;
      case 'Phiên bản':
        break;
      case 'Khởi tạo':
        await readUtil(CommandRF.INIT_RF_MODULE);
        break;
  
      case 'Reconnect':
        await readUtil(CommandRF.RESET_RF_MODULE);
        break;
  
      case 'Dò sóng':
        await readUtil(CommandRF.SEARCH_METER);
        break;
      case 'Quét':
        await readUtil(CommandRF.FIND_BROADCAST);
        break;
      case 'Đồng bộ RTC':
        await readUtil(CommandRF.CMD_SYNC_TIME);
        break;
    }

  }else{

    await readData();

    // const re = await Read_Star({
    //   loaiBSC:'KT',
    //   seri: '1512006001',//'1916043541',
    //   // maCongto: ''
    // });
  
    // console.log('re:', re);
  }

  //await BleFunc_StopNotification(ObjSend.id);
  hookProps.setState(state => {
    state.isReading = false;
    if (state.status === 'Đọc xong') {
      state.status = '';
    }
    return { ...state };
  });
  return;
};

export function onSelectDatePress(date: DateTimePickerEvent) {
  console.log(JSON.stringify(date));

  if (date.type === 'set') {
    hookProps.setState(state => {
      state.dateLatch = new Date(date.nativeEvent.timestamp as string | number);
      return { ...state };
    });
  }
}

export function onTypeNSXChange(nsx: SUPPORT_NSX){

  hookProps.setState(state => {

    state.typeNSX = nsx;

    let val : string = '';
    if(nsx === 'GELEX')
    {
      val = state.dropdown.meterSpecies.value;
    }else{

      val = meterSpecies.HHM.id;
    }

    state.dropdown.meterSpecies.value = null;
    state.typeData.items = [];
    meterSpecies[val as keyof PropsMeterSpecies]?.allowTypeRead.forEach(item => {
      state.typeData.items.push({
        label: item.label,
        value: item.value,
        checked: false,
      });
    });

    return {...state};
  });

}