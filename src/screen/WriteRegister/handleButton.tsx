// import { Alert, Keyboard, Vibration } from 'react-native';
// import {
//   getTypeOfColumn,
//   KHCMISClomunsInfo,
//   KHCMISModelFields,
//   PropsKHCMISModel,
// } from '../../database/model';
// import { PropsCondition } from '../../database/repository';
// import { CMISKHServices } from '../../database/service';
// import {
//   PropsExtraLabelPower,
//   PropsLabelPower,
//   PropsResponse,
// } from '../../service/hhu/aps/hhuAps';
// import { apsReadRfGCS } from '../../service/hhu/aps/hhuApsGCS';
// import { formatDateTimeDB } from '../../service/hhu/aps/util';
// import {
//   getRFCodeBySeriAndStockRFCode,
//   POWER_DEFINE,
//   TYPE_READ_RF,
// } from '../../service/hhu/defineEM';
// import { isNumeric, showToast, sleep } from '../../util/util';
// import * as controller from './controller';
// import {
//   getIndexOfHeader,
//   hookProps,
//   indexHeader,
//   itemPerPages,
//   store,
//   updateDataToTable,
// } from './controller';

// const TAG = 'handleButtonWriteRegister';

// let bStateCheckAll: boolean = false;

// export const onRefreshPress = async () => {
//   hookProps.setState(state => {
//     state.status = 'Làm mới dữ liệu ...';
//     state.dropdown.value = null;
//     state.dropdown.open = false;
//     state.dropdown.subDropdown.value = null;
//     state.dropdown.subDropdown.open = false;
//     state.isLoadingTable = true;

//     //console.log('rows:', rows);
//     return { ...state };
//   });
//   await updateDataToTable();
//   hookProps.setState(state => {
//     //state.status = 'Làm mới dữ liệu thành công';
//     state.isLoadingTable = false;
//     //console.log('rows:', rows);
//     return { ...state };
//   });
// };

// const setStatus = (message: string) => {
//   hookProps.setState(state => {
//     state.status = message;
//     //console.log('rows:', rows);
//     return { ...state };
//   });
// };

// export const onSearchPress = async (showAlert = true): Promise<boolean> => {
//   Keyboard.dismiss();
//   if (!hookProps.state.dropdown.value) {
//     if (showAlert) {
//       setStatus('Bạn cần chọn cột muốn tìm kiếm');
//     }
//     return false;
//   }
//   const valueSearch = hookProps.state.searchText.trim();
//   const type = getTypeOfColumn(hookProps.state.dropdown.value);
//   if (type === 'string') {
//     // if (valueSearch.length === 0) {
//     //   controller.updateDataToTable();
//     //   showToast('Cập nhật mới DB ...');
//     //   return;
//     // }
//     if (showAlert === false) {
//       if (valueSearch.length === 0) {
//         return false;
//       }
//     }
//   } else if (type === 'number') {
//     if (isNumeric(hookProps.state.searchStart) === false) {
//       if (showAlert) {
//         setStatus('Ngưỡng bắt đầu không hợp lệ');
//       }
//       return false;
//     }
//   } else {
//     if (showAlert) {
//       setStatus('Kiểu dữ liệu cột chưa cho phép');
//     }
//     return false;
//   }

//   hookProps.setState(state => {
//     state.status = 'Đang tìm ...';
//     //console.log('rows:', rows);
//     return { ...state };
//   });
//   let rows: any[] = [];
//   // const pagination: PropsPagination = {
//   //   page: hookProps.state.page,
//   //   itemPerPage: itemPerPages,
//   // };

//   let items: PropsKHCMISModel[];

//   if (
//     hookProps.state.dropdown.value ===
//       KHCMISClomunsInfo.infoColumn.MA_QUYEN.id ||
//     hookProps.state.dropdown.value === KHCMISClomunsInfo.infoColumn.MA_COT.id ||
//     hookProps.state.dropdown.value === KHCMISClomunsInfo.infoColumn.MA_TRAM.id
//   ) {
//     const condition: PropsCondition = {
//       data: {},
//       logic: '=',
//       operator: '',
//     };

