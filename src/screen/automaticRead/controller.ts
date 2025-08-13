import React from 'react';
import {
  PropsItemBook,
  PropsItemColumn,
  PropsItemStation,
} from '../../component/detailDB';
import { infoHeader } from '../../component/header';
import { PropsKHCMISModel, PropsPercentRead } from '../../database/model';
import { CMISKHServices } from '../../database/service';
import {
  IsReadRFSucceed,
  IsWriteByHand,
  TYPE_READ_RF,
} from '../../service/hhu/defineEM';
import { Colors } from '../../theme';
import { NavigationProp, NavigationRoute, ParamListBase } from '@react-navigation/native';

const labels = [
  'Lỗi',
  'Ghi \ntay ',
  //'Bất thường',
  'Chưa \nđọc',
  'Thành \ncông',
];

type PropsSubQuantity = {
  label: string;
  quantity: number;
  color: string;
};
type PropsInfoQuantity = {
  readError: PropsSubQuantity;
  writeByHand: PropsSubQuantity;
  upperThreshold: PropsSubQuantity;
  lowerThreshold: PropsSubQuantity;
  negative: PropsSubQuantity;
  succeed: PropsSubQuantity;
  noRead: PropsSubQuantity;
  total: PropsSubQuantity;
};

export const labelsStock = [
  'Lỗi',
  'Ghi tay',

  'Thành công',
  'Chưa đọc',
  'Vượt ngưỡng trên',
  'Vật ngưỡng dưới',
  'Sản lượng âm',
  'Tổng BCS',

  // 'Lỗi ',
  // 'Ghi tay ',
  // 'Bất thường',
  // 'Thành công',
  // 'Chưa đọc',
  // 'Tổng BCS',
];

// error: number;
// writeByHand: number;
// noRead: number;
// succeed: number;

export const colorsChart = [
  Colors.primary,
  Colors.register.byHand,
  Colors.backgroundIcon,
  Colors.register.normal,
  //Colors.purple,
  // '#c2fcc1', //'#FF9800',
  // '#FFEB3B',
  // '#67f3bb', //'#4CAF50',
  // Colors.backgroundIcon, //'#2196F3',
  //'#0b3af9',
];

export const dummyDataTable = [
  {
    x: labels[0],
    y: 10,
  },
  {
    x: labels[1],
    y: 10,
  },
  {
    x: labels[2],
    y: 10,
  },
  {
    x: labels[3],
    y: 10,
  },
];

type PropsState = {
  graphicData: {
    x: string;
    y: number;
  }[];
  percent: number[];
  dataDB: PropsKHCMISModel[];
  detailDB: PropsItemStation[];
  infoQuantity: PropsInfoQuantity;
  infoQuantityArr: PropsSubQuantity[];
};

type PropsHook = {
  state: PropsState;
  setState: React.Dispatch<React.SetStateAction<PropsState>>;
};

export const hookProps = {} as PropsHook;

function GetDefaultInfoQuantity(): PropsInfoQuantity {
  const infoQuantity: PropsInfoQuantity = {
    readError: {
      label: 'Lỗi',
      quantity: 0,
      color: Colors.primary,
    },
    writeByHand: {
      label: 'Ghi tay',
      quantity: 0,
      color: Colors.register.byHand,
    },

    succeed: {
      label: 'Thành công',
      quantity: 0,
      color: Colors.register.normal,
    },
    noRead: {
      label: 'Chưa đọc',
      quantity: 0,
      color: Colors.backgroundIcon,
    },
    upperThreshold: {
      label: 'Vượt ngưỡng trên',
      quantity: 0,
      color: Colors.register.upper,
    },
    lowerThreshold: {
      label: 'Vượt ngưỡng dưới',
      quantity: 0,
      color: Colors.register.lower,
    },
    negative: {
      label: 'Sản lượng âm',
      quantity: 0,
      color: Colors.register.negative,
    },
    total: {
      label: 'Tổng BCS',
      quantity: 0,
      color: Colors.purple,
    },
  };

  return infoQuantity;
}

function convertInfoQuantity2List(info: PropsInfoQuantity): PropsSubQuantity[] {
  const rest: PropsSubQuantity[] = [];

  for (let key in info) {
    rest.push(info[key]);
  }

  return rest;
}

export const GetHook = () => {
  const graphData: {
    x: string;
    y: number;
  }[] = [];

  const percent: number[] = [];

  for (let item of labels) {
    graphData.push({
      x: item,
      y: 1,
    });
    percent.push(0);
  }
  //console.log(graphData);
  const infoQuantity = GetDefaultInfoQuantity();
  const [state, setState] = React.useState<PropsState>({
    graphicData: graphData,
    percent: percent,
    dataDB: [],
    detailDB: [],
    infoQuantity: infoQuantity,
    infoQuantityArr: convertInfoQuantity2List(infoQuantity),
  });

  hookProps.state = state;
  hookProps.setState = setState;
};

