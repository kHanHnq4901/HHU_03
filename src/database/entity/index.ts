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

export type PropsKHCMISEntity = PropsXmlModel & PropsAddMoreEntity;

export const TABLE_NAME = 'KHCMIS';

export const dumyEntity: PropsKHCMISEntity = {
  MA_NVGCS: '',
  MA_KHANG: '',
  MA_DDO: '',
  MA_DVIQLY: '',
  MA_GC: '',
  MA_QUYEN: '',
  MA_TRAM: '',
  BOCSO_ID: '',
  LOAI_BCS: '',
  LOAI_CS: '',
  TEN_KHANG: '',
  DIA_CHI: '',
  MA_NN: '',
  SO_HO: '',
  MA_CTO: '',
  SERY_CTO: '',
  HSN: '',
  CS_CU: '',
  TTR_CU: '',
  SL_CU: '',
  SL_TTIEP: '',
  NGAY_CU: '',
  CS_MOI: '',
  TTR_MOI: '',
  SL_MOI: '',
  CHUOI_GIA: '',
  KY: '',
  THANG: '',
  NAM: '',
  NGAY_MOI: '',
  NGUOI_GCS: '',
  SL_THAO: '',
  KIMUA_CSPK: '',
  MA_COT: '',
  SLUONG_1: '',
  SLUONG_2: '',
  SLUONG_3: '',
  SO_HOM: '',
  PMAX: '',
  NGAY_PMAX: '',
  X: '',
  Y: '',
  Z: '',

  TT: 0,
  id: '',
  RF: '1',
  LoaiDoc: '',
  GhiChu: '',
  loginMode: 'KH Lẻ',
  isSent: '0',
  latitude: '',
  longtitude: '',
  image: '',
  hasImage: '0',
  idFile: '',
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