//     condition.data[hookProps.state.dropdown.value as string] = valueSearch;
//     items = await CMISKHServices.findAll(undefined, condition);
//   } else {
//     items = await CMISKHServices.findByColumn({
//       idColumn: hookProps.state.dropdown.value,
//       valueString: hookProps.state.searchText,
//       startNumber: hookProps.state.searchStart,
//       endNumber: hookProps.state.searchEnd,
//     });
//   }

//   for (let i = 0; i < items.length; i++) {
//     const row: any[] = [];
//     for (let j = 0; j < KHCMISModelFields.length; j++) {
//       const label = KHCMISModelFields[j];
//       const value = items[i][label];
//       row.push(value);
//     }
//     rows.push(row);
//   }

//   let rowsItem = controller.setRowTables(rows);

//   const indexTypeRF = getIndexOfHeader(
//     KHCMISClomunsInfo.infoColumn.LoaiDoc.title,
//   );

//   let filter = false;
//   if (store?.state.appSetting.showResultOKInWriteData === true) {
//     filter = false;
//   } else {
//     filter = true;
//   }

//   if (filter === true) {
//     rowsItem = rowsItem.filter(itm => {
//       if (
//         itm.data[indexTypeRF] !== TYPE_READ_RF.READ_SUCCEED &&
//         itm.data[indexTypeRF] !== TYPE_READ_RF.WRITE_BY_HAND
//       ) {
//         //console.log('itm:', itm);
//         return true;
//       } else {
//         return false;
//       }
//     });
//   }

//   hookProps.setState(state => {
//     state.KHCMISs = rowsItem;
//     state.page = 0;
//     state.totalPage = Math.ceil(rowsItem.length / itemPerPages);
//     state.status = 'Tìm thấy ' + rowsItem.length + ' kết quả';
//     //console.log('rows:', rows);
//     return { ...state };
//   });

//   return true;
// };

// const checkCondition = (): boolean => {
//   let hasItem = false;

//   for (let item of hookProps.state.KHCMISs) {
//     if (item.checked === true) {
//       hasItem = true;
//       break;
//     }
//   }
//   if (hasItem === true) {
//     return true;
//   } else {
//     return false;
//   }
// };

// type PropsDataInsertDb = {
//   power: string;
//   datePower?: string;
//   pmax?: string;
//   datePmax?: string;
// };

// type PropsInsertDB = {
//   [K in PropsExtraLabelPower]: PropsDataInsertDb;
// };

// const _getDataToDbByTitle = (
//   valueInsertDb: PropsInsertDB,
//   apsResponse: PropsResponse,
//   objPower: { [K in PropsLabelPower]?: string | undefined },
//   labelPower: PropsLabelPower,
//   titleExtraPower: PropsExtraLabelPower,
// ) => {
//   const labelPmax = POWER_DEFINE[labelPower].titlePmax;
//   let valuePmax: string | undefined;
//   let datePmax: string | undefined;
//   if (labelPmax) {
//     const objPmax = apsResponse.obj.MaxDemand?.find(item => {
//       for (let name in item) {
//         if (name === labelPmax) {
//           return true;
//         }
//       }
//       return false;
//     });
//     if (objPmax) {
//       valuePmax = objPmax[labelPmax];
//       datePmax = objPmax['Thời điểm'];
//     } else {
//       valuePmax = undefined;
//       datePmax = undefined;
//     }
//   }

//   const data = {
//     power: objPower[labelPower],
//     datePower: apsResponse.obj['Ngày chốt'],
//   } as PropsDataInsertDb;
//   if (apsResponse.obj['Ngày chốt']) {
//     data.datePower = apsResponse.obj['Ngày chốt'];
//   }
//   if (valuePmax) {
//     data.pmax = valuePmax;
//     data.datePmax = datePmax;
//   }
//   valueInsertDb[titleExtraPower] = data;
// };

// const convertApsResponse2PropsInsertDb = (
//   apsResponse: PropsResponse,
// ): PropsInsertDB => {
//   let valueInsertDb = {} as PropsInsertDB;