export const onInit = async (navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & { getState(): Readonly<{ key: string; index: number; routeNames: string[]; history?: unknown[] | undefined; routes: NavigationRoute<ParamListBase, string>[]; type: string; stale: false; }> | undefined; }) => {
  navigation.addListener('beforeRemove', e => {
    e.preventDefault();
  });

  navigation.addListener('focus', async () => {
    console.log('Get Percentage Read');

    const dataDB = await CMISKHServices.findAll();
    //const result = await CMISKHServices.getPercentRead();
    //console.log('resultcc:', result);

    const infoQuantity = GetDefaultInfoQuantity();

    dataDB.forEach(item => {
      if (IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF)) {
        infoQuantity.succeed.quantity++;
        if (
          item.LoaiDoc === TYPE_READ_RF.ABNORMAL_CAPACITY ||
          item.LoaiDoc === TYPE_READ_RF.ABNORMAL_UPPER
          //item.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER
        ) {
          infoQuantity.upperThreshold.quantity++;
          //console.log('RF:', infoQuantity.upperThreshold.quantity);
        } else if (
          item.LoaiDoc === TYPE_READ_RF.ABNORMAL_LOWER //||
          //item.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER
        ) {
          infoQuantity.lowerThreshold.quantity++;
        } else if (
          item.LoaiDoc === TYPE_READ_RF.ABNORMAL_NEGATIVE //||
          //item.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE
        ) {
          infoQuantity.negative.quantity++;
        }
      } else if (item.LoaiDoc === TYPE_READ_RF.READ_FAILED) {
        infoQuantity.readError.quantity++;
        // } else if (item.LoaiDoc === TYPE_READ_RF.ABNORMAL_CAPACITY) {
        //   result.abnormalRead++;
      } else if (IsWriteByHand(item.LoaiDoc as TYPE_READ_RF)) {
        infoQuantity.writeByHand.quantity++;
        if (item.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER) {
          infoQuantity.upperThreshold.quantity++;
          //console.log('hand:', infoQuantity.upperThreshold.quantity);
        } else if (item.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER) {
          infoQuantity.lowerThreshold.quantity++;
        } else if (
          item.LoaiDoc === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE
        ) {
          infoQuantity.negative.quantity++;
        }
      } else {
        infoQuantity.noRead.quantity++;
      }
    });

    infoQuantity.total.quantity = dataDB.length;

    //   Colors.register.notRead,
    // Colors.register.byHand,
    // Colors.register.upper,
    // Colors.register.lower,
    // Colors.register.negative,
    // Colors.register.normal,

    type NoChartProps = {
      error: number;
      writeByHand: number;
      noRead: number;
      succeed: number;
    };

    const resultChart: NoChartProps = {
      error: infoQuantity.readError.quantity,
      writeByHand: infoQuantity.writeByHand.quantity,
      noRead: infoQuantity.noRead.quantity,
      succeed: infoQuantity.succeed.quantity,
    };

    const detailDB = getDbDetail(dataDB);

    hookProps.setState(state => {
      state.infoQuantity = infoQuantity;
      state.infoQuantityArr = convertInfoQuantity2List(infoQuantity);

      let total = 0;
      let percent: string[] = [];

      state.percent = [];
      for (let item in resultChart) {
        total += resultChart[item];
      }

      for (let item in resultChart) {
        if (total === 0) {
          percent.push(' %');
          state.percent.push(0);
        } else {
          const per = (resultChart[item] / total) * 100;
          state.percent.push(per);
          percent.push(' ' + per.toFixed(0) + ' %');
        }
      }

      const minimumPercent = 8;
      // error: number;
      // writeByHand: number;
      // noRead: number;
      // succeed: number;

      state.graphicData[0].x =
        state.percent[0] > minimumPercent ? labels[0] + percent[0] : '';
      state.graphicData[0].y = resultChart.error;
      state.graphicData[1].x =
        state.percent[1] > minimumPercent ? labels[1] + percent[1] : '';
      state.graphicData[1].y = resultChart.writeByHand;
      state.graphicData[2].x =
        state.percent[2] > minimumPercent ? labels[2] + percent[2] : '';
      state.graphicData[2].y = resultChart.noRead;
      state.graphicData[3].x =
        state.percent[3] > minimumPercent ? labels[3] + percent[3] : '';
      state.graphicData[3].y = resultChart.succeed;

      //console.log(state.graphicData);
      //console.log(state.percent);

      state.detailDB = detailDB;

      return { ...state };
    });
  });
};

