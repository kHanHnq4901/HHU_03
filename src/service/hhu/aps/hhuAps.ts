import { Buffer } from 'buffer';
import {
  Array2Struct,
  sizeof,
  Struct2Array,
} from '../../../util/struct-and-array';
import { sleep, StringFromArray } from '../../../util';
import { uint32_t, uint8_t } from '../define';
import {
  CommandRF,
  meterSpecies,
  PropsMeterSpecies,
  TYPE_METER,
  ValueMeterDefine,
  VALUE_TYPE_METER,
} from '../defineEM';
import {
  analysisRx,
  hhuFunc_HeaderProps,
  hhuFunc_Send,
  HhuObj,
  ResponseRxProps,
  TYPE_HHU_CMD,
} from '../hhuFunc';
import {
  Aps_HeaderProps,
  Aps_HeaderType,
  BroadcastMeterProps,
  BroadcastMeterType,
  Rtc_TimeProps,
  Rtc_TimeType,
} from './radioProtocol';
import {
  ConvertBCDToByte,
  get2byteDataDLMS,
  get4byteDataDLMS,
  getArrDataFromString,
  GetSerialFromBuffer,
  GetStringRssi,
  getTimeDLMS,
  getTimeIEC,
} from './util';
import {
  commonGetInstantPowerManyPriceDLMS,
  commonGetInstantPowerManyPriceIEC,
  commonGetPmaxDLMS,
  commonGetPmaxIEC,
  commonGetPower0hManyPriceDLMS,
  commonGetPower0hManyPriceIEC,
  commonGetUIcosPhi1phaseDLMS,
  commonGetUIcosPhi1phaseIEC,
  commonGetUIcosPhi3phaseDLMS,
  commonGetUIcosPhi3phaseIEC,
  crcAps,
  getTimeoutInAps,
} from './utilFunc';

const TAG = 'hhuAps:';

export type PropsLabelMaxDemand =
  | '1601'
  | '1611'
  | '1621'
  | '1631'
  | '2601'
  | '2611'
  | '2621'
  | '2631'
  | 'Thời điểm';

export type PropsLabelPower =
  | '180'
  | '181'
  | '182'
  | '183'
  | '280'
  | '281'
  | '282'
  | '283'
  | '380'
  | '480';
export type PropsExtraLabelPower =
  | 'KT'
  | 'SG'
  | 'BT'
  | 'CD'
  | 'TD'
  | 'SN'
  | 'BN'
  | 'CN'
  | 'TN'
  | 'VC'
  | 'VN';

type PropsLabelUI = 'Ua' | 'Ub' | 'Uc' | 'Ia' | 'Ib' | 'Ic' | 'U' | 'I';
type PropsOtherLabel = 'Rssi' | 'Rssi 18G';

export const arrTitleCodePower = [
  '180',
  '181',
  '182',
  '183',
  '280',
  '281',
  '282',
  '283',
  '380',
  '480',
];

export const arrTitleCodeMaxDemand = [
  '1601',
  '1611',
  '1621',
  '1631',
  '2601',
  '2611',
  '2621',
  '2631',
];

export const arrTitleUI3phase = ['Ua', 'Ub', 'Uc', 'Ia', 'Ib', 'Ic'];

export type PropsLabel =
  | PropsLabelMaxDemand
  | PropsLabelPower
  | PropsLabelUI
  | PropsOtherLabel;

type BroadcastMeterPropertiesProps = {
  seri: string;
  spec: 'Dcu' | 'Công tơ';
  rssi: string;
};

type PropsMeterProperties = {
  Serial: string;
  'Serial 18G': string;
  Rssi: string;
  'Rssi 18G': string;
  U: string;
  I: string;
  cosφ: string;
  Ua: string;
  Ub: string;
  Uc: string;
  Ia: string;
  Ib: string;
  Ic: string;
  TU: string;
  TI: string;
  Power: { [P in PropsLabelPower]?: string }[];
  MaxDemand: { [P in PropsLabelMaxDemand]?: string }[];
  'Ngày chốt': string;
  'Thời gian': string;
  'Trạng thái': string;
  broadcastMeter: BroadcastMeterPropertiesProps[];
};

