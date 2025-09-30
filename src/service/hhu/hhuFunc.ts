import { Buffer } from 'buffer';
import { crc16_offset } from '../../util/crc16';
import struct from '../../util/cstruct';
import {
  Array2Struct,
  sizeof,
  Struct2Array,
} from '../../util/struct-and-array';
import {
  BufferToString,
  showAlert,
  showToast,
  sleep,
  StringFromArray,
} from '../../util';
import { BleFunc_Send, BleFunc_StartNotification } from './bleHhuFunc';
import { DeviceEventEmitter } from 'react-native';
import { UPDATE_FW_HHU } from '../event/constant';
import { navigation } from '../../component/header/controller';
import { screenDatas } from '../../shared';
import { PropsResponse } from './aps/hhuAps';

const TAG = 'hhuFunc: ';

type Identity_FrameType = {
  u32Tick: number;
  u16Length: number;
  au8IdentityBuff: number[];
  u8CountRecIdentity: number;
  bActive: boolean;
  bIdentityFinish: boolean;
};

type PropsObjHhu = {
  buffTx: Buffer;
  //startEndForm: PropsStartEndForm;
  identityFrame: Identity_FrameType;
  buffRx: Buffer;
  countRec: number;
  flag_rec: boolean;
};

const sizeIdentityHeader = 5;

export const HhuObj: PropsObjHhu = {
  buffTx: Buffer.alloc(512),
  buffRx: Buffer.alloc(512),
  identityFrame: {
    u32Tick: 0,
    u16Length: 0,
    au8IdentityBuff: new Array<number>(5),
    u8CountRecIdentity: 0,
    bActive: false,
    bIdentityFinish: false,
  },
  countRec: 0,
  flag_rec: false,
};

export const ObjSend: {
  type: 'USB' | 'BLE';
  id: null | string;
  isShakeHanded: boolean;
  isNeedUpdate: boolean;
} = {
  type: 'USB',
  id: null,
  isShakeHanded: false,
  isNeedUpdate: false,
};

export enum TYPE_HHU_CMD {
  CMD_APP_TRANSMIT_DEVICE_DATA_LORA = 0,
  CMD_APP_TRANSMIT_DEVICE_DATA_OPTICAL = 1,
  CMD_APP_CHANGE_NAME_BLE = 2,
  CMD_APP_GET_VERSION_FIRMWARE = 3,
  CMD_APP_UPDATE_FIRMWARE = 4,
}

export enum TYPE_HHU_REPONE {
  CMD_RECV_SUCCESS = 0,
  CMD_CHECK_CRC_FAIL = 1,
  CMD_INVAILD_COMMAND = 2,
  CMD_DEVICE_TRANSMIT_APP_DATA_LORA = 3,
  CMD_DEVICE_TRANSMIT_APP_DATA_OPTICAL = 4,
}
export const hhuFunc_HeaderType = struct(`
  uint8_t u8Cmd;
  uint16_t u16FSN;
  uint16_t u16Length;
`);

export type hhuFunc_HeaderProps = {
  u8Cmd: number | TYPE_HHU_CMD;
  u16FSN: number;
  u16Length: number;
};
export type hhuFunc_PropsObjAnalysis = {
  hhuHeader: hhuFunc_HeaderProps;
  payload: Buffer;
};
export type ResponseRxProps = {
  hhuHeader: hhuFunc_HeaderProps;
};

export async function hhuFunc_SendAckSerial(): Promise<boolean> {
  const hhuHeader: hhuFunc_HeaderProps = {
    u16Length: 0,
    u16FSN: 0xffff,
    u8Cmd: TYPE_HHU_CMD.ACK,
  };

  let result: boolean = await hhuFunc_Send(hhuHeader, undefined);
  return result;
}

export function onOKAlertNeedUpdatePress(): void {
  const screenData = screenDatas.find(item => item.id === 'BoardBLE');
  navigation.navigate('Drawer', {
    screen: 'BoardBLE',
    params: {
      info: screenData?.info ?? '',
      title: screenData?.title ?? '',
    },
  });
}

