import { Vibration } from 'react-native';
import { dataDBTabel } from '../../database/model';
import { PropsCondition } from '../../database/repository';
import { CMISKHServices } from '../../database/service';
import {
  PropsExtraLabelPower,
  PropsLabelPower,
} from '../../service/hhu/aps/hhuAps';
import { apsReadRfGCS } from '../../service/hhu/aps/hhuApsGCS';
import { formatDateTimeDB } from '../../service/hhu/aps/util';
import { IsAbnormal, IsReadRFSucceed, IsWriteByHand, POWER_DEFINE, TYPE_READ_RF, getLabelAndIsManyPriceByCodeMeter } from '../../service/hhu/defineEM';
import { niceBytes, showAlert, showSnack, sleep } from '../../util';
import {
  addMoreItemToRender,
  hookProps,
  navigation,
  PropsDatatable,
  PropsTable,
} from './controller';

import { hookProps as selectBookCodeHook } from '../selectBookCode/controller';
import { store } from '../../component/drawer/drawerContent/controller';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import { requestCameraPermissions } from '../../service/permission';
import { onDeletePicture, onTakePicturePress } from '../../component/getPicture/handle';
import { SaveImageToDb } from '../writeDataByHand/handleButton';
import { data } from '../../component/alert/index';
import { PropsResponse } from '../../service/hhu/aps/hhuAps';
import { ReadApsGcsHHM } from '../../service/hhu/otherNsx/huu_hong/hhuApsGcsHHM';
import { WriteLog } from '../../shared/file';

const TAG = 'WriteByBookCode';

export function onItemPress(item: PropsDatatable) {
  hookProps.setState(state => {
    for (let _key in state.dataTable) {
      const key = _key as keyof typeof  state.dataTable;
      let stateChecked : boolean | null = null;
      state.dataTable[key] = state.dataTable[key].map(itm => {
        if (itm.data.SERY_CTO === item.data.SERY_CTO) {
          if (
            IsReadRFSucceed(itm.data.LoaiDoc as TYPE_READ_RF)
            // item.data.LoaiDoc === TYPE_READ_RF.READ_SUCCEED ||
            // item.data.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND
          ) {
            itm.checked = false;
          } else {
            if(stateChecked === null){
              stateChecked = !itm.checked;
            }
            itm.checked = stateChecked;
          }
        }
        return { ...itm };
      });
    }
    return { ...state };
  });
}

type PropsFilter = {
  column: string;
  isNoRead: boolean;
  isReadFailed: boolean;
  isWriteHand: boolean;
  isAbnormal: boolean;
  searchText?: string;
};

const setStatus = (value: string) => {
  hookProps.setState(state => {
    state.status = value;
    return { ...state };
  });
};

