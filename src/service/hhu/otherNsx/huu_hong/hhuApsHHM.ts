import { PropsCommonResponse } from '../../../api';
import { PropsResponse } from '../../aps/hhuAps';
import { CommandRF, KEY_POWERS, getExtraTitleByNameObis } from '../../defineEM';
import { PropsReadSTClass, ReadSTClass } from './ReadMeterST/ReadSTClass';
import { GetByteArrayFromString } from '../../../../util/index';
import { getArrDataFromStringHHM } from './util';
import { bool, long, uint8_t } from '../../define';
import { Convert } from '../../aps/util';
import { ConvertTypeMeterToString, METERTYPE } from './ReadMeterST/METERTYPE';
import { MyGloab } from './ReadMeterST/MyGloab';
import { METER_PHASE } from './ReadMeterST/METER_PHASE';
import { enumDataType } from './ReadMeterST/enumDataType';
import { InitSTARMeter } from '../../hhuFunc';

const TAG = 'hhuApsHHM: ';

const obj: {
  myReadST: ReadSTClass | null;
} = {
  myReadST: null,
};

export function HhuApsHHM_Init(props: PropsReadSTClass) {
  if (obj.myReadST === null) {
    console.log('HhuApsHHM_Init ...');
    obj.myReadST = new ReadSTClass(props);
    // console.log('HhuApsHHM_Init:', obj.myReadST);
  }
}
type PropsReadStar = {
  seri: string;
  callBackReadDoneOnePara?: (rest: PropsResponse) => void;
};

type PropsHhuApsRead = {
  cmd: CommandRF;
} & PropsReadStar;

export async function HhuApsHHMRead(
  props: PropsHhuApsRead,
): Promise<PropsResponse> {
  let rest: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };

  switch (props.cmd) {
    case CommandRF.UI_PF:
      rest = await ReadUI({
        seri: props.seri,
        callBackReadDoneOnePara: props.callBackReadDoneOnePara,
      });

      break;
    case CommandRF.INSTANT_POWER:
      rest = await ReadPower({
        seri: props.seri,
        callBackReadDoneOnePara: props.callBackReadDoneOnePara,
      });
      //console.log(TAG, 're: ', ret);

      break;
    case CommandRF.READ_ALL:
      rest = await ReadTSVH({
        seri: props.seri,
        callBackReadDoneOnePara: props.callBackReadDoneOnePara,
      });
      break;
    case CommandRF.TU_TI:
      break;
    case CommandRF.PMAX_NEAREST:
      break;
    default:
      rest.strMessage = 'no support command';
  }

  return rest;
}

type PropsReadRF = {
  typeRead: enumDataType;
  seri: string;
};

async function _ReadRF(props: PropsReadRF): Promise<PropsResponse> {
  let rest: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };

  if (!obj.myReadST) {
    InitSTARMeter();
  }

  if (obj.myReadST) {
    obj.myReadST.strSERY_CTO = props.seri;

    obj.myReadST.hasResultString = false;
    obj.myReadST.resultStringFromBuffRec = '';

    if (obj.myReadST) {
      obj.myReadST.desiredSeri = props.seri;
      obj.myReadST.desiredTypeRead = props.typeRead;
      obj.myReadST.response = {
        bSucceed: false,
        strMessage: '',
        obj: {},
      };
      try {
        obj.myReadST?.InitParameterByAddr();
        await obj.myReadST.GetOneDataType(props.typeRead);
        return obj.myReadST.response;
        //}
      } catch {
      } finally {
      }
    }
  }

  return rest;
}

type PropsShowScreen = {
  rest: PropsResponse;
  callBackReadDoneOnePara?: (rest: PropsResponse) => void;
  currentIndexInArrDataType: number;
  nameReadingData: string;
  dataTypes: enumDataType[];
};

