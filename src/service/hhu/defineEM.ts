import { dataDBMatchSeriVersion } from '../../database/service/matchSeriVersionService';
import { Colors } from '../../theme';
import { GetObjMaCongToFromStorage } from '../storage/maCongTo';
import { PropsExtraLabelPower, PropsLabelMaxDemand } from './aps/hhuAps';
import { GetTypeMeterAndPhase } from './otherNsx/huu_hong/hhuApsHHM';

export type SUPPORT_NSX = 'GELEX' | 'Hữu Hồng';

export const LoaiDoc = {
  haveNotWrite: {
    value: 0,
    label: 'Chưa ghi',
  },
  byRF: {
    value: 1,
    label: 'RF',
  },
  byHand: {
    value: 2,
    label: 'Nhập tay',
  },
  byRFButFaild: {
    value: 3,
    label: 'RF thất bại',
  },
  byRFbutAbnormal: {
    value: 4,
    label: 'RF, chỉ số bắt thường',
  },
};

export type VersionMeterValue = '1' | '2' | '3';
type VersionMeterKey = 'DLMS_MANY_CHANEL' | 'DLMS_ONE_CHANEL' | 'IEC';
export const VersionMeter: { [K in VersionMeterKey]: VersionMeterValue } = {
  DLMS_MANY_CHANEL: '1',
  DLMS_ONE_CHANEL: '2',
  IEC: '3',
};

export enum CommandRF {
  INSTANT_POWER = 0x01,
  UI_PF = 0x02,
  POWER_0H = 0x03,
  PMAX_NEAREST = 0x04,
  TU_TI = 0x05,

  READ_TIME = 0x11,
  SYNC_TIME = 0x12,
  SEARCH_METER = 0x13,
  INIT_RF_MODULE = 0x14,
  RESET_RF_MODULE = 0x15,
  READ_VERSION = 0x16,
  READ_CE18_BY_REPEATER = 0x17,
  CMD_SYNC_TIME = 0x18,

  FIND_BROADCAST = 0x1b,
  READ_ALL = 0x1c, // HHM
}

export type PropsDropdown = {
  label: string;
  value: number;
};

export type TYPE_METER = 'IEC' | 'DLMS' | null;

export type PropsCheckBox = {
  label: string;
  value: number | string;
  checked?: boolean;
};

type PropsMeter = {
  title: string;
  id: string;
  value: number;
  allowTypeRead: PropsCheckBox[];
};

type PropsLabelMeter =
  | 'CE-18G'
  | 'CE-18'
  | 'CE-14'
  | 'ME-40'
  | 'ME-41'
  | 'ME-42'
  | 'Elster'
  | 'Repeater';

export type PropsMeterSpecies = {
  'CE-18G': PropsMeter;
  'CE-18': PropsMeter;
  'CE-14': PropsMeter;
  'ME-40': PropsMeter;
  'ME-41': PropsMeter;
  'ME-42': PropsMeter;
  Elster: PropsMeter;
  Repeater: PropsMeter;
  Dcu: PropsMeter;
  Broadcast_Meter?: PropsMeter;
  HHM: PropsMeter;
  'not GELEX'?: string;
};

export enum ValueMeterDefine {
  CE18G = 0x01,
  CE18 = 0x02,
  CE14 = 0x03,
  ME40 = 0x04,
  ME41 = 0x05,
  ME42 = 0x06,
  REPEATER = 0x07,
  ELSTER = 0x08,
  DCU_RF = 0x09,
  BROADCAST_Meter = 0x10,
  HHM = 0x11,
}