export async function hhuFunc_Send(
  header: hhuFunc_HeaderProps,
  payload?: Buffer,
): Promise<boolean> {
  let lengthPayload = sizeof(hhuFunc_HeaderType) + header.u16Length;

  // copy hhu header to buff tx
  Struct2Array(hhuFunc_HeaderType, header, HhuObj.buffTx, 0);

  // copy payload header to buffer
  payload?.copy(HhuObj.buffTx, sizeof(hhuFunc_HeaderType), 0, header.u16Length);

  /**caculate crc16 for frame uart */
  const crcUart = crc16_offset(HhuObj.buffTx, 0, lengthPayload);

  HhuObj.buffTx.writeUIntLE(crcUart, lengthPayload, 2);

  let lengthSend = lengthPayload + 2;

  let buffSend = Buffer.alloc(lengthSend);

  HhuObj.buffTx.copy(buffSend, 0, 0, lengthSend);
  HhuObj.countRec = 0;
  HhuObj.flag_rec = false;
  console.log('Send bytes: ', lengthSend);
  console.log(BufferToString(buffSend, 0, lengthSend, 16, true));
  if (ObjSend.id) {
    if (header.u8Cmd === TYPE_HHU_CMD.DATA) {
      if (ObjSend.isNeedUpdate === true) {
        showAlert('Cần cập nhật phiên bản mới cho thiết bị cầm tay', {
          label: 'Cập nhật',
          func: onOKAlertNeedUpdatePress,
        });
        return false;
      }
    }
    console.log (ObjSend.id)
    await BleFunc_Send(ObjSend.id, Array.from(buffSend));
    //console.log('here a');
    return true;
  } else {
    showToast('Chưa kết nối HHU');
    return false;
  }

  //SdbgPrint('send:' + BufferToString(HhuObj.buffTx, length_in_decode, 16));
}

