

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
  STATUS : PropsCell;
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
  STATUS: {
    id: 'STATUS',
  },
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

const getFiledMeter= (): string[] => {
  const fields: string[] = [];
  for (let i in dumy) {
    fields.push(i);
  }
  return fields;
};

export const MeterModelFields = getFiledMeter();