export const onDeInit = (navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
    getState(): Readonly<{
      key: string; index: number; //'Bất thường',
      //'Bất thường',
      routeNames: string[]; history?: unknown[] | undefined; routes: NavigationRoute<ParamListBase, string>[]; type: string; stale: false;
    }> | undefined;
  }) => {
  navigation.removeListener('focus', () => {});
  navigation.removeListener('beforeRemove', () => {});
};

const getUniqueStationCode = (dataDB: PropsKHCMISModel[]): string[] => {
  const stationSet = new Set<string>();
  for (let item of dataDB) {
    stationSet.add(item.MA_TRAM);
  }

  return Array.from(stationSet);
};
const getUniqueBookCode = (
  dataDB: PropsKHCMISModel[],
  stationCode: string,
): string[] => {
  const arrSet = new Set<string>();
  for (let item of dataDB) {
    if (item.MA_TRAM === stationCode) {
      arrSet.add(item.MA_QUYEN);
    }
  }
  return Array.from(arrSet);
};
const getUniqueColumnCode = (
  dataDB: PropsKHCMISModel[],
  stationCode: string,
  bookCode: string,
): string[] => {
  const arrSet = new Set<string>();
  for (let item of dataDB) {
    if (item.MA_TRAM === stationCode && item.MA_QUYEN === bookCode) {
      arrSet.add(item.MA_COT);
    }
  }
  return Array.from(arrSet);
};

const getInfoColumn = (
  dataDB: PropsKHCMISModel[],
  stationCode: string,
  bookCode: string,
  column: string,
): PropsItemColumn => {
  const result = {} as PropsItemColumn;
  result.totalBCS = 0;
  result.totalMeter = 0;
  result.totalSucceed = 0;
  const arrSet = new Set<string>();
  for (let item of dataDB) {
    if (
      item.MA_TRAM === stationCode &&
      item.MA_QUYEN === bookCode &&
      item.MA_COT === column
    ) {
      arrSet.add(item.MA_COT);
      if (
        IsReadRFSucceed(item.LoaiDoc as TYPE_READ_RF) ||
        IsWriteByHand(item.LoaiDoc as TYPE_READ_RF)
      ) {
        result.totalSucceed++;
      }
      result.totalBCS++;
    }
  }

  result.totalMeter = arrSet.size;
  result.columnName = column;

  return result;
};

const getItemBook = (
  dataDB: PropsKHCMISModel[],
  station: string,
  book: string,
): PropsItemBook => {
  const itemBook = {} as PropsItemBook;

  const listColumn = getUniqueColumnCode(dataDB, station, book).sort();
  const arrItemColumn: PropsItemColumn[] = [];
  for (let column of listColumn) {
    arrItemColumn.push(getInfoColumn(dataDB, station, book, column));
  }

  itemBook.bookName = book;
  itemBook.totalBCS = 0;
  itemBook.totalMeter = 0;
  itemBook.totalSucceed = 0;
  itemBook.listColumn = arrItemColumn;
  for (let item of arrItemColumn) {
    itemBook.totalBCS += item.totalBCS;
    itemBook.totalMeter += item.totalMeter;
    itemBook.totalSucceed += item.totalSucceed;
  }

  return itemBook;
};

const getItemStation = (
  dataDB: PropsKHCMISModel[],
  station: string,
): PropsItemStation => {
  const itemStation = {} as PropsItemStation;

  const listItemBook: PropsItemBook[] = [];
  const listBook = getUniqueBookCode(dataDB, station);
  for (let book of listBook) {
    listItemBook.push(getItemBook(dataDB, station, book));
  }

  itemStation.stationName = station;
  itemStation.totalBCS = 0;
  itemStation.totalMeter = 0;
  itemStation.totalSucceed = 0;
  itemStation.listBook = listItemBook;
  for (let item of listItemBook) {
    itemStation.totalBCS += item.totalBCS;
    itemStation.totalMeter += item.totalMeter;
    itemStation.totalSucceed += item.totalSucceed;
  }

  return itemStation;
};

const getDbDetail = (dataDB: PropsKHCMISModel[]): PropsItemStation[] => {
  const listItemStation: PropsItemStation[] = [];
  const listStation = getUniqueStationCode(dataDB);
  for (let station of listStation) {
    listItemStation.push(getItemStation(dataDB, station));
  }

  return listItemStation;
};