const funcFilter = (
  dataTable: PropsTable,
  filter: PropsFilter,
): { dataTable: PropsTable; totalBCS: number; totalSucceed: number } => {
  //console.log('filter:', filter);
  let totalBCS = 0;
  let totalSucceed = 0;
  let totalData: PropsDatatable[] = [];
  //console.log('dataTable.render:', dataTable.render.length);
  for (let row of dataTable.render) {
    totalData.push(row);
  }
  //console.log('dataTable.noRender:', dataTable.noRender.length);
  for (let row of dataTable.noRender) {
    totalData.push(row);
  }
  console.log('length total Data:', totalData.length);
  totalData = totalData.map(itm => {
    if (filter.column === 'Tất cả' || filter.column === null) {
      itm.show = true;
      //console.log('a');
    } else {
      if (itm.data.MA_GC === filter.column) {
        itm.show = true;
      } else {
        itm.show = false;
      }
    }
    if (itm.show) {
      if (
        filter.isNoRead ||
        filter.isReadFailed ||
        filter.isWriteHand ||
        filter.isAbnormal
      ) {
        itm.show = false;
        for (let i = 0; i < 1; i++) {
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
        }
      } else {
        itm.show = true;
      }
    }

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
    // if(itm.data.SERY_CTO === '20469275')
    // {
    //   console.log('itm.data:', itm.data);
      
    // }
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

  dataTable.render = [];
  dataTable.noRender = totalData;

  dataTable = addMoreItemToRender(dataTable);

  return {
    dataTable: dataTable,
    totalBCS: totalBCS,
    totalSucceed: totalSucceed,
  };
};

export function onStopReadPress() {
  hookProps.setState(state => {
    state.requestStop = true;
    return { ...state };
  });
}

export function onSelectedItemDropdown(column: string) {
  if (hookProps.state.selectedColumn === column) {
    return;
  }
  hookProps.setState(state => {
    state.selectedColumn = column;
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
    const result = funcFilter(state.dataTable, {
      column: state.selectedColumn,
      isNoRead: isNoRead as boolean,
      isAbnormal: isAbnormal as boolean,
      isReadFailed: isReadFailed as boolean,
      isWriteHand: isWriteHand as boolean,
    });
    state.dataTable = result.dataTable;
    state.totalBCS = result.totalBCS.toString();
    state.totalSucceed = result.totalSucceed.toString();
    return { ...state };
  });
}

export function onCheckBoxTypeReadChange(label: string) {
  hookProps.setState(state => {
    state.arrCheckBoxRead = state.arrCheckBoxRead.map(cb => {
      if (cb.label === label) {
        cb.checked = !cb.checked;
      }
      return { ...cb };
    });

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
    const result = funcFilter(state.dataTable, {
      column: state.selectedColumn as string,
      isNoRead: isNoRead as boolean,
      isAbnormal: isAbnormal as boolean,
      isReadFailed: isReadFailed as boolean,
      isWriteHand: isWriteHand as boolean,
    });

    state.dataTable = result.dataTable;
    state.totalBCS = result.totalBCS.toString();
    state.totalSucceed = result.totalSucceed.toString();
    return { ...state };
  });
}

export function onSelectAllPress() {
  hookProps.setState(state => {
    state.selectAll = !state.selectAll;
    for (let _key in state.dataTable) {
      const key = _key as keyof typeof state.dataTable;
      state.dataTable[key] = state.dataTable[key].map(item => {
        // const a = item as PropsDatatable;
        // if (a.stt === '1') {
        //   console.log('item.data.LoaiDoc:', item.data.LoaiDoc);
        // }
        if (
          IsReadRFSucceed(item.data.LoaiDoc as TYPE_READ_RF) ||
          IsWriteByHand(item.data.LoaiDoc as TYPE_READ_RF) 
        ) {
          item.checked = false;
        } else {
          item.checked = state.selectAll;
        }
        return { ...item };
      });
    }

    return { ...state };
  });
}

export function onChangeTextSearch(searchText: string) {
  hookProps.setState(state => {
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
    const result = funcFilter(state.dataTable, {
      column: state.selectedColumn as string,
      isNoRead: isNoRead as boolean,
      isAbnormal: isAbnormal as boolean,
      isReadFailed: isReadFailed as boolean,
      isWriteHand: isWriteHand as boolean,
      searchText: searchText,
    });
    state.dataTable = result.dataTable;
    state.totalBCS = result.totalBCS.toString();
    state.totalSucceed = result.totalSucceed.toString();
    return { ...state };
  });
}

type PropsPencil = {
  data: PropsDatatable;
};

export function onPencilPress(props: PropsPencil) {
  //console.log('navigation:', props.navigation);
  // console.log('navigate');
  
  navigation.navigate('WriteByHand', {
    data: props.data,
  });
}

export async function onTakePicturelPress(props: PropsPencil) {
  //console.log('navigation:', props.navigation);


  if(await requestCameraPermissions() === true){
    await onTakePicturePress(async images => {

      console.log('images[0].fileSize:', niceBytes(images[0].fileSize));

      const base64Image = images[0].base64 ?? '';
      //console.log('newpicturel:', base64Image.substring(base64Image.length - 10 ,base64Image.length));
      
      //showSnack('Đang lưu ảnh ... ');

      const saveOk = await SaveImageToDb(props.data.data, base64Image);
      if(saveOk)
      {
        hookProps.setState(state => {
          let indexRow = state.dataTable.render.findIndex(item => item.id === props.data.id);
          if(indexRow >= 0){

            const row  = {...state.dataTable.render[indexRow]};
            row.data = {...row.data};
            row.data.hasImage = '1';
            state.dataTable.render[indexRow] = row;

            return { ...state };
          }else{
            return state;
          }
          
        });
        
      }
      for(let image of images)
      {
        onDeletePicture(image, () =>{});
      }
    });
  }else{
    console.log('request permision failed');

  }
}

const checkCondition = (): boolean => {
  let hasItem = false;

  for (let item of hookProps.state.dataTable.render) {
    if (item.checked === true && item.show) {
      hasItem = true;
      break;
    }
  }
  if (hasItem === true) {
    return true;
  } else {
    return false;
  }
};

type PropsDataInsertDb = {
  power: string;
  datePower?: string;
  pmax?: string;
  datePmax?: string;
};

type PropsInsertDB = {
  [K in PropsExtraLabelPower]: PropsDataInsertDb;
};

const _getDataToDbByTitle = (
  valueInsertDb: PropsInsertDB,
  apsResponse: PropsResponse,
  objPower: { [K in PropsLabelPower]?: string | undefined },
  labelPower: PropsLabelPower,
  titleExtraPower: PropsExtraLabelPower,
) => {
  const labelPmax = POWER_DEFINE[labelPower].titlePmax;
  let valuePmax: string | undefined;
  let datePmax: string | undefined;
  if (labelPmax) {
    const objPmax = apsResponse.obj.MaxDemand?.find(item => {
      for (let name in item) {
        if (name === labelPmax) {
          return true;
        }
      }
      return false;
    });
    if (objPmax) {
      valuePmax = objPmax[labelPmax];
      datePmax = objPmax['Thời điểm'];
    } else {
      valuePmax = undefined;
      datePmax = undefined;
    }
  }

  const data = {
    power: objPower[labelPower],
    datePower: apsResponse.obj['Ngày chốt'],
  } as PropsDataInsertDb;
  if (apsResponse.obj['Ngày chốt']) {
    data.datePower = apsResponse.obj['Ngày chốt'];
  }
  if (valuePmax && datePmax) {
    data.pmax = valuePmax;
    data.datePmax = datePmax;
  }
  valueInsertDb[titleExtraPower] = data;
};

export const convertApsResponse2PropsInsertDb = (
  apsResponse: PropsResponse,
): PropsInsertDB => {
  let valueInsertDb = {} as PropsInsertDB;

  for (let power of apsResponse.obj.Power ?? []) {
    for (let _label in power) {
      const label = _label as keyof typeof power;
      const extraTitle = POWER_DEFINE[label].extraTitle;
      if (typeof extraTitle === 'object') {
        if (Array.isArray(extraTitle) === true) {
          for (let _title of extraTitle) {
            _getDataToDbByTitle(
              valueInsertDb,
              apsResponse,
              power,
              label as PropsLabelPower,
              _title,
            );
          }
        }
      } else {
        _getDataToDbByTitle(
          valueInsertDb,
          apsResponse,
          power,
          label as PropsLabelPower,
          extraTitle,
        );
      }
    }
  }

  return valueInsertDb;
};

const readData = async () => {
  let numRetries = Number(store?.state.appSetting.numRetriesRead);

  if (numRetries <= 0) {
    numRetries = 1;
  }

  console.log('numRetries:', numRetries);

  const isGetOnlyInterGer = store.state.appSetting.hhu.isOnlyGetIntegers === true ? true : false;


  for (
    let index = 0;
    index < hookProps.state.dataTable.render.length;
    index++
  ) {
    const item = hookProps.state.dataTable.render[index];
    if (item.checked === true && item.show === true) {
      if (hookProps.state.requestStop === true) {
        break;
      } else {
        await sleep(150);
      }
      let strSeri: string = item.data.SERY_CTO;
      const labelMeter = getLabelAndIsManyPriceByCodeMeter(
        item.data.MA_CTO,
        item.data.SERY_CTO);
      try {
        for (let j = 0; j < 1; j++) {
          
          let codeMeterInDb = item.data.MA_CTO;
          let strRFCode: string = item.data.RF;

          let iDate: Date = selectBookCodeHook.state.dateLatch; //new Date();
          console.log('strSeri:', strSeri);
          setStatus('Đang đọc ' + strSeri + ' ...');
          let result : PropsResponse = {
            bSucceed: false,
            strMessage: '',
            obj: {}
          }; 
          if(labelMeter.label !== 'not GELEX')
          {
            result = await apsReadRfGCS({
              seri: strSeri,
              codeMeterInDB: codeMeterInDb,
              is0h: selectBookCodeHook.state.is0h,
              dateLatch: iDate,
              rfCode: strRFCode,
              numRetries: numRetries,
              setStatus: setStatus,
              hasRequestPmax: selectBookCodeHook.state.hasPmax,
            });
          }else{
            if(store.state.appSetting.hhu.enableReadNotGelex === true)
            {
              result = await ReadApsGcsHHM({
                seri: strSeri,
              });
            }else{
              showAlert('Tính năng đọc nhà khác chưa được bật. Vào phần Cài đặt để bật tính năng này');
              result.bSucceed = false;
              result.strMessage = 'Tính năng đọc nhà khác chưa được bật';
            }
            
          }
          
          console.log(TAG, 'result:', JSON.stringify(result));
          if (result.bSucceed === false) {
            if (store?.state.hhu.connect !== 'CONNECTED') {
              return;
            }
          }

          if (result.bSucceed === true) {
            const dataConverted = convertApsResponse2PropsInsertDb(result);

            // find all element arr of this seri
            const listUpdate: PropsUpdateDb[] = [];
            let totalUpdateFailed: number = 0;

            // only get curent dât, no need updae hook
            hookProps.setState(state => {
              for (let _key in state.dataTable) {
                const key = _key as keyof typeof state.dataTable;
                state.dataTable[key] = state.dataTable[key].map(itm => {
                  if (itm.data.SERY_CTO === strSeri) {
                    // get BCS, rfcode
                    const strBCS = itm.data.LOAI_BCS as keyof typeof dataConverted;
                    const RfcodeNow = itm.data.RF as string;
                    if (dataConverted[strBCS]) {
                      const newCapacity =
                        Number(dataConverted[strBCS].power) -
                        Number(itm.data.CS_CU);

                      listUpdate.push({
                        seri: strSeri,
                        BCSCMIS: strBCS,
                        date: dataConverted[strBCS].datePower ?? iDate,
                        RfCode: RfcodeNow,
                        T0: dataConverted[strBCS].power,
                        newCapacity: newCapacity,
                        oldCapacity: Number(itm.data.SL_CU),
                        Pmax: dataConverted[strBCS].pmax,
                        datePmax: dataConverted[strBCS].datePmax,
                      });
                    }
                  }
                  return itm;
                });
              }

              return state;
            });

            let bcsReadSucced = '';
            let statusWriteFailed = '';
            for (let itemUpdate of listUpdate) {
              bcsReadSucced += ' ' + itemUpdate.BCSCMIS + ',';
              let objUpdateDb = await updateDataToDB(itemUpdate);
              if (objUpdateDb.bSucceed) {
                itemUpdate.updateSucced = true;
              } else if(objUpdateDb.bIsCancelled === false) {
                totalUpdateFailed++;
                itemUpdate.updateSucced = false;
                statusWriteFailed += ' ' + itemUpdate.BCSCMIS + ',';
              }
            }

            let status =
              'Đọc thành công ' +
              listUpdate.length +
              ' chỉ mục: ' +
              bcsReadSucced +
              ' của seri: ' +
              strSeri;

            if (totalUpdateFailed > 0) {
              status +=
                ' Ghi Lỗi ' +
                totalUpdateFailed +
                ':' +
                statusWriteFailed +
                ' của seri: ' +
                strSeri;
            }
            // let node = null;
            hookProps.setState(state => {
              state.status = status;
              for (let _key in state.dataTable) {
                const key = _key as keyof typeof state.dataTable;
                for (let itemUpdate of listUpdate) {
                  const indexCurRow = state.dataTable[key].findIndex(
                    itm =>
                      itm.data.SERY_CTO === strSeri &&
                      itm.data.LOAI_BCS === itemUpdate.BCSCMIS &&
                      itm.data.RF === itemUpdate.RfCode,
                  );
                  //console.log('indexrow:', indexCurRow);
                  if (indexCurRow !== -1) {
                    state.dataTable[key][indexCurRow] = {
                      ...state.dataTable[key][indexCurRow],
                    };
                    state.dataTable[key][indexCurRow].data = {
                      ...state.dataTable[key][indexCurRow].data,
                    };
                    state.dataTable[key][indexCurRow].checked = false;
                    if (itemUpdate.isAbnormal !== true) {
                      state.dataTable[key][indexCurRow].data.LoaiDoc =
                        TYPE_READ_RF.READ_SUCCEED;
                    } else {
                      state.dataTable[key][indexCurRow].data.LoaiDoc =
                        itemUpdate.typeReadRFWhenAbnormal ?? TYPE_READ_RF.ABNORMAL_CAPACITY;
                    }
                    if (
                      itemUpdate.isAbnormal !== true ||
                      (itemUpdate.isAbnormal &&
                        itemUpdate.stillSaveWhenAbnormal)
                    ) {

                      if(isGetOnlyInterGer)
                      {
                        state.dataTable[key][indexCurRow].data.CS_MOI =  Math.floor(Number(
                          itemUpdate.T0,
                        ));
                      }else{
                        state.dataTable[key][indexCurRow].data.CS_MOI = Number(
                          itemUpdate.T0,
                        );
                      }
                      
                      state.dataTable[key][indexCurRow].data.NGAY_MOI =
                        formatDateTimeDB(itemUpdate.date);
                      if (itemUpdate.Pmax) {
                        
                        if(isGetOnlyInterGer)
                        {
                          state.dataTable[key][indexCurRow].data.PMAX = Math.floor(Number(
                            itemUpdate.Pmax,
                          ));
                        }else{
                          state.dataTable[key][indexCurRow].data.PMAX = Number(
                            itemUpdate.Pmax,
                          );
                        }
                      }
                      
                      if (itemUpdate.datePmax) {
                        state.dataTable[key][indexCurRow].data.NGAY_PMAX =
                          itemUpdate.datePmax;
                      }
                      if (itemUpdate.ghiChu) {
                        state.dataTable[key][indexCurRow].data.GhiChu =
                          itemUpdate.ghiChu;
                      }
                    }
                    // node = state.dataTable[key][indexCurRow];
                  }
                }
              }
              let totalSucceed = 0;
              let totalBCS = 0;
              for (let _key in state.dataTable) {
                const key = _key as keyof typeof state.dataTable;
                for (let itm of state.dataTable[key]) {
                  totalBCS++;
                  if (
                    IsReadRFSucceed(item.data.LoaiDoc as TYPE_READ_RF) ||
                    IsWriteByHand(item.data.LoaiDoc as TYPE_READ_RF) 
                  ) {
                    totalSucceed++;
                  }
                }
              }
              state.totalSucceed = totalSucceed.toString();
              state.totalBCS = totalBCS.toString();

              return { ...state };
            });

            // if (node) {
            //   refScroll.current?.scrollResponderScrollTo({
            //     x: 0,
            //     y: findNodeHandle(node),
            //     animated: true,
            //   });
            // }

            //}
            index = -1; // reset index -1 ++ = 0
            break;
          } else {
            if (store?.state.hhu.connect !== 'CONNECTED') {
              return;
            }
            hookProps.setState(state => {
              state.status =
                'Đọc thất bại seri ' + strSeri + ': ' + result.strMessage;
              for (let _key in state.dataTable) {
                const key = _key as keyof typeof state.dataTable;
                state.dataTable[key] = state.dataTable[key].map(itm => {
                  if (itm.data.SERY_CTO === strSeri) {
                    itm = { ...itm };
                    itm.data = { ...itm.data };
                    itm.checked = false;
                    itm.data.LoaiDoc =
                      itm.data.LoaiDoc === TYPE_READ_RF.HAVE_NOT_READ
                        ? TYPE_READ_RF.READ_FAILED
                        : itm.data.LoaiDoc;
                  }
                  return itm;
                });
              }

              return { ...state };
            });
            let writeFailed = await updateReadFailToDb(strSeri);
            if (writeFailed !== true) {
              console.log('Update Read failed to DB is Failed');
            }
          }
        }
      } catch (err :any) {
        console.log(TAG, err.message);
        setStatus(err.message);
        return;
      }
    }
  }
};

export const onBtnReadPress = async () => {
  if (checkCondition() === false) {
    setStatus('Chưa có item nào được chọn');
    return;
  }

  //console.warn('test here 3');
  if (store?.state.hhu.connect !== 'CONNECTED') {
    hookProps.setState(state => {
      state.status = 'Chưa kết nối bluetooth';
      return { ...state };
    });
    Vibration.vibrate([20, 30, 20]);
    return;
  }

  hookProps.setState(state => {
    state.isReading = true;
    state.requestStop = false;
    //state.status = 'Đang đọc ...';
    return { ...state };
  });

  //await BleFunc_StartNotification(ObjSend.id);

  try {
    await readData();
  } catch (err :any) {
    console.log(TAG, err.message);
  }

  hookProps.setState(state => {
    state.isReading = false;
    state.selectAll = false;
    if (state.status.includes('Đang đọc') === true) {
      state.status = '';
    }
    return { ...state };
  });
  //await BleFunc_StopNotification(ObjSend.id);
};

export const onBtnStopPress = () => {
  hookProps.setState(state => {
    state.requestStop = true;
    return { ...state };
  });
};

export type PropsUpdateDb = {
  seri: string;
  BCSCMIS: string;
  RfCode: string;
  T0: string;
  date: Date;
  oldCapacity: number;
  newCapacity: number;
  Pmax?: string;
  datePmax?: string;
  isWriteHand?: boolean;
  ghiChu?: string;
  updateSucced?: boolean;
  isAbnormal?: boolean;
  stillSaveWhenAbnormal?: boolean;
  typeReadRFWhenAbnormal?: TYPE_READ_RF;
};
export const updateReadFailToDb = async (seri: string): Promise<boolean> => {
  const valuesSet = {};

  const condition: PropsCondition = {
    data: {},
    logic: '=',
    operator: 'AND',
  };

  // @ts-expect-error
  condition.data[dataDBTabel.SERY_CTO.id as string] = seri;
  // @ts-expect-error
  condition.data[dataDBTabel.LoaiDoc.id as string] = TYPE_READ_RF.HAVE_NOT_READ;
 // @ts-expect-error
  valuesSet[dataDBTabel.LoaiDoc.id as string] = TYPE_READ_RF.READ_FAILED;

  for (let i = 0; i < 1; i++) {
    const updateSucceed = await CMISKHServices.update(condition, valuesSet);
    if (updateSucceed) {
      console.log('update table succeed');
      return true;
    } else {
      //console.log('update table failed');
    }
  }

  return false;
};

export type PropsResponseUpdateDataToDB = {
  bSucceed: boolean;
  bIsCancelled: boolean;
};

export const updateDataToDB = async (
  props: PropsUpdateDb,
): Promise<PropsResponseUpdateDataToDB> => {

  const retAll : PropsResponseUpdateDataToDB = {
    bSucceed: false,
    bIsCancelled: false
  };
  const valuesSet = {};

  const condition: PropsCondition = {
    data: {},
    logic: '=',
    operator: 'AND',
  };

  //console.log('props:', props);

  let percent: number = 0;

  let isAbnormal: boolean = false;
  let statusAbnormal = '';
  let typeReadRFWhenAbnormal : TYPE_READ_RF = TYPE_READ_RF.ABNORMAL_CAPACITY;

  const upperThresholdValue = Number(store.state.appSetting.setting.upperThresholdValue);
  const lowerThresholdValue = Number(store.state.appSetting.setting.lowerThresholdValue);

  const upperPercent = Number(store?.state.appSetting.setting.upperThresholdPercent);
  const lowerPercent = Number(store?.state.appSetting.setting.lowerThresholdPercent);

  const newCapacity = props.newCapacity;

  if (true) { // props.isWriteHand !== true
    //console.log('à âfa fà');

    if(newCapacity < 0 )
    {

      if(props.isWriteHand)
      {
        typeReadRFWhenAbnormal = TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE;
      }else{
        typeReadRFWhenAbnormal = TYPE_READ_RF.ABNORMAL_NEGATIVE;
      }
      

      isAbnormal = true;
      statusAbnormal = `
      Seri: ${props.seri}
      Bộ chỉ số: ${props.BCSCMIS}
      Chỉ số hiện tại: ${props.T0} kWh
      Sản lượng thực tế: ${newCapacity.toFixed(2)}
      Sản lượng bất thường (âm)`;

    } else if (store?.state.appSetting.setting.typeAlarm === 'Value') {
      //console.log('a');
      if (
        newCapacity >= upperThresholdValue ||
        newCapacity <= lowerThresholdValue
      ) {

        if(props.isWriteHand)
        {
          if(newCapacity >= upperThresholdValue)
          {
            typeReadRFWhenAbnormal = TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER;
          }else{
            typeReadRFWhenAbnormal = TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER;
          }
        }else{
          if(newCapacity >= upperThresholdValue)
          {
            typeReadRFWhenAbnormal = TYPE_READ_RF.ABNORMAL_UPPER;
          }else{
            typeReadRFWhenAbnormal = TYPE_READ_RF.ABNORMAL_LOWER;
          }
        }

        isAbnormal = true;
        statusAbnormal = `
        Seri: ${props.seri}
        Bộ chỉ số: ${props.BCSCMIS}
        Chỉ số hiện tại: ${props.T0} kWh
        Ngưỡng trên: ${upperThresholdValue} kWh
        Ngưỡng dưới: ${lowerThresholdValue} kWh
        Sản lượng thực tế: ${newCapacity.toFixed(2)}`;
      }
    } else {
      
      percent = (newCapacity / props.oldCapacity) * 100;

      // console.log('percent:', percent);
      // console.log('upperPercent:', upperPercent);
      // console.log('lowerPercent:', lowerPercent);
      if (
        percent >= upperPercent ||
        percent <= lowerPercent
      ) {

        if(props.isWriteHand)
        {
          if(percent >= upperPercent)
          {
           // console.log('a:');
            typeReadRFWhenAbnormal = TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER;
          }else{
            //console.log('b:');
            typeReadRFWhenAbnormal = TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER;
          }
        }else{
          if(percent >= lowerPercent)
          {
            typeReadRFWhenAbnormal = TYPE_READ_RF.ABNORMAL_UPPER;
          }else{
            typeReadRFWhenAbnormal = TYPE_READ_RF.ABNORMAL_LOWER;
          }
        }
       
        isAbnormal = true;
        statusAbnormal = `
        Seri: ${props.seri}
        Bộ chỉ số: ${props.BCSCMIS}
        Chỉ số hiện tại: ${props.T0} kWh
        Sản lượng mới: ${newCapacity.toFixed(2)} kWh
        Sản lượng cũ: ${props.oldCapacity.toFixed(2)} kWh
        Ngưỡng trên: ${store?.state.appSetting.setting.upperThresholdPercent}%
        Ngưỡng dưới: ${store?.state.appSetting.setting.lowerThresholdPercent}%
        Ngưỡng thực tế: ${
          props.oldCapacity === 0
            ? '>' + store?.state.appSetting.setting.upperThresholdPercent
            : percent.toFixed(0)
        }%`;
      }
    }
    console.log('isAbnormal:', isAbnormal);
    // if (isAbnormal === false) {
    //   if (newCapacity < 0) {
    //     isAbnormal = true;
    //     statusAbnormal = `
    //     Seri: ${props.seri}
    //     Bộ chỉ số: ${props.BCSCMIS}
    //     Chỉ số hiện tại: ${props.T0} kWh
    //     Sản lượng mới: ${newCapacity.toFixed(2)} kWh
    //     Sản lượng bất thường (âm)`;
    //   }
    // }
    
    
  }

  console.log('isAbnormal 1dsds:',isAbnormal);

  let stillSave: boolean = false;
  if (isAbnormal === true) {
    if (props.Pmax && props.datePmax) {
      statusAbnormal += `
        Pmax: ${props.Pmax} kW
        Ngày Pmax: ${props.datePmax}
      `;
    }
    stillSave = await new Promise(resolve => {
      //console.log('variable sub:', JSON.stringify(variable.modalAlert));

      store?.setState(state => {
        state.modal.modalAlert.title = 'Dữ liệu bất thường';
        state.modal.modalAlert.content = statusAbnormal;
        state.modal.modalAlert.onDissmiss = () => resolve(false);
        state.modal.modalAlert.onOKPress = () => resolve(true);

        state.modal.showWriteRegister = true;

        return { ...state };
      });
    });

    props.stillSaveWhenAbnormal = stillSave;

    
  }

  console.log('isAbnormal:', isAbnormal);
  console.log('stillSave:', stillSave);

  //isAbnormal = false;

  // @ts-expect-error
  condition.data[dataDBTabel.SERY_CTO.id as string] = props.seri;
  // @ts-expect-error
  condition.data[dataDBTabel.LOAI_BCS.id as string] = props.BCSCMIS;
  // @ts-expect-error
  condition.data[dataDBTabel.RF.id as string] = props.RfCode;

  if (isAbnormal) {
    // @ts-expect-error
    valuesSet[dataDBTabel.LoaiDoc.id as string] =
      typeReadRFWhenAbnormal;


  } else {
    // const strDate =
    //   props.date.toLocaleDateString('vi').split('/').join('-') +
    //   ' ' +
    //   props.date.toLocaleTimeString('vi');

    if (props.isWriteHand === true) {
      // @ts-expect-error
      valuesSet[dataDBTabel.LoaiDoc.id as string] = TYPE_READ_RF.WRITE_BY_HAND;
    } else {
      // @ts-expect-error
      valuesSet[dataDBTabel.LoaiDoc.id as string] = TYPE_READ_RF.READ_SUCCEED;
    }

    //console.log('valuesSet:', valuesSet);
  }

  if (isAbnormal !== true || (isAbnormal === true && stillSave === true)) {
   
    const strDate = formatDateTimeDB(props.date);
    // console.log('aab:',props.date.toLocaleString('vi'));
    // console.log('aac:',strDate);
    // @ts-expect-error
    valuesSet[dataDBTabel.CS_MOI.id as string] = props.T0; // @ts-expect-error
    valuesSet[dataDBTabel.SL_MOI.id as string] = newCapacity.toFixed(3); // @ts-expect-error
    valuesSet[dataDBTabel.NGAY_MOI.id as string] = strDate;
    if (props.Pmax && props.datePmax) {
      // @ts-expect-error
      valuesSet[dataDBTabel.PMAX.id as string] = props.Pmax;// @ts-expect-error
      valuesSet[dataDBTabel.NGAY_PMAX.id as string] = props.datePmax;
    }
    if (props.ghiChu) {
      // @ts-expect-error
      valuesSet[dataDBTabel.GhiChu.id as string] = props.ghiChu;
    }
    const ret = await GetCurrentPosition();

    console.log('ret position:', ret);
    

    // @ts-expect-error
    valuesSet[dataDBTabel.X.id as string] = ret.latitude;
    // @ts-expect-error
    valuesSet[dataDBTabel.Y.id as string] = ret.logtitude;
    try{
      const messageLog = JSON.stringify(condition.data) + ',' + JSON.stringify(valuesSet);
      WriteLog('GCS:' + (props.isWriteHand ? 'by hand' : 'RF'), messageLog);
    }
    catch(err: any){
      console.log(TAG, 'err:', err.message);
    }
    // @ts-expect-error
    valuesSet[dataDBTabel.latitude.id as string] = ret.latitude;
    // @ts-expect-error
    valuesSet[dataDBTabel.longtitude.id as string] = ret.logtitude;
    
    
    // @ts-expect-error
    valuesSet[dataDBTabel.isSent.id as string] = '0';

    props.isAbnormal = isAbnormal;
    props.typeReadRFWhenAbnormal = typeReadRFWhenAbnormal;

    for (let i = 0; i < 3; i++) {
      const updateSucceed = await CMISKHServices.update(condition, valuesSet);
      if (updateSucceed) {
        console.log('update table succeed');
        retAll.bSucceed = true;
        return retAll;
      } else {
        console.log('update table failed');
      }
    }
  }else if(isAbnormal === true && stillSave === false)
  {
    retAll.bIsCancelled = true;
  }
  return retAll;
};

export async function getGeolocation(): Promise<GeolocationResponse | null> {
  const rest = await new Promise<GeolocationResponse | null>(resolve => {
    Geolocation.getCurrentPosition(
      value => {
        resolve(value);
      },
      err => {
        console.log('err:', err);
        //showAlert(err.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 3600000,
      },
    );
  });
  console.log('accuracy:', rest?.coords.accuracy);

  return rest;
}

export async function GetCurrentPosition(): Promise<{
  latitude: string;
  logtitude: string;
}> {
  // const rest = await onSearchInfo();

  // console.log('rest:', rest);
  
  let location: GeolocationResponse | null = null;
  for (let i = 0; i < 5; i++) {
    location = await getGeolocation();
    if (location === null ) {//|| location.coords.accuracy > 30
      continue;
    } else {
      if (location?.coords.longitude && location?.coords.latitude) {
        return {
          latitude: location?.coords.latitude.toString() ?? '',
          logtitude: location?.coords.longitude.toString() ?? '',
        };
      }

      break;
    }
  }
  return {
    latitude: '',
    logtitude: '',
  };
}


export async function testUpdateDataToDB(){


  
  const oldIndex = 11139;
  const newIndex = oldIndex + 200;

  let updateDbSucceess = await updateDataToDB({
    seri: '1811109197',
    BCSCMIS: 'KT',
    date: new Date(),
    newCapacity: newIndex - oldIndex,
    oldCapacity: 0,
    T0: newIndex.toString(),
    RfCode: '3',
    Pmax: '65',
    datePmax: '2023-10-12T12:00:09',

  });

  if(updateDbSucceess)
  {
    console.log('update data test to db succeed');
    
  }else{
    console.log('update data test to db failed');
  }
}
export async function testUpdateDataToDBDLHN(){

  
  const oldIndex = 24483;
  const newIndex = oldIndex + 300;

  // let updateDbSucceess = await updateDataToDB({
  //   seri: '20909987',
  //   BCSCMIS: 'KT',
  //   date: new Date(),
  //   newCapacity: 831,
  //   oldCapacity: 0,
  //   T0: newIndex.toString(),
  //   RfCode: '3',
  //   Pmax: '200',
  //   datePmax: '2023-09-02T12:00:09',

  // });


  const dataPush : PropsUpdateDb = {
    seri: '20433791',
    BCSCMIS: 'SG',
    date: new Date(),
    newCapacity: newIndex - oldIndex,
    oldCapacity: oldIndex,
    T0: newIndex.toFixed(0),
    RfCode: '3',
    Pmax: '200',
    datePmax: '2023-09-02T12:00:09',

  };

  let updateDbSucceess = await updateDataToDB(dataPush);

  if(updateDbSucceess)
  {
    console.log('update data test to db succeed');
    console.log('dataPush:', dataPush);
    
  }else{
    console.log('update data test to db failed');
  }
}
export async function testUpdateDataToDBDLHNCMIS(){

  const newIndex = 21240 + 300;
  const oldIndex = 21240;

  // let updateDbSucceess = await updateDataToDB({
  //   seri: '20909987',
  //   BCSCMIS: 'KT',
  //   date: new Date(),
  //   newCapacity: 831,
  //   oldCapacity: 0,
  //   T0: newIndex.toString(),
  //   RfCode: '3',
  //   Pmax: '200',
  //   datePmax: '2023-09-02T12:00:09',

  // });


  const dataPush : PropsUpdateDb = {
    seri: '2210179392',
    BCSCMIS: 'BT',
    date: new Date(),
    newCapacity: newIndex - oldIndex,
    oldCapacity: oldIndex,
    T0: newIndex.toFixed(0),
    RfCode: '3',
    Pmax: '200',
    datePmax: '2023-09-02T12:00:09',

  };

  let updateDbSucceess = await updateDataToDB(dataPush);

  if(updateDbSucceess)
  {
    console.log('update data test to db succeed');
    console.log('dataPush:', dataPush);
    
  }else{
    console.log('update data test to db failed');
  }
}