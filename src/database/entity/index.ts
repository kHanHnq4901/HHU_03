import { PropsXmlModel } from '../../xml';
import { VersionMeter, VersionMeterValue } from '../../service/hhu/defineEM';
import { LoginModeType } from '../../service/storage';

export type PropsAddMoreEntity = {
  TT: number;
  id: string;
  RF: VersionMeterValue;
  LoaiDoc: string;
  GhiChu: string;
  loginMode: LoginModeType;
  isSent: '0' | '1';
  latitude: string;
  longtitude: string;
  image: string;
  hasImage: '0' | '1';
  idFile: string;
};
export type PropsMeterModel = {
  LoaiDoc: TYPE_READ_RF;
  isSent: string;
  loginMode: string;
  MA_QUYEN: any;
  MA_TRAM: any;
  RF: string;
  LOAI_BCS: string;
  SERY_CTO: string;
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
};
export type PropsInfoMeterEntity = PropsMeterModel;

export const TABLE_NAME = 'INFO_METER';

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