export const meterSpecies: PropsMeterSpecies = {
  'CE-18G': {
    title: 'CE-18G',
    id: 'CE-18G',
    value: ValueMeterDefine.CE18G,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
    ],
  },
  'CE-18': {
    title: 'CE-18',
    id: 'CE-18',
    value: ValueMeterDefine.CE18,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
      {
        label: 'TGian',
        value: CommandRF.READ_TIME,
      },
    ],
  },
  'CE-14': {
    title: 'CE-14',
    id: 'CE-14',
    value: ValueMeterDefine.CE14,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
      {
        label: 'Pmax',
        value: CommandRF.PMAX_NEAREST,
      },
      {
        label: 'TGian',
        value: CommandRF.READ_TIME,
      },
    ],
  },
  'ME-40': {
    title: 'ME-40',
    id: 'ME-40',
    value: ValueMeterDefine.ME40,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
      {
        label: 'TGian',
        value: CommandRF.READ_TIME,
      },
    ],
  },
  'ME-41': {
    title: 'ME-41',
    id: 'ME-41',
    value: ValueMeterDefine.ME41,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
      {
        label: 'Pmax',
        value: CommandRF.PMAX_NEAREST,
      },
      {
        label: 'TU & TI',
        value: CommandRF.TU_TI,
      },
      {
        label: 'TGian',
        value: CommandRF.READ_TIME,
      },
    ],
  },

  'ME-42': {
    title: 'ME-42',
    id: 'ME-42',
    value: ValueMeterDefine.ME42,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
      {
        label: 'Pmax',
        value: CommandRF.PMAX_NEAREST,
      },
      {
        label: 'TGian',
        value: CommandRF.READ_TIME,
      },
    ],
  },
  Repeater: {
    title: 'Repeater',
    id: 'Repeater',
    value: ValueMeterDefine.REPEATER,
    allowTypeRead: [
      // {
      //   label: 'UI cosφ',
      //   value: CommandRF.UI_PF,
      // },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
    ],
  },
  Elster: {
    // giong 42DLMS
    title: 'Elster',
    id: 'Elster',
    value: ValueMeterDefine.ELSTER,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },
      {
        label: 'Pmax',
        value: CommandRF.PMAX_NEAREST,
      },
    ],
  },
  Dcu: {
    // giong 42DLMS
    title: 'Dcu',
    id: 'Dcu',
    value: ValueMeterDefine.DCU_RF,
    allowTypeRead: [
      {
        label: 'Rssi',
        value: CommandRF.SEARCH_METER,
      },
    ],
  },
  HHM: {
    title: 'Hữu Hồng',
    id: 'HHM',
    value: ValueMeterDefine.HHM,
    allowTypeRead: [
      {
        label: 'UI cosφ',
        value: CommandRF.UI_PF,
      },
      {
        label: 'Điện năng',
        value: CommandRF.INSTANT_POWER,
      },

      {
        label: 'Thông số vận hành',
        value: CommandRF.READ_ALL,
      },
    ],
  },
};

export const getMeterSpeciesDropDownProps = (): PropsDropdown[] => {
  const items: PropsDropdown[] = [];
  for (let i in meterSpecies) {
    const item: PropsDropdown = {
      label: meterSpecies[i].title,
      value: meterSpecies[i].id,
    };
    items.push(item);
  }
  return items;
};

export enum TYPE_READ_RF {
  HAVE_NOT_READ = '0',
  READ_SUCCEED = '1',
  WRITE_BY_HAND = '2',
  READ_FAILED = '3',
  ABNORMAL_CAPACITY = '4',
  ABNORMAL_UPPER = '5',
  ABNORMAL_LOWER = '6',
  ABNORMAL_NEGATIVE = '7',

  WRITE_BY_HAND_ABNORMAL_UPPER = '8',
  WRITE_BY_HAND_ABNORMAL_LOWER = '9',
  WRITE_BY_HAND_ABNORMAL_NEGATIVE = '10',
}

