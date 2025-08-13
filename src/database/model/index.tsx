import { PropsAddMoreEntity } from '../entity';

type PropsCell = {
  id: keyof PropsTable;
};

type PropsTable = {
  METER_NO: PropsCell;
  METER_NAME: PropsCell;
  METER_MODEL_DESC: PropsCell;
  MODULE_NO: PropsCell;
  CUSTOMER_CODE : PropsCell;
  CUSTOMER_NAME : PropsCell;
  ADDRESS : PropsCell ; 
  PHONE : PropsCell ; 
  EMAIL : PropsCell ; 
  CREATED : PropsCell ;
  LINE_NAME : PropsCell ;
  COORDINATE : PropsCell ; 
  LINE_ID : PropsCell;
  METER_MODEL_ID: PropsCell;
  
};

export const dataDBTabel: PropsTable = {
  METER_NO: {
    id: 'METER_NO',
  },
  METER_NAME: {
    id: 'METER_NAME',
  },
  METER_MODEL_DESC: {
    id: 'METER_MODEL_DESC',
  },
  MODULE_NO: {
    id: 'MODULE_NO',
  },
  CUSTOMER_CODE: {
    id: 'CUSTOMER_CODE',
  },
  CUSTOMER_NAME: {
    id: 'CUSTOMER_NAME',
  },
  ADDRESS: {
    id: 'ADDRESS',
  },
  PHONE: {
    id: 'PHONE',
  },
  EMAIL: {
    id: 'EMAIL',
  },
  CREATED: {
    id: 'CREATED',
  },
  LINE_NAME: {
    id: 'LINE_NAME',
  },
  COORDINATE: {
    id: 'COORDINATE',
  },
  LINE_ID: {
    id: 'LINE_ID',
  },
  METER_MODEL_ID: {
    id: 'METER_MODEL_ID',
  },
};

export type PropsKHCMISModel = {
  MA_KHANG: string;
  MA_QUYEN: string;
  MA_TRAM: string;
  LOAI_BCS: string;
  TEN_KHANG: string;
  DIA_CHI: string;
  MA_CTO: string;
  SERY_CTO: string;
  CS_CU: number;
  SL_CU: number;
  SL_TTIEP: number;
  CS_MOI: number;
  SL_MOI: number;
  NGAY_MOI: string;
  MA_COT: string;
  PMAX: number;
  NGAY_PMAX: string;
  X: string;
  Y: string;
  KY: string;
  THANG: string;
  NAM: string;
  MA_DVIQLY: string;
  MA_GC: string;
  MA_NVGCS: string;
} & Omit<PropsAddMoreEntity, 'image' | 'idFile'>;

const dumy: PropsKHCMISModel = {
  MA_KHANG: '',
  MA_QUYEN: '',
  MA_TRAM: '',
  LOAI_BCS: '',
  TEN_KHANG: '',
  DIA_CHI: '',
  MA_CTO: '',
  SERY_CTO: '',
  CS_CU: 0,
  SL_CU: 0,
  SL_TTIEP: 0,
  CS_MOI: 0,
  SL_MOI: 0,
  NGAY_MOI: '',
  MA_COT: '',
  PMAX: 0,
  NGAY_PMAX: '',
  RF: '1',
  LoaiDoc: '',
  GhiChu: '',
  X: '',
  Y: '',
  KY: '',
  THANG: '',
  NAM: '',
  MA_DVIQLY: '',
  MA_GC: '',
  MA_NVGCS: '',
  
  TT: 0,
  id: '',
  loginMode: 'KH Lẻ',
  isSent: '0',
  latitude: '',
  longtitude: '',
  hasImage: '0',
};

export type PropsTypeOf =
  | 'undefined'
  | 'object'
  | 'boolean'
  | 'number'
  | 'bigint'
  | 'string'
  | 'symbol'
  | 'function'
  | 'object';

export const getTypeOfColumn = (id: string): PropsTypeOf => {
  //@ts-expect-error
  return typeof dumy[id];
};

export type PropsPercentRead = {
  readSucceed: number;
  haveNotRead: number;
  readFailed: number;
  writeByHand: number;
  abnormalRead: number;
  abnormalUpper: number;
  abnormalLower: number;
  abnormalNegative: number;
};

const getFiledKHCMIS = (): string[] => {
  const fields: string[] = [];
  for (let i in dumy) {
    fields.push(i);
  }
  return fields;
};

export const KHCMISModelFields = getFiledKHCMIS();