function ProcessShowScreen(props: PropsShowScreen) {
  const _rest = props.rest;
  const i = props.currentIndexInArrDataType;
  const dataTypes = props.dataTypes;

  if (props.callBackReadDoneOnePara) {
    if (_rest.bSucceed) {
      if (i !== dataTypes.length - 1) {
        _rest.strMessage =
          'Đọc thành công. Đang đọc tiếp ' +
          (dataTypes.length - i - 1) +
          ' đại lượng ...';
      } else {
        _rest.strMessage = 'Đọc xong ' + props.nameReadingData;
      }
    } else {
      if (i !== dataTypes.length - 1) {
        _rest.strMessage +=
          '. Đang đọc tiếp ' + (dataTypes.length - i - 1) + ' đại lượng ...';
      } else {
        _rest.strMessage += '. Đọc xong ' + props.nameReadingData;
      }
    }
    props.callBackReadDoneOnePara({ ..._rest });
  } else {
    //console.log('callBackReadDoneOnePara is null');
  }
}

export async function ReadPower(props: PropsReadStar): Promise<PropsResponse> {
  console.log('read Power....');

  let result: PropsResponse = {
    bSucceed: false,
    obj: {},
    strMessage: '',
  };
  let _rest: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  try {
    const meterPhase = GetTypeMeterAndPhase(props.seri);

    // let dataType = enumDataType.Energy_DataType_180;//180
    // let dataType = enumDataType.Energy_T1_DataType_180;//181
    // let dataType = enumDataType.Energy_T2_DataType_180; //182
    //let dataType = enumDataType.Energy_All_DataType; //15.8.0
    // let dataType = enumDataType.Curerent_DataType; //15.8.0

    // result = await _ReadRF({
    //   seri: props.seri,
    //   typeRead: dataType,
    // });

    let dataTypes: enumDataType[] = [];
    dataTypes.push(enumDataType.Energy_DataType_180);
    if (meterPhase.bIsSinglePhase) {
    } else {
      dataTypes.push(enumDataType.Energy_T1_DataType_180);
      dataTypes.push(enumDataType.Energy_T2_DataType_180);
      dataTypes.push(enumDataType.Energy_T3_DataType_180);
      dataTypes.push(enumDataType.Energy_VC_DataType); //380
    }
    //dataTypes.push(enumDataType.Version_DataType);

    for (let i = 0; i < dataTypes.length; i++) {
      _rest = await _ReadRF({
        seri: props.seri,
        typeRead: dataTypes[i],
      });
      if (_rest.obj.Serial) {
        if (!result.obj.Serial) {
          result.obj.Serial = _rest.obj.Serial;
        }
      }
      ProcessShowScreen({
        currentIndexInArrDataType: i,
        dataTypes: dataTypes,
        rest: _rest,
        nameReadingData: 'Điện năng',
        callBackReadDoneOnePara: props.callBackReadDoneOnePara,
      });

      if (_rest.bSucceed) {
        if (!result.obj.Power) {
          result.obj.Power = [];
        }
        if (_rest.obj.Power) {
          _rest.obj.Power = [...result.obj.Power, ..._rest.obj.Power];
        }
        result.obj = { ...result.obj, ..._rest.obj };
        result.bSucceed = true;
      } else {
        result.strMessage += _rest.strMessage + ', ';
      }
    }
  } catch (err: any) {
    console.log(TAG, 'err: ', err.message);
    result.strMessage = String(err.message);
  } finally {
  }

  return result;
}
async function ReadUI(props: PropsReadStar): Promise<PropsResponse> {
  let result: PropsResponse = {
    bSucceed: false,
    obj: {},
    strMessage: '',
  };
  let _rest: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  try {
    const meterPhase = GetTypeMeterAndPhase(props.seri);

    let dataTypes: enumDataType[] = [];
    if (meterPhase.bIsSinglePhase) {
      dataTypes.push(enumDataType.Voltage_DataType);
      dataTypes.push(enumDataType.Curerent_DataType);
    } else {
      dataTypes.push(enumDataType.Voltage_DataType_A);
      dataTypes.push(enumDataType.Voltage_DataType_B);
      dataTypes.push(enumDataType.Voltage_DataType_C);
      dataTypes.push(enumDataType.Curerent_DataType_A);
      dataTypes.push(enumDataType.Curerent_DataType_B);
      dataTypes.push(enumDataType.Curerent_DataType_C);
    }

    for (let i = 0; i < dataTypes.length; i++) {
      _rest = await _ReadRF({
        seri: props.seri,
        typeRead: dataTypes[i],
      });
      if (_rest.obj.Serial) {
        if (!result.obj.Serial) {
          result.obj.Serial = _rest.obj.Serial;
        }
      }
      ProcessShowScreen({
        currentIndexInArrDataType: i,
        dataTypes: dataTypes,
        rest: _rest,
        nameReadingData: 'UI',
        callBackReadDoneOnePara: props.callBackReadDoneOnePara,
      });

      if (_rest.bSucceed) {
        result.obj = { ...result.obj, ..._rest.obj };
        result.bSucceed = true;
      } else {
        result.strMessage += _rest.strMessage + ', ';
      }
    }
  } catch (err: any) {
    console.log(TAG, 'err: ', err.message);
    result.strMessage = String(err.message);
  } finally {
  }

  return result;
}
export async function ReadTSVH(props: PropsReadStar): Promise<PropsResponse> {
  console.log('read TSVH....');

  let result: PropsResponse = {
    bSucceed: false,
    obj: {},
    strMessage: '',
  };
  let _rest: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  try {
    const meterPhase = GetTypeMeterAndPhase(props.seri);

    let dataTypes: enumDataType[] = [];
    dataTypes.push(enumDataType.GroupData_DataType);

    for (let i = 0; i < dataTypes.length; i++) {
      _rest = await _ReadRF({
        seri: props.seri,
        typeRead: dataTypes[i],
      });
      if (_rest.obj.Serial) {
        if (!result.obj.Serial) {
          result.obj.Serial = _rest.obj.Serial;
        }
      }
      ProcessShowScreen({
        currentIndexInArrDataType: i,
        dataTypes: dataTypes,
        rest: _rest,
        nameReadingData: 'Thông số vận hành',
        callBackReadDoneOnePara: props.callBackReadDoneOnePara,
      });

      if (_rest.bSucceed) {
        result.obj = { ...result.obj, ..._rest.obj };
        result.bSucceed = true;
      } else {
        result.strMessage += _rest.strMessage + ', ';
      }
    }
  } catch (err: any) {
    console.log(TAG, 'err: ', err.message);
    result.strMessage = String(err.message);
  } finally {
  }

  return result;
}