export type PropsResponse = {
  bSucceed: boolean;
  strMessage: string;
  obj: Partial<PropsMeterProperties>;
};

export const DONT_CARE = 0;

export const _readRf = async (
  targetSerial: string,
  header: Aps_HeaderProps,
  u32Timeout: number,
  time?: Rtc_TimeProps,
  payload18G?: Buffer,
): Promise<PropsResponse> => {
  let response: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };

  response.bSucceed = await apsSend(header, time, payload18G);

  if (response.bSucceed === false) {
    response.strMessage = 'Send error';
    return response;
  }

  response = await apsAnalysis(targetSerial.padStart(12, '0'), u32Timeout);

  return response;
};

export type PropsApsReadRf = {
  seri: string;
  labelMeterSpecies: keyof PropsMeterSpecies; // CE18 ME40 ...
  typeMeter: TYPE_METER;
  command: uint8_t;
  is1Ch: boolean;
  is0h: boolean;
  date: Date;
  seri18G?: string;
};

export const apsReadRf = async (
  props: PropsApsReadRf,
): Promise<PropsResponse> => {
  let response: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  console.log(TAG, props);
  let command: uint8_t = props.command;
  let seri: string;
  if (props.command !== CommandRF.FIND_BROADCAST) {
    seri = props.seri.padStart(12, '0');
  } else {
    seri = ''.padStart(12, '0');
  }

  const valueMeterSpecies: uint8_t =
    meterSpecies[props.labelMeterSpecies].value;
  let typeMeter: uint8_t =
    props.typeMeter === 'IEC'
      ? VALUE_TYPE_METER.IEC
      : props.is1Ch
      ? VALUE_TYPE_METER.DLMS_1C
      : VALUE_TYPE_METER.DLMS_16C;
  if (valueMeterSpecies === meterSpecies.Repeater.value) {
    if (props.command === CommandRF.INSTANT_POWER) {
      command = CommandRF.READ_CE18_BY_REPEATER;
    }

    typeMeter = VALUE_TYPE_METER.IEC;
  } else {
    command =
      props.command === CommandRF.INSTANT_POWER
        ? props.is0h
          ? CommandRF.POWER_0H
          : props.command
        : props.command;
  }
  if (valueMeterSpecies === meterSpecies['CE-18G'].value) {
    typeMeter = VALUE_TYPE_METER.DLMS_16C;
  } else if (valueMeterSpecies === meterSpecies.Elster.value) {
    typeMeter = VALUE_TYPE_METER.DLMS_1C;
  }

  if (valueMeterSpecies === meterSpecies.Dcu.value) {
    typeMeter = VALUE_TYPE_METER.IEC;
  }

  const au8Serial = Buffer.alloc(6);
  for (let i = 0; i < 6; i++) {
    au8Serial[i] = ConvertBCDToByte(seri[i * 2] + seri[i * 2 + 1]);
  }
  let au8Serial18G: any = null;
  let time = {} as Rtc_TimeProps;
  if (valueMeterSpecies === meterSpecies.Repeater.value) {
    if (
      command !== CommandRF.SEARCH_METER &&
      command !== CommandRF.RESET_RF_MODULE &&
      command !== CommandRF.FIND_BROADCAST
    ) {
      if (!props.seri18G) {
        response.bSucceed = false;
        response.strMessage = 'No seri CE-18G';
        return response;
      }
    }

    const seri18G: string = (props.seri18G ?? '').padStart(8, '0');
    au8Serial18G = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) {
      au8Serial18G[i] = ConvertBCDToByte(seri18G[i * 2] + seri18G[i * 2 + 1]);
    }
    console.log('seri18G:', seri18G);
  } else {
    time = {
      u8Year: props.date.getFullYear() - 2000,
      u8Month: props.date.getMonth() + 1,
      u8Date: props.date.getDate(),
      u8Day: props.date.getDay(),
      u8Hour: props.date.getHours(),
      u8Minute: props.date.getMinutes(),
      u8Second: props.date.getSeconds(),
    };
  }

  const header: Aps_HeaderProps = {
    au8Seri: au8Serial,
    u8Command: command,
    u16Length: DONT_CARE,
    u8MeterSpecies: valueMeterSpecies,
    u8Reserve: DONT_CARE,
    u8Rssi: DONT_CARE,
    u8TypeMeter: typeMeter,
    u8StartByte: DONT_CARE,
  };

  let u32Timeout = getTimeoutInAps(command, props.labelMeterSpecies);

  console.log(TAG, header);
  console.log('u32Timeout:', u32Timeout);

  if (valueMeterSpecies === meterSpecies['ME-41'].value) {
    if (props.typeMeter === 'DLMS') {
      if (
        command === CommandRF.INSTANT_POWER ||
        command === CommandRF.UI_PF ||
        command === CommandRF.POWER_0H ||
        command === CommandRF.PMAX_NEAREST
      ) {
        let responseReal = {} as PropsResponse;
        let stockCommand = header.u8Command;
        // read TU TI
        console.log('read TU TI first');
        header.u8Command = CommandRF.TU_TI;
        response = await _readRf(seri, header, u32Timeout, time, au8Serial18G);

        if (response.bSucceed === true) {
          let TU: number;
          let TI: number;
          await sleep(500);
          try {
            const arrTU = response.obj.TU?.split('/') ?? [];
            const arrTI = response.obj.TI?.split('/') ?? [];

            if (arrTU.length !== 2 || arrTI.length !== 2) {
              response.bSucceed = false;
              response.strMessage = 'Err TU_TI';
              return response;
            }
            TU = Number(arrTU[0]) / Number(arrTU[1]); //Number(response.obj.TU);
            TI = Number(arrTI[0]) / Number(arrTI[1]); //Number(response.obj.TI);
          } catch (err: any) {
            response.bSucceed = false;
            response.strMessage = 'Err TU_TI';
            return response;
          }

          // then read real command;
          console.log('read stock command ', stockCommand);
          header.u8Command = stockCommand;
          responseReal = await _readRf(
            seri,
            header,
            u32Timeout,
            time,
            au8Serial18G,
          );

          responseReal.obj.TU = response.obj.TU;
          responseReal.obj.TI = response.obj.TI;
          switch (stockCommand) {
            case CommandRF.INSTANT_POWER:
            case CommandRF.POWER_0H:
              for (let item of responseReal.obj.Power ?? []) {
                for (let _obj in item) {
                  const obj = _obj as keyof typeof item;
                  item[obj] = (Number(item[obj]) * TU * TI).toFixed(3);
                }
              }
              return responseReal;
            case CommandRF.UI_PF:
              responseReal.obj.Ua = (Number(responseReal.obj.Ua) * TU).toFixed(
                2,
              );
              responseReal.obj.Ub = (Number(responseReal.obj.Ub) * TU).toFixed(
                2,
              );
              responseReal.obj.Uc = (Number(responseReal.obj.Uc) * TU).toFixed(
                2,
              );
              responseReal.obj.Ia = (Number(responseReal.obj.Ia) * TI).toFixed(
                2,
              );
              responseReal.obj.Ib = (Number(responseReal.obj.Ib) * TI).toFixed(
                2,
              );
              responseReal.obj.Ic = (Number(responseReal.obj.Ic) * TI).toFixed(
                2,
              );
              return responseReal;
            case CommandRF.PMAX_NEAREST:
              for (let item of responseReal.obj.MaxDemand ?? []) {
                for (let _obj in item) {
                  const obj = _obj as keyof typeof item;
                  if (obj !== 'Thời điểm') {
                    item[obj] = (Number(item[obj]) * TU * TI).toFixed(3);
                  }
                }
              }
              return responseReal;
          }
        }
        return responseReal;
      }
    }
  }
  response = await _readRf(seri, header, u32Timeout, time, au8Serial18G);

  return response;
};