export function IsWriteByHand(typeRead: TYPE_READ_RF): boolean {
  if (
    typeRead === TYPE_READ_RF.WRITE_BY_HAND ||
    typeRead === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER ||
    typeRead === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER ||
    typeRead === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE
  ) {
    return true;
  }

  return false;
}
export function IsReadRFSucceed(typeRead: TYPE_READ_RF): boolean {
  if (
    typeRead === TYPE_READ_RF.READ_SUCCEED ||
    typeRead === TYPE_READ_RF.ABNORMAL_CAPACITY ||
    typeRead === TYPE_READ_RF.ABNORMAL_UPPER ||
    typeRead === TYPE_READ_RF.ABNORMAL_LOWER ||
    typeRead === TYPE_READ_RF.ABNORMAL_NEGATIVE
  ) {
    return true;
  }

  return false;
}
export function IsAbnormal(typeRead: TYPE_READ_RF): boolean {
  if (
    typeRead === TYPE_READ_RF.ABNORMAL_CAPACITY ||
    typeRead === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER ||
    typeRead === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER ||
    typeRead === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE ||
    typeRead === TYPE_READ_RF.ABNORMAL_UPPER ||
    typeRead === TYPE_READ_RF.ABNORMAL_LOWER ||
    typeRead === TYPE_READ_RF.ABNORMAL_NEGATIVE
  ) {
    return true;
  }

  return false;
}

export function GetColorDisplay(
  isChecked: boolean,
  typeReadRF: TYPE_READ_RF,
): string {
  let backgroundColor: string = 'white';
  if (isChecked === true) {
    backgroundColor = Colors.register.selected; //'#e3e6e8';
    //backgroundColor = 'pink';
  } else {
    if (typeReadRF === TYPE_READ_RF.HAVE_NOT_READ) {
      backgroundColor = Colors.register.notRead; //'white'; //'transparent';
    } else if (typeReadRF === TYPE_READ_RF.READ_FAILED) {
      backgroundColor = Colors.register.notRead;
    } else if (typeReadRF === TYPE_READ_RF.WRITE_BY_HAND) {
      backgroundColor = Colors.register.byHand;
    } else if (typeReadRF === TYPE_READ_RF.ABNORMAL_CAPACITY) {
      backgroundColor = '#f6f5a9';
    } else if (typeReadRF === TYPE_READ_RF.READ_SUCCEED) {
      backgroundColor = Colors.register.normal;
    } else if (
      typeReadRF === TYPE_READ_RF.ABNORMAL_UPPER ||
      typeReadRF === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER
    ) {
      backgroundColor = Colors.register.upper;
    } else if (
      typeReadRF === TYPE_READ_RF.ABNORMAL_LOWER ||
      typeReadRF === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER
    ) {
      backgroundColor = Colors.register.lower;
    } else if (
      typeReadRF === TYPE_READ_RF.ABNORMAL_NEGATIVE ||
      typeReadRF === TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE
    ) {
      backgroundColor = Colors.register.negative;
    }
  }

  return backgroundColor;
}

export function GetLoaiDocRFString(typeReadRF: TYPE_READ_RF): string {
  let str = '';

  switch (typeReadRF) {
    case TYPE_READ_RF.READ_SUCCEED:
      str = 'Đọc RF, thành công';
      break;
    case TYPE_READ_RF.READ_FAILED:
      str = 'Đọc RF, thất bại';
      break;
    case TYPE_READ_RF.HAVE_NOT_READ:
      str = 'Chưa đọc';
      break;
    case TYPE_READ_RF.ABNORMAL_UPPER:
      str = 'Đọc RF, Bất thường vượt nggưỡng trên';
      break;
    case TYPE_READ_RF.ABNORMAL_LOWER:
      str = 'Đọc RF, Bất thường vượt ngưỡng dưới';
      break;
    case TYPE_READ_RF.ABNORMAL_NEGATIVE:
      str = 'Đọc RF, Sản lượng âm';
      break;
    case TYPE_READ_RF.WRITE_BY_HAND:
      str = 'Ghi tay';
      break;
    case TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_UPPER:
      str = 'Ghi tay, Bất thường vượt ngưỡng trên';
      break;
    case TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_LOWER:
      str = 'Ghi tay, Bất thường vượt ngưỡng dưới';
      break;
    case TYPE_READ_RF.WRITE_BY_HAND_ABNORMAL_NEGATIVE:
      str = 'Ghi tay, Sản lượng âm';
      break;
    default:
      str = typeReadRF;
  }

  return str;
}

