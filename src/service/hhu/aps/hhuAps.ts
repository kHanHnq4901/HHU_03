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

const hexStringToBytes = (hex: string): number[] => {
  return hex
    .replace(/\s+/g, "")       
    .match(/.{1,2}/g)      
    ?.map(b => parseInt(b, 16)) || [];
};
export const intToBytes = (value: number): number[] => {
  const bytes = new Uint8Array(4); // Int32 = 4 byte
  const dataView = new DataView(bytes.buffer);
  dataView.setInt32(0, value, false); // false = big-endian, true = little-endian
  return Array.from(bytes);
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
  const meterSerialNum = parseInt(meterSerial, 10);
  return buildPacket(
    CommandType.LORA_GET_PARAM,
    [payload as number],
    intToBytes(meterSerialNum)
  );
};

export const buildSetParamPacket = (
  meterSerial: string,
  params: string
): number[] => {
  const paramBytes = hexStringToBytes(params);

  const payload = [
    LoraCommandCode.SETTING,
    1,                 
    paramBytes.length, 
    ...paramBytes,
  ];
  const meterSerialNum = parseInt(meterSerial, 10);
  return buildPacket(
    CommandType.LORA_SET_PARAM,
    payload,
    intToBytes(meterSerialNum)
  );
};

export const buildQueryDataPacket = (meterSerial: string): number[] => {
  const payload = [LoraCommandCode.QUERY_DATA,0x01];
  const meterSerialNum = parseInt(meterSerial, 10);
  return buildPacket(
    CommandType.LORA_QUERY_DATA,
    payload,
    intToBytes(meterSerialNum)
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
  const meterSerialNum = parseInt(meterSerial, 10);
  return buildPacket(
    CommandType.LORA_WAKEUP,
    payload,
    intToBytes(meterSerialNum)
  );
};
