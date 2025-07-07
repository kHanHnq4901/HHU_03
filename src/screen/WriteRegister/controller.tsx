// import React, { useContext, useState } from 'react';
// import RNFS from 'react-native-fs';
// import { CMISKHServices, PropsPagination } from '../../database/service';
// import {
//   KHCMISClomunsInfo,
//   KHCMISModelFields,
//   PropsKHCMISModel,
// } from '../../database/model';
// import { TYPE_READ_RF } from '../../service/hhu/defineEM';
// import { PropsStore, storeContext } from '../../store';
// import { PropsCondition } from '../../database/repository/index';
// import { scale, scaleWidth } from '../../theme';
// import { onSearchPress } from './handleButton';

// const TAG = 'WriteRegister Controller: ';

// type PropsDropdown = { label: string; value: string };

// export const variable = {
//   widthDoc: 70,
//   modalAlert: { title: '', content: '', onDissmiss: (value?: any) => {} },
// };

// export type RowTableProps = {
//   key: string;
//   data: (string | number)[];
//   checked: boolean;
// };

// export const itemPerPages = 1000;

// export type HookState = {
//   KHCMISs: RowTableProps[];
//   page: number;
//   totalPage: number;
//   dropdown: {
//     open: boolean;
//     value: any;
//     items: PropsDropdown[];
//     subDropdown: {
//       placeholder: string;
//       open: boolean;
//       value: any;
//       items: PropsDropdown[];
//     };
//   };
//   searchText: string;
//   searchStart: string;
//   searchEnd: string;
//   isReading: boolean;
//   isLoadingTable: boolean;
//   is0h: boolean;
//   dateLatch: Date;
//   requestStop: boolean;
//   status: string;
// };

// type PropsHeaders = {
//   titles: string[];
//   widths: number[];
// };

// const getHeaderProps = (): PropsHeaders => {
//   const items: PropsHeaders = {
//     titles: [],
//     widths: [],
//   };

//   for (let i in KHCMISClomunsInfo.infoColumn) {
//     if (KHCMISClomunsInfo.infoColumn[i].id !== null) {
//       items.titles.push(KHCMISClomunsInfo.infoColumn[i].title);
//       items.widths.push(KHCMISClomunsInfo.infoColumn[i].width * scaleWidth);
//     }
//   }

//   variable.widthDoc = 70 * scaleWidth;

//   return items;
// };

// export const getIndexOfHeader = (name: string): number => {
//   // it containt custom column
//   return headerTables.titles.indexOf(name);
// };

// const getItemDropdownProps = (): PropsDropdown[] => {
//   const items: PropsDropdown[] = [];
//   for (let i in KHCMISClomunsInfo.infoColumn) {
//     if (KHCMISClomunsInfo.infoColumn[i].id) {
//       items.push({
//         label: KHCMISClomunsInfo.infoColumn[i].title,
//         value: KHCMISClomunsInfo.infoColumn[i].id,
//       });
//     }
//   }

//   return items;
// };

// export const headerTables = getHeaderProps();

// export type HookProps = {
//   state: HookState;
//   setState: React.Dispatch<React.SetStateAction<HookState>>;
// };

// export const hookProps = {} as HookProps;

// export let store = {} as PropsStore;

// export const GetHookProps = (): HookProps => {
//   const [state, setState] = useState<HookState>({
//     KHCMISs: [],
//     page: 0,
//     totalPage: 5,
//     dropdown: {
//       open: false,
//       value: null,
//       items: getItemDropdownProps(),
//       subDropdown: {
//         placeholder: '',
//         open: false,
//         value: null,
//         items: [
//           { label: 'Quyển 1', value: 'Quyển 1' },
//           { label: 'Quyển 2', value: 'Quyển 2' },
//         ],
//       },
//     },
//     searchText: '',
//     searchStart: '',
//     searchEnd: '',
//     isReading: false,
//     isLoadingTable: true,
//     is0h: false,
//     dateLatch: new Date(),
//     requestStop: false,
//     status: '',
//   });
//   hookProps.state = state;
//   hookProps.setState = setState;

//   store = useContext(storeContext);

//   return hookProps;
// };

// export const setRowTables = (rows: any[]): RowTableProps[] => {
//   const ret: RowTableProps[] = [];
//   //console.log('hfsdajfldsflsdjk');
//   for (let row of rows) {
//     const typeReadRf = row[indexHeader.typeReadRf];
//     let ok = false;
//     if (store?.state.appSetting.showResultOKInWriteData === true) {
//       ok = true;
//     } else {
//       if (
//         typeReadRf === TYPE_READ_RF.HAVE_NOT_READ ||
//         typeReadRf === TYPE_READ_RF.READ_FAILED
//       ) {
//         ok = true;
//       } else {
//         ok = false;
//       }
//     }
//     //console.log('ok:', ok);
//     if (ok) {
//       const key =
//         row[indexHeader.seri] + row[indexHeader.bcs] + row[indexHeader.rf];
//       ret.push({
//         checked: false,
//         data: row,
//         key: key,
//       });
//     }
//   }
//   //console.log('ret0:', ret[0]);
//   return ret;
// };

// type PropsDataSubDropdown = {
//   [key: string]: PropsDropdown[];
// };

// export const dataSubDropdown = {} as PropsDataSubDropdown;

// export const indexHeader = {
//   seri: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.SERY_CTO.title),
//   bcs: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.LOAI_BCS.title),
//   rf: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.RF.title),
//   typeReadRf: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.LoaiDoc.title),
//   maCTO: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.MA_CTO.title),
//   CS_CU: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.CS_CU.title),
//   SL_CU: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.SL_CU.title),
//   CS_MOI: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.CS_MOI.title),
//   Pmax: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.PMAX.title),
//   NgayPmax: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.NGAY_PMAX.title),
//   NgayMoi: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.NGAY_MOI.title),
//   ghiChu: getIndexOfHeader(KHCMISClomunsInfo.infoColumn.GhiChu.title),
// };