export function GetVersionMeterString(RF: string): string {
  let str = '';

  switch (RF) {
    case VersionMeter.DLMS_MANY_CHANEL:
      str = 'DLMS v1';
      break;
    case VersionMeter.DLMS_ONE_CHANEL:
      str = 'DLMS v2';
      break;
    case VersionMeter.IEC:
      str = 'IEC';
      break;

    default:
      str = RF;
  }

  return str;
}

type PropsPowerDetail = {
  id: string;
  extraTitle: PropsExtraLabelPower | PropsExtraLabelPower[];
  value: number;
  titlePmax?: PropsLabelMaxDemand;
};

export const VALUE_TYPE_METER = {
  DLMS_16C: 0x01,
  DLMS_1C: 0x02,
  IEC: 0x03,
};

type PROPS_POWER_DEFINE = {
  '180': PropsPowerDetail;
  '181': PropsPowerDetail;
  '182': PropsPowerDetail;
  '183': PropsPowerDetail;
  '280': PropsPowerDetail;
  '281': PropsPowerDetail;
  '282': PropsPowerDetail;
  '283': PropsPowerDetail;
  '380': PropsPowerDetail;
  '480': PropsPowerDetail;
};

export type KEY_POWERS = keyof PROPS_POWER_DEFINE;

export function getExtraTitleByNameObis(obis: KEY_POWERS): string | string[] {
  let ret: string | string[] = 'KT';
  for (let keyBscObj in POWER_DEFINE) {
    let key = keyBscObj as keyof typeof POWER_DEFINE;
    const bcsObj: PropsPowerDetail = POWER_DEFINE[key];
    if (bcsObj.id === obis) {
      ret = bcsObj.extraTitle;
      break;
    }

    // if(typeof bcsObj.extraTitle === 'string')
    // {
    //         if(bcsObj.extraTitle === extraTitle)
    //         {
    //                 return bcsObj.id;
    //         }
    // }else{

    // }
    // break;
    //bscObj.
    //if(typeof bscObj. === 'string')
  }

  return ret;
}

export const POWER_DEFINE: PROPS_POWER_DEFINE = {
  '180': {
    id: '180',
    value: 0,
    extraTitle: ['KT', 'SG'],
    titlePmax: '1601',
  },
  '181': {
    id: '181',
    value: 1,
    extraTitle: 'BT',
    titlePmax: '1611',
  },
  '182': {
    id: '182',
    value: 2,
    extraTitle: 'CD',
    titlePmax: '1621',
  },
  '183': {
    id: '183',
    value: 3,
    extraTitle: 'TD',
    titlePmax: '1631',
  },
  '280': {
    id: '280',
    value: 4,
    extraTitle: 'SN',
    titlePmax: '2601',
  },
  '281': {
    id: '281',
    value: 5,
    extraTitle: 'BN',
    titlePmax: '2611',
  },
  '282': {
    id: '282',
    value: 6,
    extraTitle: 'CN',
    titlePmax: '2621',
  },
  '283': {
    id: '283',
    value: 7,
    extraTitle: 'TN',
    titlePmax: '2631',
  },
  '380': {
    id: '380',
    value: 8,
    extraTitle: 'VC',
  },
  '480': {
    id: '480',
    value: 9,
    extraTitle: 'VN',
  },
};

// CE18G: 576,575,432,121,340,B26,D26,424,421
// CE18: 654,B10,B48,B11,B61,B29,B73,B74,B72
// CE14: 416,D23,M3B
// ME40: 655,D65,D66
// ME41: 304,F92
// ME42: 305,D73,F98,D70
// Elster: 790,636,772,773,577,632,755,770,771

