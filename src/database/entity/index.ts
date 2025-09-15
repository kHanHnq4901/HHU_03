export const TABLE_NAME_INFO_METER = 'INFO_METER';
export const TABLE_NAME_INFO_LINE = 'INFO_LINE';
export const TABLE_NAME_METER_DATA = 'METER_DATA';
export const TABLE_NAME_METER_HISTORY = 'METER_HISTORY';
export type PropsMeterDataModel = {
  METER_NO : string; 
  TIMESTAMP : string;
  IMPORT_DATA : string;
  EXPORT_DATA: string; 
  EVENT : string;
  BATTERY : string;
  PERIOD : string;
}
export type PropsHistoryMeterDataModel = {
  METER_NO : string; 
  TIMESTAMP : string;
  DATA_RECORD : string
}
export type PropsLineModel = {
  LINE_ID : string;
  LINE_NAME : string ;
  ADDRESS : string ;
  CODE : string ; 
};
export type PropsMeterModel = {
  METER_NO: string;
  METER_NAME: string;
  METER_MODEL_DESC: string;
  MODULE_NO: string;
  CUSTOMER_CODE : string;
  CUSTOMER_NAME : string;
  ADDRESS : string ; 
  PHONE : string ; 
  EMAIL : string ; 
  CREATED : string ;
  LINE_NAME : string ;
  COORDINATE : string ; 
  LINE_ID : string;
  METER_MODEL_ID: string;
  STATUS : string; 
};
export type PropsInfoMeterEntity = PropsMeterModel;

export const dumyEntity: PropsInfoMeterEntity = {
  METER_NO: '',
  METER_NAME: '',
  METER_MODEL_DESC: '',
  MODULE_NO: '',
  CUSTOMER_CODE : '',
  CUSTOMER_NAME : '',
  ADDRESS : '',
  PHONE : '',
  EMAIL : '',
  CREATED : '',
  LINE_NAME : '',
  COORDINATE : '',
  LINE_ID : '',
  METER_MODEL_ID: '',
  STATUS : ''
};

export function GetStringSelectEntity() {
  let str = '';
  for (let key in dumyEntity) {
    if (key === 'image') {
      continue;
    }
    str += key;
    str += ',';
  }
  str = str.slice(0, str.length - 1);
  return str;
}