//   for (let power of apsResponse.obj.Power ?? []) {
//     for (let label in power) {
//       const extraTitle = POWER_DEFINE[label].extraTitle;
//       if (typeof extraTitle === 'object') {
//         if (Array.isArray(extraTitle) === true) {
//           for (let _title of extraTitle) {
//             _getDataToDbByTitle(
//               valueInsertDb,
//               apsResponse,
//               power,
//               label as PropsLabelPower,
//               _title,
//             );
//           }
//         }
//       } else {
//         _getDataToDbByTitle(
//           valueInsertDb,
//           apsResponse,
//           power,
//           label as PropsLabelPower,
//           extraTitle,
//         );
//       }
//     }
//   }

//   return valueInsertDb;
// };

// export const onDoubleDocPress = () => {
//   hookProps.setState(state => {
//     state.KHCMISs = state.KHCMISs.map(itm => {
//       if (
//         itm.data[indexHeader.typeReadRf] !== TYPE_READ_RF.READ_SUCCEED &&
//         itm.data[indexHeader.typeReadRf] !== TYPE_READ_RF.WRITE_BY_HAND
//       ) {
//         itm = { ...itm };
//         itm.checked = !bStateCheckAll;
//       }

//       return itm;
//     });
//     return { ...state };
//   });
//   bStateCheckAll = !bStateCheckAll;
// };

// const readData = async () => {
//   let numRetries = Number(store?.state.appSetting.numRetriesRead);

//   if (numRetries <= 0) {
//     numRetries = 1;
//   }

//   console.log('numRetries:', numRetries);

//   for (
//     let index = 0;
//     index < controller.hookProps.state.KHCMISs.length;
//     index++
//   ) {
//     const item = controller.hookProps.state.KHCMISs[index];
//     if (item.checked === true) {
//       if (controller.hookProps.state.requestStop === true) {
//         break;
//       } else {
//         await sleep(150);
//       }
//       try {
//         for (let j = 0; j < 1; j++) {
//           let strSeri: string = item.data[indexHeader.seri] as string;
//           let codeMeterInDb = item.data[indexHeader.maCTO] as string;
//           let strRFCode: string = item.data[indexHeader.rf] as string;
//           let optinalRFCode = getRFCodeBySeriAndStockRFCode(strSeri, strRFCode);
//           let iDate: Date = hookProps.state.is0h
//             ? hookProps.state.dateLatch
//             : new Date();
//           console.log('strSeri:', strSeri);
//           let result = await apsReadRfGCS({
//             seri: strSeri,
//             codeMeterInDB: codeMeterInDb,
//             is0h: hookProps.state.is0h,
//             dateLatch: iDate,
//             rfCode: strRFCode,
//             numRetries: numRetries,
//           });
//           console.log(TAG, 'result:', JSON.stringify(result));
//           if (result.bSucceed === false) {
//             if (optinalRFCode !== strRFCode) {
//               console.log('try with new RF code: ', optinalRFCode);
//               console.log('stock RF code: ', strRFCode);
//               strRFCode = optinalRFCode;
//               result = await apsReadRfGCS({
//                 seri: strSeri,
//                 codeMeterInDB: codeMeterInDb,
//                 is0h: hookProps.state.is0h,
//                 dateLatch: iDate,
//                 rfCode: strRFCode,
//                 numRetries: numRetries,
//               });
//             }
//           }

//           if (result.bSucceed === true) {
//             const dataConverted = convertApsResponse2PropsInsertDb(result);

//             // find all element arr of this seri
//             const listUpdate: PropsUpdateDb[] = [];
//             let totalUpdateFailed: number = 0;

//             // only get curent dât, no need updae hook
//             hookProps.setState(state => {
//               state.KHCMISs = state.KHCMISs.map(itm => {
//                 if (itm.data[indexHeader.seri] === strSeri) {
//                   // get BCS, rfcode
//                   const strBCS = itm.data[indexHeader.bcs] as string;
//                   const RfcodeNow = itm.data[indexHeader.rf] as string;
//                   if (dataConverted[strBCS]) {
//                     const newCapacity =
//                       Number(dataConverted[strBCS].power) -
//                       Number(itm.data[indexHeader.CS_CU]);
//                     listUpdate.push({
//                       seri: strSeri,
//                       BCSCMIS: strBCS,
//                       date: dataConverted[strBCS].datePower ?? iDate,
//                       RfCode: RfcodeNow,
//                       T0: dataConverted[strBCS].power,
//                       newCapacity: newCapacity,
//                       oldCapacity: Number(itm.data[indexHeader.SL_CU]),
//                       Pmax: dataConverted[strBCS].pmax,
//                       datePmax: dataConverted[strBCS].datePmax,
//                     });
//                   }
//                 }
//                 return itm;
//               });
//               return state;
//             });