export const apsSend = async (
  header: Aps_HeaderProps,
  time?: Rtc_TimeProps,
  payload18G?: Buffer,
): Promise<boolean> => {
  header.u8StartByte = 0x68;
  const buffer = Buffer.alloc(200);
  let index: uint8_t = 0;

  index += sizeof(Aps_HeaderType);
  if (time) {
    Struct2Array(Rtc_TimeType, time, buffer, index);
  }
  if (payload18G) {
    payload18G.copy(buffer, index, 0, payload18G.length);
  }
  index += sizeof(Rtc_TimeType); // fixed length

  index += 1; // reserve
  header.u16Length = index + 2;
  Struct2Array(Aps_HeaderType, header, buffer, 0);

  let crc: uint8_t = crcAps(buffer, 1, index - 1);
  buffer[index] = crc;
  index++;
  buffer[index] = 0x16;
  index++;

  let lengthSend = header.u16Length;

  const hhuFuncHeader: hhuFunc_HeaderProps = {
    u8Cmd: TYPE_HHU_CMD.DATA,
    u16FSN: 0xffff,
    u16Length: lengthSend,
  };
  return hhuFunc_Send(hhuFuncHeader, buffer);
};

export const apsAnalysis = async (
  targetSerial: string,
  u32Timeout: uint32_t,
): Promise<PropsResponse> => {
  const hhuFuncRespone = {} as ResponseRxProps;

  let strPower: string;
  let strPayload: string;

  const apsResponse: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };
  // while here

  let remainTimeout = u32Timeout;

  while (true) {
    let oldTick = new Date().getTime();
    let bResult = await analysisRx(hhuFuncRespone, remainTimeout);
    if (bResult !== true) {
      apsResponse.bSucceed = false;
      apsResponse.strMessage = 'Nack';
      return apsResponse;
    }
    if (hhuFuncRespone.hhuHeader.u8Cmd !== TYPE_HHU_CMD.DATA) {
      apsResponse.bSucceed = false;
      apsResponse.strMessage = 'Invalid cmd hhu func';
      return apsResponse;
    }
    let index = 0;
    const apsHeader: Aps_HeaderProps = Array2Struct(
      HhuObj.buffRx,
      0,
      Aps_HeaderType,
    );

    console.log('response header:', apsHeader);

    index += sizeof(Aps_HeaderType);

    let crc = crcAps(HhuObj.buffRx, 1, apsHeader.u16Length - 3);
    if (crc !== HhuObj.buffRx[apsHeader.u16Length - 2]) {
      apsResponse.bSucceed = false;
      apsResponse.strMessage = 'crc aps error';
      return apsResponse;
    }

    if (apsHeader.u8StartByte !== 0x68) {
      apsResponse.bSucceed = false;
      apsResponse.strMessage = 'Invalid start byte 0x68';
      return apsResponse;
    }

    let lengthPayload =
      apsHeader.u16Length - sizeof(Aps_HeaderType) - 2; /* crc, byte end */

    apsResponse.obj.Serial = GetSerialFromBuffer(apsHeader.au8Seri, 0);

    if (apsHeader.u8Command !== CommandRF.FIND_BROADCAST) {
      if (targetSerial !== apsResponse.obj.Serial) {
        apsResponse.bSucceed = false;
        console.log('targetSerial:', targetSerial);
        console.log('apsResponse.obj.Serial:', apsResponse.obj.Serial);
        apsResponse.strMessage = 'Not match serial';
        return apsResponse;
      }
    }

    apsResponse.obj.Rssi = GetStringRssi(apsHeader.u8Rssi);

    let status: number;

    if (
      apsHeader.u8Command === CommandRF.INIT_RF_MODULE ||
      apsHeader.u8Command === CommandRF.SEARCH_METER ||
      apsHeader.u8Command === CommandRF.RESET_RF_MODULE ||
      apsHeader.u8Command === CommandRF.CMD_SYNC_TIME ||
      apsHeader.u8Command === CommandRF.FIND_BROADCAST
    ) {
      switch (apsHeader.u8Command) {
        case CommandRF.INIT_RF_MODULE:
          status = HhuObj.buffRx[index];
          if (status === 1) {
            apsResponse.obj['Trạng thái'] = 'Chưa mesh. Khởi tạo lại module';
          } else if (status === 2) {
            apsResponse.obj['Trạng thái'] = 'Đã mesh. Khởi tạo lại module';
          } else {
            apsResponse.obj['Trạng thái'] = 'Không xác định';
          }
          apsResponse.bSucceed = true;
          return apsResponse;
        case CommandRF.CMD_SYNC_TIME:
          status = HhuObj.buffRx[index];
          if (status === 0x16) {
            apsResponse.obj['Trạng thái'] = 'Đồng bộ thành công';
          } else if (status === 0x15) {
            apsResponse.obj['Trạng thái'] = 'Đồng bộ lỗi';
          } else {
            apsResponse.obj['Trạng thái'] = 'Không xác định';
          }
          apsResponse.bSucceed = true;
          return apsResponse;
        case CommandRF.SEARCH_METER:
          status = HhuObj.buffRx[index];
          if (status === 1) {
            apsResponse.obj['Trạng thái'] = 'Chưa mesh';
          } else if (status === 2) {
            apsResponse.obj['Trạng thái'] = 'Đã mesh';
          } else {
            if (apsHeader.u8MeterSpecies !== meterSpecies.Dcu.value) {
              apsResponse.obj['Trạng thái'] = 'Không xác định';
            }
          }
          apsResponse.bSucceed = true;
          return apsResponse;
        case CommandRF.RESET_RF_MODULE:
          status = HhuObj.buffRx[index];
          if (status === 1) {
            apsResponse.obj['Trạng thái'] = 'Chưa mesh. Reset lại module';
          } else if (status === 2) {
            apsResponse.obj['Trạng thái'] = 'Đã mesh. Reset lại module';
          } else {
            apsResponse.obj['Trạng thái'] = 'Không xác định';
          }
          apsResponse.bSucceed = true;
          return apsResponse;
        case CommandRF.FIND_BROADCAST:
          switch (apsHeader.u8MeterSpecies) {
            case ValueMeterDefine.DCU_RF:
              apsResponse.bSucceed = true;
              return apsResponse;

            case ValueMeterDefine.BROADCAST_Meter:
              apsResponse.obj.Serial = undefined;
              apsResponse.obj.Rssi = undefined;
              apsResponse.bSucceed = true;
              if (!apsResponse.obj.broadcastMeter) {
                apsResponse.obj.broadcastMeter = [];
              }

              let numMeter = apsHeader.u16Length / sizeof(BroadcastMeterType);

              for (let i = 0; i < numMeter; i++) {
                const meter: BroadcastMeterProps = Array2Struct(
                  HhuObj.buffRx,
                  index,
                  BroadcastMeterType,
                );
                meter.seri = Buffer.from(meter.seri);
                const meterElement = {} as BroadcastMeterPropertiesProps;
                meterElement.seri = GetSerialFromBuffer(meter.seri, 0);
                meterElement.rssi = GetStringRssi(meter.rssi);
                meterElement.spec =
                  meter.spec === ValueMeterDefine.DCU_RF ? 'Dcu' : 'Công tơ';
                apsResponse.obj.broadcastMeter.push(meterElement);
              }

              break;
            //return apsResponse;
            default:
              apsResponse.bSucceed = false;
              return apsResponse;
          }
      }
    } else {
      if (!apsResponse.obj.Power) {
        apsResponse.obj.Power = [];
      }
      if (!apsResponse.obj.MaxDemand) {
        apsResponse.obj.MaxDemand = [];
      }

      if (apsHeader.u8MeterSpecies === meterSpecies.Repeater.value) {
        apsResponse.obj['Serial 18G'] = GetSerialFromBuffer(
          HhuObj.buffRx,
          index,
          4,
        );
        index += 4;
        // apsResponse.obj['Rssi 18G'] = GetStringRssi(HhuObj.buffRx[index]);
        // index += 1;

        //index = 17;

        apsHeader.u8MeterSpecies = meterSpecies['CE-18G'].value;
        apsHeader.u8Command = CommandRF.INSTANT_POWER;
      }

      if (apsHeader.u8MeterSpecies === meterSpecies['CE-18G'].value) {
        apsHeader.u8TypeMeter = VALUE_TYPE_METER.DLMS_16C;
        //apsHeader.u8Command = CommandRF.INSTANT_POWER;
      }

      if (
        apsHeader.u8TypeMeter === VALUE_TYPE_METER.DLMS_16C ||
        apsHeader.u8TypeMeter === VALUE_TYPE_METER.DLMS_1C
      ) {
        //console.log('Response type meter: ');
        switch (apsHeader.u8MeterSpecies) {
          case meterSpecies['CE-18G'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;

                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                apsResponse.bSucceed = true;
                return apsResponse;

              case CommandRF.UI_PF:
                index = commonGetUIcosPhi1phaseDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );
                apsResponse.obj.cosφ = undefined;
                return apsResponse;
            }
            break;
          case meterSpecies['CE-18'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;
                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                apsResponse.bSucceed = true;
                return apsResponse;
              case CommandRF.POWER_0H:
                apsResponse.obj['Ngày chốt'] = getTimeDLMS(
                  HhuObj.buffRx,
                  index,
                );
                index += 6;
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;

                apsResponse.bSucceed = true;
                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                return apsResponse;

              case CommandRF.UI_PF:
                index = commonGetUIcosPhi1phaseDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );

                return apsResponse;
              case CommandRF.READ_TIME:
                apsResponse.obj['Thời gian'] = getTimeDLMS(
                  HhuObj.buffRx,
                  index,
                  true,
                );
                apsResponse.bSucceed = true;

                return apsResponse;
            }
            break;
          case meterSpecies['CE-14'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                index = commonGetInstantPowerManyPriceDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                  100,
                );
                return apsResponse;
              case CommandRF.POWER_0H:
                index = commonGetPower0hManyPriceDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );
                return apsResponse;

              case CommandRF.UI_PF:
                index = commonGetUIcosPhi1phaseDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );

                return apsResponse;
              case CommandRF.PMAX_NEAREST:
                index = commonGetPmaxDLMS(apsResponse, HhuObj.buffRx, index);

                return apsResponse;
              case CommandRF.READ_TIME:
                apsResponse.obj['Thời gian'] = getTimeDLMS(
                  HhuObj.buffRx,
                  index,
                  true,
                );
                apsResponse.bSucceed = true;

                return apsResponse;
            }
            break;

          case meterSpecies['ME-40'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;
                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;
                apsResponse.obj.Power.push({
                  '380': strPower,
                });
                apsResponse.bSucceed = true;
                return apsResponse;
              case CommandRF.POWER_0H:
                apsResponse.obj['Ngày chốt'] = getTimeDLMS(
                  HhuObj.buffRx,
                  index,
                );
                index += 6;
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;
                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                strPower = get4byteDataDLMS(HhuObj.buffRx, index);
                index += 4;
                apsResponse.obj.Power.push({
                  '380': strPower,
                });
                apsResponse.bSucceed = true;
                return apsResponse;

              case CommandRF.UI_PF:
                index = commonGetUIcosPhi3phaseDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );
                return apsResponse;
              case CommandRF.READ_TIME:
                apsResponse.obj['Thời gian'] = getTimeDLMS(
                  HhuObj.buffRx,
                  index,
                  true,
                );
                apsResponse.bSucceed = true;

                return apsResponse;
            }
            break;
          case meterSpecies['ME-41'].value:
          case meterSpecies['ME-42'].value:
          case meterSpecies.Elster.value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                index = commonGetInstantPowerManyPriceDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );
                return apsResponse;
              case CommandRF.POWER_0H:
                index = commonGetPower0hManyPriceDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );
                return apsResponse;

              case CommandRF.UI_PF:
                index = commonGetUIcosPhi3phaseDLMS(
                  apsResponse,
                  HhuObj.buffRx,
                  index,
                );
                return apsResponse;
              case CommandRF.PMAX_NEAREST:
                index = commonGetPmaxDLMS(apsResponse, HhuObj.buffRx, index);

                return apsResponse;
              case CommandRF.TU_TI:
                let headU = Number(get4byteDataDLMS(HhuObj.buffRx, index, 1));
                index += 4;
                let tailU = Number(get2byteDataDLMS(HhuObj.buffRx, index, 10));
                index += 2;
                let headI = Number(get4byteDataDLMS(HhuObj.buffRx, index, 1));
                index += 4;
                let tailI = Number(get2byteDataDLMS(HhuObj.buffRx, index, 10));
                index += 2;
                console.log('kkk:', headU, tailU, headI, tailI);
                apsResponse.obj.TU = headU + '/' + tailU; //(headU / tailU).toFixed(0);
                apsResponse.obj.TI = headI + '/' + tailI; //(headI / tailI).toFixed(0);
                //console.log('test apsResponse:', apsResponse);
                apsResponse.bSucceed = true;

                return apsResponse;
              case CommandRF.READ_TIME:
                apsResponse.obj['Thời gian'] = getTimeDLMS(
                  HhuObj.buffRx,
                  index,
                  true,
                );
                apsResponse.bSucceed = true;

                return apsResponse;
            }
            break;

          default:
            apsResponse.bSucceed = false;
            apsResponse.strMessage = 'No Meter Species';
            return apsResponse;
        }
      } else if (apsHeader.u8TypeMeter === VALUE_TYPE_METER.IEC) {
        if (lengthPayload <= 0) {
          apsResponse.strMessage = 'Length err';
          apsResponse.bSucceed = false;
          return apsResponse;
        }
        strPayload = StringFromArray(HhuObj.buffRx, index, lengthPayload);
        let arrReg: string[] = getArrDataFromString(strPayload);
        console.log('strPayload:', strPayload);
        switch (apsHeader.u8MeterSpecies) {
          case meterSpecies['CE-18'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                if (!arrReg || arrReg.length !== 1) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  //console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                console.log('arrReg:', arrReg);
                strPower = arrReg[0];
                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                apsResponse.bSucceed = true;
                return apsResponse;
              case CommandRF.POWER_0H:
                if (!arrReg || arrReg.length !== 2) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj['Ngày chốt'] = getTimeIEC(arrReg[0]);

                strPower = arrReg[1];

                apsResponse.bSucceed = true;
                apsResponse.obj.Power.push({
                  '180': strPower,
                });
                return apsResponse;

              case CommandRF.UI_PF:
                if (!arrReg || arrReg.length !== 3) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetUIcosPhi1phaseIEC(apsResponse, arrReg);

                return apsResponse;
              case CommandRF.READ_TIME:
                if (!arrReg || arrReg.length !== 1) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj['Thời gian'] = getTimeIEC(arrReg[0]);
                apsResponse.bSucceed = true;
                return apsResponse;
            }
            break;
          case meterSpecies['CE-14'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                if (!arrReg || arrReg.length !== 10) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetInstantPowerManyPriceIEC(apsResponse, arrReg);
                return apsResponse;
              case CommandRF.POWER_0H:
                if (!arrReg || arrReg.length !== 11) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetPower0hManyPriceIEC(apsResponse, arrReg);
                return apsResponse;

              case CommandRF.UI_PF:
                if (!arrReg || arrReg.length !== 3) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetUIcosPhi1phaseIEC(apsResponse, arrReg);

                return apsResponse;
              case CommandRF.PMAX_NEAREST:
                if (!arrReg || arrReg.length !== 17) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetPmaxIEC(apsResponse, arrReg);
                return apsResponse;
              case CommandRF.READ_TIME:
                if (!arrReg || arrReg.length !== 1) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj['Thời gian'] = getTimeIEC(arrReg[0]);
                apsResponse.bSucceed = true;
                return apsResponse;
            }
            break;

          case meterSpecies['ME-40'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                if (!arrReg || arrReg.length !== 2) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj.Power.push({
                  '180': arrReg[0],
                });

                apsResponse.obj.Power.push({
                  '380': arrReg[1],
                });
                apsResponse.bSucceed = true;
                return apsResponse;
              case CommandRF.POWER_0H:
                if (!arrReg || arrReg.length !== 3) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj['Ngày chốt'] = getTimeIEC(arrReg[0]);
                apsResponse.obj.Power.push({
                  '180': arrReg[1],
                });

                apsResponse.obj.Power.push({
                  '380': arrReg[2],
                });
                apsResponse.bSucceed = true;
                return apsResponse;

              case CommandRF.UI_PF:
                if (!arrReg || arrReg.length !== 7) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetUIcosPhi3phaseIEC(apsResponse, arrReg);
                return apsResponse;
              case CommandRF.READ_TIME:
                if (!arrReg || arrReg.length !== 1) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj['Thời gian'] = getTimeIEC(arrReg[0]);
                apsResponse.bSucceed = true;
                return apsResponse;
            }
            break;
          case meterSpecies['ME-41'].value:
          case meterSpecies['ME-42'].value:
            switch (apsHeader.u8Command) {
              case CommandRF.INSTANT_POWER:
                if (!arrReg || arrReg.length !== 10) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetInstantPowerManyPriceIEC(apsResponse, arrReg);
                return apsResponse;
              case CommandRF.POWER_0H:
                if (!arrReg || arrReg.length !== 11) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetPower0hManyPriceIEC(apsResponse, arrReg);
                return apsResponse;

              case CommandRF.UI_PF:
                if (!arrReg || arrReg.length !== 7) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                commonGetUIcosPhi3phaseIEC(apsResponse, arrReg);
                return apsResponse;
              case CommandRF.PMAX_NEAREST:
                if (!arrReg || arrReg.length !== 17) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);

                  return apsResponse;
                }
                commonGetPmaxIEC(apsResponse, arrReg);
                return apsResponse;
              case CommandRF.TU_TI:
                if (!arrReg || arrReg.length !== 4) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                let k = 0;
                let headU = Number(arrReg[k++]);

                let tailU = Number(arrReg[k++]);

                let headI = Number(arrReg[k++]);

                let tailI = Number(arrReg[k++]);

                // apsResponse.obj.TU = (headU / tailU).toFixed(0);
                // apsResponse.obj.TI = (headI / tailI).toFixed(0);
                apsResponse.obj.TU = headU + '/' + tailU; //(headU / tailU).toFixed(0);
                apsResponse.obj.TI = headI + '/' + tailI; //(headI / tailI).toFixed(0);
                apsResponse.bSucceed = true;

                return apsResponse;
              case CommandRF.READ_TIME:
                if (!arrReg || arrReg.length !== 1) {
                  apsResponse.bSucceed = false;
                  apsResponse.strMessage = 'Err regex';
                  console.log('arrReg:', arrReg);
                  return apsResponse;
                }
                apsResponse.obj['Thời gian'] = getTimeIEC(arrReg[0]);
                apsResponse.bSucceed = true;
                return apsResponse;
            }
            break;

          default:
            apsResponse.bSucceed = false;
            apsResponse.strMessage = 'No Meter Species';
            return apsResponse;
        }
      }
      if (hhuFuncRespone.hhuHeader.u16FSN !== 0xffff) {
        remainTimeout -= new Date().getTime() - oldTick;
        continue;
      } else {
        break;
      }
    }
  }
  return apsResponse;
};