export async function waitHHU(timeout: number): Promise<boolean> {
  const oldTick = Date.now();
  while (1) {
    if (Date.now() - oldTick >= timeout) {
      break;
    }
    if (HhuObj.flag_rec === true) {
      HhuObj.flag_rec = false;
      //console.log('Break by flag');
      return true;
    }
    await sleep(50);
  }
  return false;
}
export async function waitAframeHHU(timeout: number): Promise<boolean> {
  const oldTick = Date.now();
  while (1) {
    if (Date.now() - oldTick >= timeout) {
      break;
    }
    if (HhuObj.flag_rec === true) {
      HhuObj.flag_rec = false;
      //console.log('Break by flag');
      return true;
    }
    await sleep(50);
  }
  return false;
}
export async function hhuFunc_wait(timeout: number): Promise<PropsResponse> {
  let hhuHeader = {} as hhuFunc_HeaderProps;
  let response = {} as PropsResponse;
  response.bSucceed = false;

  response.obj = {} as hhuFunc_PropsObjAnalysis;
  HhuObj.identityFrame.bActive = false;
  //console.log('1');
  const bTimeout = await waitAframeHHU(timeout + 1200);
  //console.log('2');

  if (bTimeout === false) {
    console.log('timeout');
    response.strMessage = 'Quá thời gian';
    response.bSucceed = false;
    return response;
  }

  if (HhuObj.countRec < sizeIdentityHeader) {
    console.log('count rec so small');
    response.strMessage = 'count rec so small';
    response.bSucceed = false;
    return response;
  }

  const crc16FrameUart = crc16_offset(
    HhuObj.buffRx,
    0,
    HhuObj.countRec - 2 /*crc */,
  );
  const crc16Buff = HhuObj.buffRx.readUIntLE(HhuObj.countRec - 2 /*crc */, 2);

  // console.log('crc caculate:', crc16Caculate);
  // console.log('crc buff:', crc16Buff);

  if (crc16FrameUart !== crc16Buff) {
    console.log(TAG, 'CRC error');
    console.log(
      'BuffRx:',
      BufferToString(HhuObj.buffRx, 0, HhuObj.countRec, 16, true),
    );
    console.log('countRec:', HhuObj.countRec);
    console.log('crc16FrameUart:', crc16FrameUart.toString(16));
    console.log('crc16Buff:', crc16Buff.toString(16));

    response.strMessage = 'crc uart error';
    response.bSucceed = false;
    return response;
  }
  let index = 0;
  hhuHeader = Array2Struct(HhuObj.buffRx, index, hhuFunc_HeaderType);
  index += sizeof(hhuFunc_HeaderType);

  HhuObj.buffRx.copyWithin(0, index);
  HhuObj.countRec -= index;

  response.obj.hhuHeader = hhuHeader;
  response.obj.payload = HhuObj.buffRx.slice(0, hhuHeader.u16Length); //Buffer.from(HhuObj.buffRx, 0, hhuHeader.u16Length);

  console.log('hhuHeader:', hhuHeader);

  console.log('Rec func:', HhuObj.countRec - 2 /* crc */ + ' bytes');
  console.log(
    BufferToString(response.obj.payload, 0, hhuHeader.u16Length, 16, true),
  );


  response.bSucceed = true;
  return response;
}
export async function analysisRx(
  respond: ResponseRxProps,
  timeout: number,
): Promise<boolean> {
  let hhuHeader = {} as hhuFunc_HeaderProps;

  //console.log('1');
  const btimeout = await waitHHU(timeout + 2000);
  //console.log('2');

  if (btimeout === false) {
    console.log('timeout');
    return false;
  }

  if (HhuObj.countRec < sizeIdentityHeader) {
    return false;
  }

  const crc16FrameUart = crc16_offset(
    HhuObj.buffRx,
    0,
    HhuObj.countRec - 2 /*crc */,
  );
  const crc16Buff = HhuObj.buffRx.readUIntLE(HhuObj.countRec - 2 /*crc */, 2);

  // console.log('crc caculate:', crc16Caculate);
  // console.log('crc buff:', crc16Buff);

  if (crc16FrameUart !== crc16Buff) {
    console.log(TAG, 'CRC error');
    console.log(
      'BuffRx:',
      BufferToString(HhuObj.buffRx, 0, HhuObj.countRec, 16, true),
    );
    console.log('countRec:', HhuObj.countRec);
    console.log('crc16FrameUart:', crc16FrameUart.toString(16));
    console.log('crc16Buff:', crc16Buff.toString(16));
    return false;
  }
  let index = 0;
  hhuHeader = Array2Struct(HhuObj.buffRx, index, hhuFunc_HeaderType);
  index += sizeof(hhuFunc_HeaderType);

  HhuObj.buffRx.copyWithin(0, index);
  HhuObj.countRec -= index;

  respond.hhuHeader = hhuHeader;

  console.log('Rec func:', HhuObj.countRec + ' bytes');
  console.log(BufferToString(HhuObj.buffRx, 0, HhuObj.countRec, 16, true));
  console.log('str:', StringFromArray(HhuObj.buffRx, 0, HhuObj.countRec));

  // switch (hhuHeader.u8Cmd) {
  //   case TYPE_HHU_CMD.DATA:
  //     //
  //     break;
  //   case TYPE_HHU_CMD.DATA:
  //     //
  //     break;
  //   default:
  //     console.error('No type cmd in header hhu receive');
  //     return false;
  // }

  return true;
}