//             let bcsReadSucced = '';
//             let statusWriteFailed = '';
//             for (let itemUpdate of listUpdate) {
//               bcsReadSucced += ' ' + itemUpdate.BCSCMIS + ',';
//               let updateDbSucceess = await updateDataToDB(itemUpdate);
//               if (updateDbSucceess) {
//                 itemUpdate.updateSucced = true;
//               } else {
//                 totalUpdateFailed++;
//                 itemUpdate.updateSucced = false;
//                 statusWriteFailed += ' ' + itemUpdate.BCSCMIS + ',';
//               }
//             }

//             let status =
//               'Đọc thành công ' +
//               listUpdate.length +
//               ' chỉ mục: ' +
//               bcsReadSucced +
//               ' của seri: ' +
//               strSeri;

//             if (totalUpdateFailed > 0) {
//               status +=
//                 ' Ghi Lỗi ' +
//                 totalUpdateFailed +
//                 ':' +
//                 statusWriteFailed +
//                 ' của seri: ' +
//                 strSeri;
//             }
//             hookProps.setState(state => {
//               state.status = status;
//               for (let itemUpdate of listUpdate) {
//                 const indexCurRow = state.KHCMISs.findIndex(
//                   itm =>
//                     itm.data[indexHeader.seri] === strSeri &&
//                     itm.data[indexHeader.bcs] === itemUpdate.BCSCMIS &&
//                     itm.data[indexHeader.rf] === itemUpdate.RfCode,
//                 );
//                 //console.log('indexrow:', indexCurRow);
//                 if (indexCurRow !== -1) {
//                   state.KHCMISs[indexCurRow] = {
//                     ...state.KHCMISs[indexCurRow],
//                   };
//                   state.KHCMISs[indexCurRow].data = [
//                     ...state.KHCMISs[indexCurRow].data,
//                   ];
//                   state.KHCMISs[indexCurRow].checked = false;
//                   if (itemUpdate.isAbnormal !== true) {
//                     if (
//                       store?.state.appSetting.showResultOKInWriteData !== true
//                     ) {
//                       if (itemUpdate.updateSucced === true) {
//                         // remove from array
//                         //console.log('a:', state.KHCMISs.length);
//                         state.KHCMISs = state.KHCMISs.filter(itm => {
//                           return !(
//                             itm.data[indexHeader.seri] === strSeri &&
//                             itm.data[indexHeader.bcs] === itemUpdate.BCSCMIS &&
//                             itm.data[indexHeader.rf] === itemUpdate.RfCode
//                           );
//                         });
//                         //console.log('b:', state.KHCMISs.length);
//                       }
//                     } else {
//                       state.KHCMISs[indexCurRow].data[indexHeader.typeReadRf] =
//                         TYPE_READ_RF.READ_SUCCEED;
//                       state.KHCMISs[indexCurRow].data[indexHeader.CS_MOI] =
//                         itemUpdate.T0;
//                       state.KHCMISs[indexCurRow].data[indexHeader.NgayMoi] =
//                         formatDateTimeDB(itemUpdate.date);
//                       if (itemUpdate.Pmax) {
//                         state.KHCMISs[indexCurRow].data[indexHeader.Pmax] =
//                           itemUpdate.Pmax;
//                       }
//                       if (itemUpdate.datePmax) {
//                         state.KHCMISs[indexCurRow].data[indexHeader.NgayPmax] =
//                           itemUpdate.datePmax;
//                       }
//                       if (itemUpdate.ghiChu) {
//                         state.KHCMISs[indexCurRow].data[indexHeader.ghiChu] =
//                           itemUpdate.ghiChu;
//                       }
//                     }
//                   } else {
//                     state.KHCMISs[indexCurRow].data[indexHeader.typeReadRf] =
//                       TYPE_READ_RF.ABNORMAL_CAPACITY;
//                   }
//                 }
//               }