type PropsGelexProcessReceive = {
  desiredSeri: string;
  desiredDataType: enumDataType;
  desiredObis?: KEY_POWERS;
  stringReceived: string;
};
export function GelexProcessReceive(
  props: PropsGelexProcessReceive,
): PropsResponse {
  const ret: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  console.log('custom Gelex is called');

  const obisWithDot = props.desiredObis
    ? props.desiredObis.split('').join('.')
    : '';
  console.log('obisWithDot:', obisWithDot);

  let arrData: string[] = [];

  const strRec = props.stringReceived;
  if (strRec.includes(props.desiredSeri) && strRec.includes(obisWithDot)) {
    const indexStart = strRec.indexOf('0.0.0');
    const lastIndex = strRec.lastIndexOf(')');
    if (indexStart === -1 || lastIndex === -1) {
      console.log('one of index = -1');
    } else {
      const newStrData = strRec.substring(indexStart, lastIndex + 1);
      arrData = getArrDataFromStringHHM(newStrData);
      if (arrData.length >= 1) {
        ret.obj.Serial = arrData[0];
      }
      switch (props.desiredDataType) {
        case enumDataType.Energy_DataType_180:
        case enumDataType.Energy_T1_DataType_180:
        case enumDataType.Energy_T2_DataType_180:
        case enumDataType.Energy_T3_DataType_180:
          if (arrData.length !== 2) {
            console.log('err length Data');
            ret.strMessage = 'No Data';
          } else {
            let strResult: string = arrData[1];
            let removeStr = '*kWh';
            if (strResult.includes(removeStr) === true) {
              strResult = strResult.replace(removeStr, '');
              if (!ret.obj.Power) {
                ret.obj.Power = [];
              }
              if (props.desiredDataType === enumDataType.Energy_DataType_180) {
                ret.obj.Power.push({
                  '180': strResult,
                });
              } else if (
                props.desiredDataType === enumDataType.Energy_T1_DataType_180
              ) {
                ret.obj.Power.push({
                  '181': strResult,
                });
              } else if (
                props.desiredDataType === enumDataType.Energy_T2_DataType_180
              ) {
                ret.obj.Power.push({
                  '182': strResult,
                });
              } else if (
                props.desiredDataType === enumDataType.Energy_T3_DataType_180
              ) {
                ret.obj.Power.push({
                  '183': strResult,
                });
              }

              ret.bSucceed = true;
            } else {
              ret.strMessage = 'not include string ' + removeStr;
              //console.log('not include string ' + removeStr);
            }
          }
          break;
        case enumDataType.Voltage_DataType:
        case enumDataType.Voltage_DataType_A:
        case enumDataType.Voltage_DataType_B:
        case enumDataType.Voltage_DataType_C:
          if (arrData.length !== 2) {
            console.log('err length Data');
            ret.strMessage = 'No Data';
          } else {
            let strResult: string = arrData[1];
            let removeStr = '*V';
            if (strResult.includes(removeStr) === true) {
              strResult = strResult.replace(removeStr, '');
              if (props.desiredDataType === enumDataType.Voltage_DataType_A) {
                ret.obj.Ua = strResult;
              } else if (
                props.desiredDataType === enumDataType.Voltage_DataType_B
              ) {
                ret.obj.Ub = strResult;
              } else if (
                props.desiredDataType === enumDataType.Voltage_DataType_C
              ) {
                ret.obj.Uc = strResult;
              }

              ret.bSucceed = true;
            } else {
              ret.strMessage = 'not include string ' + removeStr;
              //console.log('not include string ' + removeStr);
            }
          }
          break;
        case enumDataType.Curerent_DataType:
        case enumDataType.Curerent_DataType_A:
        case enumDataType.Curerent_DataType_B:
        case enumDataType.Curerent_DataType_C:
          if (arrData.length !== 2) {
            console.log('err length Data');
            ret.strMessage = 'No Data';
          } else {
            let strResult: string = arrData[1];
            let removeStr = '*A';
            if (strResult.includes(removeStr) === true) {
              strResult = strResult.replace(removeStr, '');
              if (props.desiredDataType === enumDataType.Curerent_DataType_A) {
                ret.obj.Ia = strResult;
              } else if (
                props.desiredDataType === enumDataType.Curerent_DataType_B
              ) {
                ret.obj.Ib = strResult;
              } else if (
                props.desiredDataType === enumDataType.Curerent_DataType_C
              ) {
                ret.obj.Ic = strResult;
              }
              ret.bSucceed = true;
            } else {
              ret.strMessage = 'not include string ' + removeStr;
              //console.log('not include string ' + removeStr);
            }
          }
          break;
        case enumDataType.GroupData_DataType:
          if (arrData.length === 7 || arrData.length === 16) {
            // 7 for 1 phase
            // 16 fro 3 pha
            if (!ret.obj.Power) {
              ret.obj.Power = [];
            }
            let strResult: string = '';
            let removeStr = '';
            if (arrData.length === 7) {
              /////////
              strResult = arrData[1];
              removeStr = '*kWh';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Power.push({
                '180': strResult,
              });
              strResult = strResult.replace(removeStr, '');
              ///////
              strResult = arrData[2];
              removeStr = '*V';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.U = strResult;
              ///////
              strResult = arrData[3];
              removeStr = '*A';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.I = strResult;
              ///////
              strResult = arrData[5];
              ret.obj.cosφ = strResult;
            } else if (arrData.length === 16) {
              //////////////
              let numerator = arrData[1];
              let demorator = arrData[2];
              ret.obj.TI = numerator + '/' + demorator;
              numerator = arrData[3];
              demorator = arrData[4];
              ret.obj.TU = numerator + '/' + demorator;

              ///////
              strResult = arrData[5];
              removeStr = '*A';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Ia = strResult;
              ///////
              strResult = arrData[6];
              removeStr = '*A';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Ib = strResult;
              ///////
              strResult = arrData[7];
              removeStr = '*A';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Ic = strResult;
              ///////
              strResult = arrData[8];
              removeStr = '*V';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Ua = strResult;
              ///////
              strResult = arrData[9];
              removeStr = '*V';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Ub = strResult;
              ///////
              strResult = arrData[10];
              removeStr = '*V';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Uc = strResult;

              ///////
              strResult = arrData[11];
              removeStr = '*kWh';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Power.push({
                '180': strResult,
              });
              ///////
              strResult = arrData[12];
              removeStr = '*kWh';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Power.push({
                '181': strResult,
              });
              ///////
              strResult = arrData[13];
              removeStr = '*kWh';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Power.push({
                '182': strResult,
              });
              ///////
              strResult = arrData[14];
              removeStr = '*kWh';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Power.push({
                '183': strResult,
              });

              ///////
              strResult = arrData[15];
              removeStr = '*kvarh';
              if (strResult.includes(removeStr) === false) {
                ret.strMessage = 'err data';
                break;
              }
              strResult = strResult.replace(removeStr, '');
              ret.obj.Power.push({
                '380': strResult,
              });
            }

            ret.bSucceed = true;
          } else {
            console.log('err length Data');
            ret.strMessage = 'No Data';
          }
          break;
      }
    }
  } else {
    console.log('dont include seri or desired obis');
  }

  return ret;
}

