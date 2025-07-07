export enum enumDataType {
  Energy_DataType,
  Energy_DataType_180,
  Energy_All_DataType,
  Energy_T1_DataType,
  Energy_T2_DataType,
  Energy_T3_DataType,
  Energy_T1_DataType_180, //181
  Energy_T2_DataType_180,
  Energy_T3_DataType_180,
  Energy_T4_DataType,
  Energy_VC_DataType,
  Demand_DataType,
  Demand_T1_DataType,
  Demand_T2_DataType,
  Demand_T3_DataType,
  Demand_T4_DataType,
  Demand_VC_DataType,
  Curerent_DataType,
  Voltage_DataType,
  Curerent_DataType_A,
  Voltage_DataType_A,
  Curerent_DataType_B,
  Voltage_DataType_B,
  Curerent_DataType_C,
  Voltage_DataType_C,
  GroupData_DataType,
  GroupData_DataType_2,
  ReactivePower_DataType,
  Version_DataType,
  Set50_70,
  CT_Numerator,
  VT_Numerator,
  CT_Denominator,
  VT_Denominator,
  CT_Value,
  VT_Value,
  Tamper_Times,
}
export function ConvertEnumDataTypeToString(enumDType: enumDataType): string {
  let str = 'unknown';

  switch (enumDType) {
    case enumDataType.Energy_DataType:
      str = 'Energy_DataType';
      break;
    case enumDataType.Energy_DataType_180:
      str = 'Energy_DataType_180';
      break;
    case enumDataType.Energy_All_DataType:
      str = 'Energy_All_DataType';
      break;
    case enumDataType.Energy_T1_DataType:
      str = 'Energy_T1_DataType';
      break;
    case enumDataType.Energy_T2_DataType:
      str = 'Energy_T2_DataType';
      break;
    case enumDataType.Energy_T3_DataType:
      str = 'Energy_T3_DataType';
      break;
    case enumDataType.Energy_T1_DataType_180:
      str = 'Energy_T1_DataType_180';
      break;
    case enumDataType.Energy_T2_DataType_180:
      str = 'Energy_T2_DataType_180';
      break;
    case enumDataType.Energy_T3_DataType_180:
      str = 'Energy_T3_DataType_180';
      break;
    case enumDataType.Energy_T4_DataType:
      str = 'Energy_T4_DataType';
      break;
    case enumDataType.Energy_VC_DataType:
      str = 'Energy_VC_DataType';
      break;
    case enumDataType.Demand_DataType:
      str = 'Demand_DataType';
      break;
    case enumDataType.Demand_T1_DataType:
      str = 'Demand_T1_DataType';
      break;
    case enumDataType.Demand_T2_DataType:
      str = 'Demand_T2_DataType';
      break;
    case enumDataType.Demand_T3_DataType:
      str = 'Demand_T3_DataType';
      break;
    case enumDataType.Demand_T4_DataType:
      str = 'Demand_T4_DataType';
      break;
    case enumDataType.Demand_VC_DataType:
      str = 'Demand_VC_DataType';
      break;
    case enumDataType.Curerent_DataType:
      str = 'Curerent_DataType';
      break;
    case enumDataType.Voltage_DataType:
      str = 'Voltage_DataType';
      break;
    case enumDataType.Curerent_DataType_A:
      str = 'Curerent_DataType_A';
      break;
    case enumDataType.Voltage_DataType_A:
      str = 'Voltage_DataType_A';
      break;
    case enumDataType.Curerent_DataType_B:
      str = 'Curerent_DataType_B';
      break;
    case enumDataType.Voltage_DataType_B:
      str = 'Voltage_DataType_B';
      break;
    case enumDataType.Curerent_DataType_C:
      str = 'Curerent_DataType_C';
      break;
    case enumDataType.Voltage_DataType_C:
      str = 'Voltage_DataType_C';
      break;
    case enumDataType.GroupData_DataType:
      str = 'GroupData_DataType';
      break;
    case enumDataType.GroupData_DataType_2:
      str = 'GroupData_DataType_2';
      break;
    case enumDataType.ReactivePower_DataType:
      str = 'ReactivePower_DataType';
      break;
    case enumDataType.Version_DataType:
      str = 'Version_DataType';
      break;
    case enumDataType.Set50_70:
      str = 'Set50_70';
      break;
    case enumDataType.CT_Numerator:
      str = 'CT_Numerator';
      break;
    case enumDataType.VT_Numerator:
      str = 'VT_Numerator';
      break;
    case enumDataType.CT_Denominator:
      str = 'CT_Denominator';
      break;
    case enumDataType.VT_Denominator:
      str = 'VT_Denominator';
      break;
    case enumDataType.CT_Value:
      str = 'CT_Value';
      break;
    case enumDataType.VT_Value:
      str = 'VT_Value';
      break;
    case enumDataType.Tamper_Times:
      str = 'Tamper_Times';
      break;
  }

  return str;
}