// export const updateDataToTable = async (page?: number) => {
//   hookProps.setState(state => {
//     state.status = 'Đang cập nhật dữ liệu ...';
//     return { ...state };
//   });

//   let rows: any[] = [];
//   // const pagination: PropsPagination = {
//   //   page: page ?? hookProps.state.page,
//   //   itemPerPage: itemPerPages,
//   // };
//   const condition: PropsCondition = {
//     data: [],
//     logic: '!=',
//     operator: 'AND',
//   };

//   const cd1: { [key: string]: any } = {};
//   const cd2: { [key: string]: any } = {};
//   cd1[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//     TYPE_READ_RF.READ_SUCCEED;
//   cd2[KHCMISClomunsInfo.infoColumn.LoaiDoc.id as string] =
//     TYPE_READ_RF.WRITE_BY_HAND;

//   condition.data.push(cd1);
//   condition.data.push(cd2);

//   //console.log('kkkk');
//   let items: PropsKHCMISModel[];
//   try {
//     if (store?.state.appSetting.showResultOKInWriteData === true) {
//       items = await CMISKHServices.findAll();
//     } else {
//       items = await CMISKHServices.findAll(undefined, condition);
//     }

//     //console.log('Items:', items);

//     for (let i = 0; i < items.length; i++) {
//       const row: any[] = [];
//       for (let j = 0; j < KHCMISModelFields.length; j++) {
//         row.push(items[i][KHCMISModelFields[j]]); //.toString());
//         // console.log('typeof CS_CU:', typeof items[i][KHCMISModelFields[j]]);
//       }
//       rows.push(row);
//     }

//     //console.log('rows:', rows);

//     rows = setRowTables(rows);
//   } catch (err :any) {}

//   // console.log(TAG, 'row length kk:', rows.length);
//   // console.log('rows[0]:', rows[0]);

//   hookProps.setState(state => {
//     state.KHCMISs = rows;
//     state.totalPage = Math.ceil(rows.length / itemPerPages); //pagination.totalPage as number;
//     state.isLoadingTable = false;
//     state.status = 'Tổng: ' + rows.length;
//     //state.dropdown.subDropdown.items = itemsMaQuyen;
//     return { ...state };
//   });
// };

// const updateValueSubDropdown = async () => {
//   const listMaQuyenCSDL = await CMISKHServices.findUniqueValuesInColumn(
//     {
//       idColumn: KHCMISClomunsInfo.infoColumn.MA_QUYEN.id as string,
//     },
//     undefined,
//     'ascending',
//   );

//   const itemsMaQuyen = listMaQuyenCSDL.map(item => {
//     const tmp: PropsDropdown = {
//       label: item[KHCMISClomunsInfo.infoColumn.MA_QUYEN.id as string],
//       value: item[KHCMISClomunsInfo.infoColumn.MA_QUYEN.id as string],
//     };
//     return tmp;
//   });

//   dataSubDropdown[KHCMISClomunsInfo.infoColumn.MA_QUYEN.id as string] =
//     itemsMaQuyen;

//   const listMaCotCSDL = await CMISKHServices.findUniqueValuesInColumn(
//     {
//       idColumn: KHCMISClomunsInfo.infoColumn.MA_COT.id as string,
//     },
//     undefined,
//     'ascending',
//   );

//   const itemsMaCot = listMaCotCSDL.map(item => {
//     const tmp: PropsDropdown = {
//       label: item[KHCMISClomunsInfo.infoColumn.MA_COT.id as string],
//       value: item[KHCMISClomunsInfo.infoColumn.MA_COT.id as string],
//     };
//     return tmp;
//   });

//   dataSubDropdown[KHCMISClomunsInfo.infoColumn.MA_COT.id as string] =
//     itemsMaCot;

//   const listMaTramCSDL = await CMISKHServices.findUniqueValuesInColumn(
//     {
//       idColumn: KHCMISClomunsInfo.infoColumn.MA_TRAM.id as string,
//     },
//     undefined,
//     'ascending',
//   );

//   const itemsMaTram = listMaTramCSDL.map(item => {
//     const tmp: PropsDropdown = {
//       label: item[KHCMISClomunsInfo.infoColumn.MA_TRAM.id as string],
//       value: item[KHCMISClomunsInfo.infoColumn.MA_TRAM.id as string],
//     };
//     return tmp;
//   });

//   dataSubDropdown[KHCMISClomunsInfo.infoColumn.MA_TRAM.id as string] =
//     itemsMaTram;
// };

// export const onInit = async navigation => {
//   //   const path = RNFS.DocumentDirectoryPath.replace('files', 'databases');
//   //   RNFS.readdir(path).then(console.log).catch(console.log);
//   navigation.addListener('focus', async () => {
//     // hookProps.setState(state => {
//     //   state.isLoadingTable = true;
//     //   //state.dropdown.subDropdown.items = itemsMaQuyen;
//     //   return { ...state };
//     // });
//     if ((await onSearchPress(false)) === false) {
//       //console.log('update lai');
//       await updateDataToTable();
//     }
//     await updateValueSubDropdown();
//     // hookProps.setState(state => {
//     //   state.isLoadingTable = false;
//     //   //state.dropdown.subDropdown.items = itemsMaQuyen;
//     //   return { ...state };
//     // });
//   });
// };

// export const onDeInit = navigation => {
//   navigation.removeListener('focus', () => {});
// };