export function GetTypeMeterAndPhase(strSeri: string): {
  meterType: string;
  bIsSinglePhase: bool;
} {
  const rest: {
    meterType: string;
    bIsSinglePhase: bool;
  } = {
    meterType: '',
    bIsSinglePhase: false,
  };

  const bAddr: uint8_t[] = new Array<uint8_t>(4);

  if (strSeri.length < 8) {
    strSeri = strSeri.padStart(8, '0');
  }
  if (
    strSeri.substring(0, 1).toUpperCase() != 'M' &&
    strSeri.substring(0, 1).toUpperCase() != 'F'
  ) {
    bAddr[0] = Convert.ToByte(strSeri.substring(0, 0 + 2), 0x10);
    bAddr[1] = Convert.ToByte(strSeri.substring(2, 2 + 2), 0x10);
    bAddr[2] = Convert.ToByte(strSeri.substring(4, 4 + 2), 0x10);
    bAddr[3] = Convert.ToByte(strSeri.substring(6, 6 + 2), 0x10);
  }

  const szMeterSN = strSeri;

  let objRef: any = {};

  const meterType = MyGloab.GetMeterType(szMeterSN, true, objRef);
  let bIsInRange: bool = objRef.bIsInRange;

  if (bIsInRange && meterType == METERTYPE.DTS27_645_07) {
    let num: long = Convert.ToInt64(szMeterSN);
    if (
      // (num >= 0x59afe6c5 && num <= 0x59afe6f6) ||
      // (num >= 0x59afe6f7 && num <= 0x59afe728) ||
      // (num >= 0x5b50785f && num <= 0x5b507890)
      (num >= 1504700101 && num <= 1504700150) ||
      (num >= 1504700151 && num <= 1504700151) ||
      (num >= 1504700151 && num <= 1504700151)
    ) {
      rest.bIsSinglePhase = true;
    }
  }

  let meterTypeStr = ConvertTypeMeterToString(meterType);

  const strMeterAdd = strSeri.padStart(12, '0');
  const meterPhase = MyGloab.GetMeterPhase(strMeterAdd, 'KT');

  rest.meterType = meterTypeStr;
  rest.bIsSinglePhase = meterPhase === METER_PHASE.SINGLE_PHASE;

  return rest;
}