export const getLabelAndIsManyPriceByCodeMeter = (
  codeMeter: string,
  seri: string,
): { label: keyof PropsMeterSpecies; isManyPrice: boolean } => {
  const result: {
    label: keyof PropsMeterSpecies;
    isManyPrice: boolean;
  } = {
    label: 'not GELEX',
    isManyPrice: true,
  };

  const maCongToStrage = GetObjMaCongToFromStorage();

  let findCharacter: string = '';
  let bFound = false;

  findCharacter = codeMeter.substring(0, 3);
  for (let item in maCongToStrage.data) {
    //@ts-expect-error
    const arrMaCongto = maCongToStrage.data[item];
    for (let code of arrMaCongto) {
      if (code === findCharacter) {
        const label = item as keyof PropsMeterSpecies;
        result.label = label;
        bFound = true;
        break;
      }
    }
    if (bFound) {
      break;
    }
  }

  if (bFound === false) {
    findCharacter = codeMeter.substring(0, 4);
    for (let item in maCongToStrage.data) {
      //@ts-expect-error
      const arrMaCongto = maCongToStrage.data[item];
      for (let code of arrMaCongto) {
        if (code === findCharacter) {
          const label = item as keyof PropsMeterSpecies;
          result.label = label;
          bFound = true;
          break;
        }
      }
      if (bFound) {
        break;
      }
    }
  }

  switch (result.label) {
    case 'CE-18G':
      result.isManyPrice = false;
      break;
    case 'CE-18':
      result.isManyPrice = false;
      break;
    case 'CE-14':
      result.isManyPrice = true;
      break;
    case 'ME-40':
      result.isManyPrice = false;
      break;
    case 'ME-41':
      result.isManyPrice = true;
      break;
    case 'ME-42':
      result.isManyPrice = true;
      break;
    case 'Elster':
      result.isManyPrice = true;
      break;
    case 'not GELEX':
      const ret = GetTypeMeterAndPhase(seri);
      result.isManyPrice = true;
      break;
  }

  return result;
};

export function getTypeMeterBySerial(
  strSeri: string,
  // label: keyof PropsMeterSpecies,
): VersionMeterValue {
  let ret: VersionMeterValue = VersionMeter.DLMS_ONE_CHANEL;
  const seri = Number(strSeri);
  let flagFound: Boolean = false;

  //**note: do not chang sequence of compare, if want to add new condition, new condition must be add at bottom */

  //console.log('seri:', seri);
  for (let item of dataDBMatchSeriVersion) {
    if (seri >= item.min && seri <= item.max) {
      ret = item.version;
      flagFound = true;
      // if (seri === 18028758) {
      //   console.log('item:', item);
      // }
    }
  }

  // if (seri === 18028758) {
  //   console.log('flagFound:', flagFound);
  // }

  if (flagFound === false) {
    if (seri >= 20000000) {
      ret = VersionMeter.IEC;
    } else {
      ret = VersionMeter.DLMS_ONE_CHANEL;
    }
  }

  // if (label === 'Elster') {
  //   ret = VersionMeter.DLMS_ONE_CHANEL;
  // }

  return ret;
}

// export function getTypeMeterBySerial(strSeri: string): VersionMeterValue {
//   let ret: VersionMeterValue = VersionMeter.DLMS_ONE_CHANEL;
//   const seri = Number(strSeri);
//   let flagFound: Boolean = false;

//   //**note: do not chang sequence of compare, if want to add new condition, new condition must be add at bottom */