//               return { ...state };
//             });

//             //}
//             index = -1; // reset index -1 ++ = 0
//             break;
//           } else {
//             hookProps.setState(state => {
//               state.status =
//                 'Đọc thất bại seri ' + strSeri + ': ' + result.strMessage;
//               state.KHCMISs = state.KHCMISs.map(itm => {
//                 if (itm.data[indexHeader.seri] === strSeri) {
//                   itm = { ...itm };
//                   itm.data = [...itm.data];
//                   itm.checked = false;
//                   itm.data[indexHeader.typeReadRf] =
//                     itm.data[indexHeader.typeReadRf] ===
//                     TYPE_READ_RF.HAVE_NOT_READ
//                       ? TYPE_READ_RF.READ_FAILED
//                       : itm.data[indexHeader.typeReadRf];
//                 }
//                 return itm;
//               });
//               return { ...state };
//             });
//             let writeFailed = await updateReadFailToDb(strSeri);
//             if (writeFailed !== true) {
//               console.log('Update Read failed to DB is Failed');
//             }
//           }
//         }
//       } catch (err :any) {
//         console.log(TAG, err.message);
//         return;
//       }
//     }
//   }
// };

// export const onBtnReadPress = async () => {
//   if (checkCondition() === false) {
//     setStatus('Chưa có item nào được chọn');
//     return;
//   }
//   if (store?.state.hhu.connect !== 'CONNECTED') {
//     hookProps.setState(state => {
//       state.status = 'Chưa kết nối bluetooth';
//       return { ...state };
//     });
//     Vibration.vibrate([20, 30, 20]);
//     return;
//   }

//   hookProps.setState(state => {
//     state.isReading = true;
//     state.requestStop = false;
//     state.status = 'Đang đọc ...';
//     return { ...state };
//   });

//   //await BleFunc_StartNotification(ObjSend.id);

//   await readData();

//   hookProps.setState(state => {
//     state.isReading = false;
//     if (state.status === 'Đang đọc ...') {
//       state.status = '';
//     }
//     return { ...state };
//   });
//   //await BleFunc_StopNotification(ObjSend.id);
// };

// export const onBtnStopPress = () => {
//   hookProps.setState(state => {
//     state.requestStop = true;
//     return { ...state };
//   });
// };

// type PropsUpdateDb = {
//   seri: string;
//   BCSCMIS: string;
//   RfCode: string;
//   T0: string;
//   date: Date;
//   oldCapacity: number;
//   newCapacity: number;
//   Pmax?: string;
//   datePmax?: string;
//   isWriteHand?: boolean;
//   ghiChu?: string;
//   updateSucced?: boolean;
//   isAbnormal?: boolean;
// };

// const updateReadFailToDb = async (seri: string): Promise<boolean> => {
//   const valuesSet = {};

//   const condition: PropsCondition = {
//     data: {},
//     logic: '=',
//     operator: 'AND',
//   };

//   condition.data[KHCMISClomunsInfo.infoColumn.SERY_CTO.id as string] = seri;
//   condition.data[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//     TYPE_READ_RF.HAVE_NOT_READ;

//   valuesSet[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//     TYPE_READ_RF.READ_FAILED;

//   for (let i = 0; i < 1; i++) {
//     const updateSucceed = await CMISKHServices.update(condition, valuesSet);
//     if (updateSucceed) {
//       console.log('update table succeed');
//       return true;
//     } else {
//       //console.log('update table failed');
//     }
//   }

//   return false;
// };

// export const updateDataToDB = async (
//   props: PropsUpdateDb,
// ): Promise<boolean> => {
//   const valuesSet = {};

//   const condition: PropsCondition = {
//     data: {},
//     logic: '=',
//     operator: 'AND',
//   };

//   //console.log('props:', props);

//   let percent: number = 0;

