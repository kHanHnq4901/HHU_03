export enum METERTYPE {
  CPC_DTO1P = 10,
  CPC_DTO1P80 = 11,
  CPC_DTO3P = 12,
  CPC_PWD = 0x12,
  DDS26_GELEX = 0x11,
  DTS27_645 = 3,
  DTS27_645_07 = 15,
  DTS27_ELSTER = 0x10,
  DTS27_RF = 6,
  DTS27_VN31 = 13,
  DTS27_X329 = 14,
  LTE66 = 2,
  MESH_RF = 5,
  MESH_RF_180 = 0x13,
  PTP_RF = 1,
}

export function ConvertTypeMeterToString(meterType: METERTYPE): string {
  let meterTypeStr = '';

  switch (meterType) {
    case METERTYPE.CPC_DTO1P:
      meterTypeStr = 'CPC_DTO1P';
      break;
    case METERTYPE.CPC_DTO1P80:
      meterTypeStr = 'CPC_DTO1P80';
      break;
    case METERTYPE.CPC_DTO3P:
      meterTypeStr = 'CPC_DTO3P';
      break;
    case METERTYPE.CPC_PWD:
      meterTypeStr = 'CPC_PWD';
      break;
    case METERTYPE.DDS26_GELEX:
      meterTypeStr = 'DDS26_GELEX';
      break;
    case METERTYPE.DTS27_645:
      meterTypeStr = 'DTS27_645';
      break;
    case METERTYPE.DTS27_645_07:
      meterTypeStr = 'DTS27_645_07';
      break;
    case METERTYPE.DTS27_ELSTER:
      meterTypeStr = 'DTS27_ELSTER';
      break;
    case METERTYPE.DTS27_RF:
      meterTypeStr = 'DTS27_RF';
      break;
    case METERTYPE.DTS27_VN31:
      meterTypeStr = 'DTS27_VN31';
      break;
    case METERTYPE.DTS27_X329:
      meterTypeStr = 'DTS27_X329';
      break;
    case METERTYPE.LTE66:
      meterTypeStr = 'LTE66';
      break;
    case METERTYPE.MESH_RF:
      meterTypeStr = 'MESH_RF';
      break;
    case METERTYPE.MESH_RF_180:
      meterTypeStr = 'MESH_RF_180';
      break;
    case METERTYPE.PTP_RF:
      meterTypeStr = 'PTP_RF';
      break;
  }

  return meterTypeStr;
}
