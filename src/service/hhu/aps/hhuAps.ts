import { crc16 } from "../../../util/crc16";
import { CommandType, LoraCommandCode } from "../defineEM";

const STX = 0x02;         
const MODULE_TYPE = 0x08; 
global.Buffer = require('buffer').Buffer;
export const stringToBytes = (text: string): number[] => {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text)); 
};

export const stringToUint8Array = (text: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(text);
};

export const stringToBuffer = (text: string): Buffer => {
  return Buffer.from(text, "utf-8");
};

const buildPacket = (
  commandType: number,
  payload: number[],
  meterSerial: number[]
): number[] => {
  const lenPayload = payload.length;
  const baseData = [
    STX,
    MODULE_TYPE,
    commandType,
    lenPayload,
    ...meterSerial,
    ...payload,
  ];

  // dùng Uint8Array thay cho Buffer
  const buf = new Buffer(baseData);
  const crc = crc16(buf, buf.length);

  return [...baseData,  crc & 0xff,(crc >> 8) & 0xff];
};

export const buildGetParamPacket = (
  meterSerial: string,
  payload: LoraCommandCode
): number[] => {
  return buildPacket(
    CommandType.LORA_GET_PARAM,
    [payload as number],
    stringToBytes(meterSerial)
  );
};

export const buildSetParamPacket = (
  meterSerial: string,
  params: string
): number[] => {
  const paramBytes = stringToBytes(params);

  const payload = [
    LoraCommandCode.SETTING,
    1,                 
    paramBytes.length, 
    ...paramBytes,
  ];
  return buildPacket(
    CommandType.LORA_SET_PARAM,
    payload,
    stringToBytes(meterSerial)
  );
};

export const buildQueryDataPacket = (
  meterSerial: string,
  isDetailedRead: boolean
): number[] => {
  // ✅ Thêm 1 byte biểu diễn trạng thái isDetailedRead
  const detailedReadByte = isDetailedRead ?   LoraCommandCode.LORA_CMD_QUERY_DATA_DETAIL : LoraCommandCode.LORA_CMD_QUERY_DATA;

  const payload = [
    LoraCommandCode.QUERY_DATA,
    detailedReadByte, // ✅ byte mới
  ];

  return buildPacket(
    CommandType.LORA_QUERY_DATA,
    payload,
    stringToBytes(meterSerial)
  );
};


export const buildLoraWakeUpPacket = (meterSerial: string): number[] => {
  const wakeupString = "WM08WakeUpNow";
  const wakeupBytes = stringToBytes(wakeupString);

  const payload = [
    LoraCommandCode.WAKEUP_DEVICE,
    0,
    wakeupBytes.length,
    ...wakeupBytes,
  ];
  return buildPacket(
    CommandType.LORA_WAKEUP,
    payload,
    stringToBytes(meterSerial)
  );
};