export async function readVersion(): Promise<string | null> {
  const header: hhuFunc_HeaderProps = {
    u8Cmd: TYPE_HHU_CMD.VERSION,
    u16FSN: 0xffff,
    u16Length: 0,
  };

  let bResult: boolean = await hhuFunc_Send(header);

  const respond = {} as ResponseRxProps;
  let version: string = '';
  if (bResult) {
    bResult = await analysisRx(respond, 2000);
    console.log('bResult:', bResult);
    if (bResult) {
      if (respond.hhuHeader.u8Cmd === TYPE_HHU_CMD.VERSION) {
        bResult = true;
        version = StringFromArray(
          HhuObj.buffRx,
          0,
          respond.hhuHeader.u16Length,
        );
      } else {
        version = 'Commnad không hợp lệ';
        console.log(TAG, 'No match command in shake hand');
        bResult = false;
      }
    } else {
      bResult = false;
      version = 'Timeout';
    }
  } else {
    bResult = false;
  }
  if (bResult === true) {
    return version;
  } else {
    return null;
  }
}

export async function setNameHHU(name: string): Promise<boolean> {
  const buff = Buffer.alloc(24);

  for (let i = 0; i < name.length; i++) {
    buff[i] = name.charCodeAt(i);
  }

  const header: hhuFunc_HeaderProps = {
    u8Cmd: TYPE_HHU_CMD.CHANGE_NAME,
    u16FSN: 0xffff,
    u16Length: buff.byteLength,
  };

  let bResult: boolean = await hhuFunc_Send(header, buff);

  const respond = {} as ResponseRxProps;
  if (bResult) {
    bResult = await analysisRx(respond, 2000);
    console.log('bResult:', bResult);
    if (bResult) {
      if (respond.hhuHeader.u8Cmd === TYPE_HHU_CMD.ACK) {
        bResult = true;
      } else {
        console.log(TAG, 'No match command in shake hand');
        bResult = false;
      }
    } else {
      bResult = false;
    }
  } else {
    bResult = false;
  }
  return bResult;
}

export async function resetBoard(cmd: TYPE_HHU_CMD): Promise<boolean> {
  const header: hhuFunc_HeaderProps = {
    u8Cmd: cmd,
    u16FSN: 0xffff,
    u16Length: 0,
  };

  let bResult: boolean = await hhuFunc_Send(header);

  const respond = {} as ResponseRxProps;
  if (bResult) {
    bResult = await analysisRx(respond, 3000);
    if (bResult) {
      if (respond.hhuHeader.u8Cmd === TYPE_HHU_CMD.ACK) {
        bResult = true;
      } else {
        console.log('Not desired ack');
        bResult = false;
      }
      if (
        cmd === TYPE_HHU_CMD.RESET_TO_PROGRAM ||
        cmd === TYPE_HHU_CMD.RESET_TO_SET_NAME
      ) {
        bResult = await analysisRx(respond, 7000);
        if (bResult) {
          if (respond.hhuHeader.u8Cmd === TYPE_HHU_CMD.ACK) {
            bResult = true;
          } else {
            console.log('Not desired ack at wait second');
            bResult = false;
          }
        }
      }
    }
  } else {
    bResult = false;
  }
  return bResult;
}
////// Meter start
async function sendSTARFunc(
  arr: Buffer,
  offset: number,
  length: number,
): Promise<boolean> {
  const header: hhuFunc_HeaderProps = {
    u8Cmd: TYPE_HHU_CMD.DATA,
    u16FSN: 0xffff,
    u16Length: 0,
  };

  header.u16Length = length;

  //const arrStr = BufferToString(arr, offset, length, 16, true);

  const buffSend = Buffer.from(arr, offset, length);

  //const buffSendStr = BufferToString(buffSend, 0, buffSend.length, 16, true);

  // console.log('arrStrLenth:', length);
  // console.log('arrStr:', arrStr);

  // console.log('buffSendStrLenth:', buffSend.length);
  // console.log('buffSendStr:', buffSendStr);

  let bResult: boolean = await hhuFunc_Send(header, buffSend);

  return bResult;
}

function clearBuffer() {
  HhuObj.flag_rec = false;
}

export function InitSTARMeter() {
  HhuApsHHM_Init({
    clearBuffer: clearBuffer,
    sendBuffer: sendSTARFunc,
  });
}
//////////