//   if (
//     (seri >= 11000000 && seri <= 17034900) ||
//     (seri >= 20747915 && seri <= 20750914) ||
//     (seri >= 20471997 && seri <= 20473996) ||
//     (seri >= 20468997 && seri <= 20471996) ||
//     (seri >= 18002501 && seri <= 18062500) ||
//     (seri >= 17076801 && seri <= 17156800) ||
//     (seri >= 17034901 && seri <= 17035280) ||
//     (seri >= 17172801 && seri <= 17303884) ||
//     (seri >= 18063501 && seri <= 18083183) ||
//     (seri >= 18083185 && seri <= 18089750) ||
//     (seri >= 18063301 && seri <= 18063404) ||
//     (seri >= 17306001 && seri <= 17306894) ||
//     (seri >= 18144601 && seri <= 18144735) ||
//     (seri >= 18000501 && seri <= 18001600) ||
//     (seri >= 17165701 && seri <= 17172278) ||
//     (seri >= 18144801 && seri <= 18145132)
//   ) {
//     ret = VersionMeter.DLMS_MANY_CHANEL;
//     flagFound = true;
//   }
//   if (
//     (seri >= 18091801 && seri <= 18141800) ||
//     (seri >= 18203601 && seri <= 18233100) ||
//     (seri >= 18141801 && seri <= 18141832) ||
//     (seri >= 18270001 && seri <= 18320000) ||
//     (seri >= 18322201 && seri <= 18332200) ||
//     (seri >= 19000501 && seri <= 19040500) ||
//     (seri >= 19052201 && seri <= 19073700) ||
//     (seri >= 19073701 && seri <= 19186200) ||
//     (seri >= 19186202 && seri <= 19186301) ||
//     (seri >= 19193700 && seri <= 19194199) ||
//     (seri >= 19195001 && seri <= 19195600) ||
//     (seri >= 19274381 && seri <= 19396220) ||
//     (seri >= 19606313 && seri <= 19606357) ||
//     (seri >= 19195601 && seri <= 19250600) ||
//     (seri >= 19403283 && seri <= 19463282) ||
//     (seri >= 19466489 && seri <= 19467488) ||
//     (seri >= 19467520 && seri <= 19527519) ||
//     (seri >= 19945340 && seri <= 19946269) ||
//     (seri >= 19951278 && seri <= 19953277) ||
//     (seri >= 20000001 && seri <= 20060000) ||
//     (seri >= 20742915 && seri <= 20747914) ||
//     (seri >= 20698231 && seri <= 20701230) ||
//     (seri >= 20656101 && seri <= 20658100) ||
//     (seri >= 20484198 && seri <= 20484397) ||
//     (seri >= 20478928 && seri <= 20482497) ||
//     (seri >= 20395116 && seri <= 20395125) ||
//     (seri >= 20395126 && seri <= 20395215) ||
//     (seri >= 20395114 && seri <= 20395114) ||
//     (seri >= 20395423 && seri <= 20396022) ||
//     (seri >= 20390283 && seri <= 20392282) ||
//     (seri >= 18256801 && seri <= 18257300) ||
//     (seri >= 18234001 && seri <= 18235500) ||
//     (seri >= 18256301 && seri <= 18256500) ||
//     (seri >= 19044103 && seri <= 19044103) ||
//     (seri >= 19192500 && seri <= 19193695) ||
//     (seri >= 20792227 && seri <= 20792526) ||
//     (seri >= 20698016 && seri <= 20698215) ||
//     (seri >= 20473998 && seri <= 20474497) ||
//     (seri >= 20434763 && seri <= 20434861) ||
//     (seri >= 20468996 && seri <= 20468996) ||
//     (seri >= 20395216 && seri <= 20395216) ||
//     (seri >= 20395115 && seri <= 20395115) ||
//     (seri >= 20396023 && seri <= 20396055) ||
//     (seri >= 18242001 && seri <= 18252000) ||
//     (seri >= 18258401 && seri <= 18262824) ||
//     (seri >= 18262901 && seri <= 18263526) ||
//     (seri >= 19192400 && seri <= 19192499) ||
//     (seri >= 19194901 && seri <= 19195000) ||
//     (seri >= 19250601 && seri <= 19252600) ||
//     (seri >= 19258679 && seri <= 19272678) ||
//     (seri >= 20741915 && seri <= 20742414) ||
//     (seri >= 20697362 && seri <= 20697515) ||
//     (seri >= 20790927 && seri <= 20791726) ||
//     (seri >= 20395413 && seri <= 20395422) ||
//     (seri >= 20832530 && seri <= 20832562) ||
//     (seri >= 20698216 && seri <= 20698230) ||
//     (seri >= 20482498 && seri <= 20482953) ||
//     (seri >= 20395217 && seri <= 20395221) ||
//     (seri >= 20395113 && seri <= 20395113) ||
//     (seri >= 20395223 && seri <= 20395422) ||
//     (seri >= 20389583 && seri <= 20389782) ||
//     (seri >= 20381221 && seri <= 20381720) ||
//     (seri >= 20330073 && seri <= 20330320) ||
//     (seri >= 10000020 && seri <= 10000030) ||
//     (seri >= 18336001 && seri <= 18338700) ||
//     (seri >= 19194701 && seri <= 19194900) ||
//     (seri >= 19463283 && seri <= 19463787) ||
//     (seri >= 20132492 && seri <= 20136491) ||
//     (seri >= 20791727 && seri <= 20792226) ||
//     (seri >= 20697516 && seri <= 20698015) ||
//     (seri >= 20406489 && seri <= 20406490) ||
//     (seri >= 20406542 && seri <= 20406555) ||
//     (seri >= 20624836 && seri <= 20624874) ||
//     (seri >= 20482998 && seri <= 20483497) ||
//     (seri >= 20406056 && seri <= 20406555) ||
//     (seri >= 20389783 && seri <= 20390282) ||
//     (seri >= 20742415 && seri <= 20742914) ||
//     (seri >= 20483565 && seri <= 20483997) ||
//     (seri >= 20395222 && seri <= 20395222) ||
//     (seri >= 20394913 && seri <= 20395112) ||
//     (seri >= 20194292 && seri <= 20194791)
//   ) {
//     ret = VersionMeter.DLMS_ONE_CHANEL;
//     flagFound = true;
//   }
//   if (
//     (seri >= 19545940 && seri <= 19600939) ||
//     (seri >= 19957352 && seri <= 19958351) ||
//     (seri >= 19540940 && seri <= 19545939) ||
//     (seri >= 19946294 && seri <= 19950204) ||
//     (seri >= 19950205 && seri <= 19950777) ||
//     (seri >= 19991951 && seri <= 19992850) ||
//     (seri >= 19674597 && seri <= 19729596) ||
//     (seri >= 19670420 && seri <= 19674596) ||
//     (seri >= 19619453 && seri <= 19670419) ||
//     (seri >= 19965152 && seri <= 19966151) ||
//     (seri >= 19531330 && seri <= 19535529) ||
//     (seri >= 19953278 && seri <= 19955621) ||
//     (seri >= 19958952 && seri <= 19960651) ||
//     (seri >= 19992851 && seri <= 19993283) ||
//     (seri >= 19619453 && seri <= 19670419) ||
//     (seri >= 19965152 && seri <= 19966151) ||
//     (seri >= 19531330 && seri <= 19535529) ||
//     (seri >= 19953278 && seri <= 19955621) ||
//     (seri >= 19958952 && seri <= 19960651) ||
//     (seri >= 19992851 && seri <= 19993283) ||
//     (seri >= 19784457 && seri <= 19793456) ||
//     (seri >= 19899340 && seri <= 19945339) ||
//     (seri >= 19966172 && seri <= 19968196) ||
//     (seri >= 19729597 && seri <= 19734321) ||
//     (seri >= 19962152 && seri <= 19965151) ||
//     (seri >= 19960652 && seri <= 19962151) ||
//     (seri >= 19994284 && seri <= 19994883)
//   ) {
//     ret = VersionMeter.IEC;
//     flagFound = true;
//   }

//   if (flagFound === false) {
//     if (seri >= 20000000) {
//       ret = VersionMeter.IEC;
//     } else {
//       ret = VersionMeter.DLMS_ONE_CHANEL;
//     }
//   }

//   return ret;
// }