//   let isAbnormal: boolean = false;
//   let statusAbnormal = '';
//   if (props.isWriteHand !== true) {
//     if (store?.state.appSetting.setting.typeAlarm === 'Value') {
//       if (
//         props.newCapacity >=
//           Number(store.state.appSetting.setting.upperThresholdValue) ||
//         props.newCapacity <=
//           Number(store.state.appSetting.setting.lowerThresholdValue)
//       ) {
//         isAbnormal = true;
//         statusAbnormal = `
//         Seri: ${props.seri}
//         Bộ chỉ số: ${props.BCSCMIS}
//         Ngưỡng trên: ${store.state.appSetting.setting.upperThresholdValue} kWh
//         Ngưỡng dưới: ${store.state.appSetting.setting.lowerThresholdValue} kWh
//         Sản lượng thực tế: ${props.newCapacity}`;
//       }
//     } else {
//       percent = (props.newCapacity / props.oldCapacity) * 100;
//       if (
//         percent >=
//           Number(store?.state.appSetting.setting.upperThresholdPercent) ||
//         percent <= Number(store?.state.appSetting.setting.lowerThresholdPercent)
//       ) {
//         isAbnormal = true;
//         statusAbnormal = `
//         Seri: ${props.seri}
//         Bộ chỉ số: ${props.BCSCMIS}
//         Ngưỡng trên: ${store?.state.appSetting.setting.upperThresholdPercent}%
//         Ngưỡng dưới: ${store?.state.appSetting.setting.lowerThresholdPercent}%
//         Sản lượng thực tế: ${percent}%`;
//       }
//     }
//   }

//   if (isAbnormal === true) {
//     if (props.Pmax) {
//       statusAbnormal += `
//       Chỉ số: ${props.T0}
//       Pmax: ${props.Pmax}
//       Ngày Pmax: ${props.datePmax}
//       `;
//     }
//     await new Promise(resolve => {
//       controller.variable.modalAlert.title = 'Dữ liệu bất thường';
//       controller.variable.modalAlert.content = statusAbnormal;
//       controller.variable.modalAlert.onDissmiss = resolve;

//       store?.setValue(state => {
//         state.modal.showWriteRegister = true;
//         return { ...state };
//       });
//     });
//   }

//   //isAbnormal = false;

//   condition.data[KHCMISClomunsInfo.infoColumn.SERY_CTO.id as string] =
//     props.seri;
//   condition.data[KHCMISClomunsInfo.infoColumn.LOAI_BCS.id as string] =
//     props.BCSCMIS;
//   condition.data[KHCMISClomunsInfo.infoColumn.RF.id as string] = props.RfCode;

//   if (isAbnormal) {
//     valuesSet[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//       TYPE_READ_RF.ABNORMAL_CAPACITY;
//   } else {
//     // const strDate =
//     //   props.date.toLocaleDateString('vi').split('/').join('-') +
//     //   ' ' +
//     //   props.date.toLocaleTimeString('vi');
//     const strDate = formatDateTimeDB(props.date);
//     if (props.isWriteHand === true) {
//       valuesSet[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//         TYPE_READ_RF.WRITE_BY_HAND;
//     } else {
//       valuesSet[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//         TYPE_READ_RF.READ_SUCCEED;
//     }
//     valuesSet[KHCMISClomunsInfo.infoColumn.CS_MOI.id as string] = props.T0;
//     valuesSet[KHCMISClomunsInfo.infoColumn.NGAY_MOI.id as string] = strDate;
//     if (props.Pmax && props.datePmax) {
//       valuesSet[KHCMISClomunsInfo.infoColumn.PMAX.id as string] = props.Pmax;
//       valuesSet[KHCMISClomunsInfo.infoColumn.NGAY_PMAX.id as string] =
//         props.datePmax;
//     }
//     if (props.ghiChu) {
//       valuesSet[KHCMISClomunsInfo.infoColumn.GhiChu.id as string] =
//         props.ghiChu;
//     }

//     //console.log('valuesSet:', valuesSet);
//   }

//   // for (let item in props) {
//   //   console.log(item + ':', props[item]);
//   // }

//   //console.log('condition:', condition);

//   console.log('isAbnormal:', isAbnormal);

//   props.isAbnormal = isAbnormal;

//   for (let i = 0; i < 3; i++) {
//     const updateSucceed = await CMISKHServices.update(condition, valuesSet);
//     if (updateSucceed) {
//       console.log('update table succeed');
//       return true;
//     } else {
//       console.log('update table failed');
//     }
//   }

//   return false;
// };
