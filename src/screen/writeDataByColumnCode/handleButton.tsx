import { Vibration } from 'react-native';
import { apsReadRfGCS } from '../../service/hhu/aps/hhuApsGCS';
import { formatDateTimeDB } from '../../service/hhu/aps/util';
import { IsAbnormal, IsReadRFSucceed, IsWriteByHand, TYPE_READ_RF, getLabelAndIsManyPriceByCodeMeter } from '../../service/hhu/defineEM';
import { niceBytes, showAlert, showSnack, sleep } from '../../util';
import { hookProps as selectColumnCodeHook } from '../selectColumnCode/controller';
import {
  convertApsResponse2PropsInsertDb,
  PropsUpdateDb,
  updateDataToDB,
  updateReadFailToDb,
} from '../writeDataByBookCode/handleButton';
import {
  addMoreItemToRender,
  hookProps,
  navigation,
  PropsDatatable,
  PropsTable,
} from './controller';
import { store } from '../../component/drawer/drawerContent/controller';
import { onDeletePicture, onTakePicturePress } from '../../component/getPicture/handle';
import { SaveImageToDb } from '../writeDataByHand/handleButton';
import { requestCameraPermissions } from '../../service/permission';
import { PropsResponse } from '../../service/hhu/aps/hhuAps';
import { ReadApsGcsHHM } from '../../service/hhu/otherNsx/huu_hong/hhuApsGcsHHM';

const TAG = 'Handle Btn Write Data By Column Code';

const setStatus = (value: string) => {
  hookProps.setState(state => {
    state.status = value;
    return { ...state };
  });
};

export function onSelectAllPress() {
  hookProps.setState(state => {
    state.selectAll = !state.selectAll;
    for (let _key in state.dataTable) {
      const key = _key as keyof typeof state.dataTable;
      state.dataTable[key] = state.dataTable[key].map(item => {
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

export function onItemPress(item: PropsDatatable) {
  hookProps.setState(state => {
    for (let _key in state.dataTable) {
      let stateChecked : boolean | null = null;
      const key = _key as keyof typeof state.dataTable;
      state.dataTable[key] = state.dataTable[key].map(itm => {
        if (itm.data.SERY_CTO === item.data.SERY_CTO) {
          if (
            IsReadRFSucceed(item.data.LoaiDoc as TYPE_READ_RF) //||
            //IsWriteByHand(item.LoaiDoc as TYPE_READ_RF) 
            //item.data.LoaiDoc === TYPE_READ_RF.READ_SUCCEED ||
            //item.data.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND
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

const funcFilter = (
  dataTable: PropsTable,
  filter: PropsFilter,
): { dataTable: PropsTable; totalBCS: number; totalSucceed: number } => {
  console.log('filter', filter);
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
  totalData = totalData.map(itm => {
    if (filter.column === 'Tất cả' || filter.column === null) {
      itm.show = true;
      //console.log('a');
    } else {
      if (itm.data.MA_COT === filter.column) {
        itm.show = true;
      } else {
        itm.show = false;
      }
    }
    if (itm.show === true) {
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
    if (itm.show === true) {
      totalBCS++;
      if (
        IsReadRFSucceed(itm.data.LoaiDoc as TYPE_READ_RF) ||
        IsWriteByHand(itm.data.LoaiDoc as TYPE_READ_RF) 
      ) {
        totalSucceed++;
      }
    }
    return { ...itm };
  });

  dataTable.render = [];
  dataTable.noRender = totalData;

  dataTable = addMoreItemToRender(dataTable);

  //console.log('dataTable.render.length:', dataTable.render[0].show);

  return {
    dataTable: dataTable,
    totalBCS: totalBCS,
    totalSucceed: totalSucceed,
  };
};

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
    //console.log('dataTable.render.length:', result.dataTable.render[0].show);
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
  navigation.navigate('WriteByHand', {
    data: props.data,
  });
}

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
      const labelMeter = getLabelAndIsManyPriceByCodeMeter(
        item.data.MA_CTO,
        item.data.SERY_CTO);
      try {
        for (let j = 0; j < 1; j++) {
          let strSeri: string = item.data.SERY_CTO;
          let codeMeterInDb = item.data.MA_CTO;
          let strRFCode: string = item.data.RF;

          let iDate: Date = selectColumnCodeHook.state.dateLatch; //new Date();
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
              is0h: selectColumnCodeHook.state.is0h,
              dateLatch: iDate,
              rfCode: strRFCode,
              numRetries: numRetries,
              setStatus: setStatus,
              hasRequestPmax: selectColumnCodeHook.state.hasPmax,
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
                        state.dataTable[key][indexCurRow].data.CS_MOI = Math.floor(Number(
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
              for (let key in state.dataTable) {
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

export const onBtnReadPress = async () => {
  if (checkCondition() === false) {
    setStatus('Chưa có item nào được chọn');
    return;
  }
  if (store?.state.hhu.connect !== 'CONNECTED') {
    hookProps.setState(state => {
      state.status = 'Chưa kết nối bluetooth';
      return { ...state };
    });
    Vibration.vibrate([100, 200, 100]);
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

export function onStopReadPress() {
  hookProps.setState(state => {
    state.requestStop = true;
    return { ...state };
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

