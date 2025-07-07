import { Buffer } from 'buffer';
import { hookProps, setStatus } from '../../screen/boardBLE/controller';
import { int32_t, int64_t, uint32_t, uint8_t } from '../hhu/define';
import {
  analysisRx,
  hhuFunc_HeaderProps,
  hhuFunc_Send,
  ResponseRxProps,
  TYPE_HHU_CMD,
} from '../hhu/hhuFunc';

const TAG = 'bootloader:';

type char = string;
function ASCIItoHEX(ch: char) {
  if (ch >= '0' && ch <= '9') {
    return 0xff & ((0xff & ch.charCodeAt(0)) - 0x30);
  }
  if (ch >= 'A' && ch <= 'F') {
    return 0xff & ((0xff & ch.charCodeAt(0)) - 0x41 + 10);
  }
  if (ch >= 'a' && ch <= 'f') {
    return 0xff & ((0xff & ch.charCodeAt(0)) - 0x61 + 10);
  }
  return 0;
}

const bootVariable = {
  Flash: Buffer.alloc(0x40000),
  baseAddr: 0,
  currentPage: 0,
  pageSize: 256,
  BootSizeInt: 0,
  flashSize: 0,
  retries: 0,
  BytePtr: 0,
};

const SendMessage = (msg: string) => {
  hookProps.setState(state => {
    state.status = msg;
    return { ...state };
  });
};

const SetProgressBar = (value: number) => {
  hookProps.setState(state => {
    state.progressUpdate = value;
    return { ...state };
  });
};

enum Record_Type {
  DATA = 0,
  END_FILE = 1,
  EXTEND_SEGMENT = 2,
  BASE_ADDR = 4,
  START_ADDR_8086 = 5,
}

export function FillFlash(stringFirmware: string): boolean {
  bootVariable.flashSize = 0;
  bootVariable.currentPage = 0;

  let indexBuffFlash: uint32_t = 0;

  let index: int32_t = 0;
  let chArray: string[];

  let currentLine: int32_t = 0;
  let baseAddr: int64_t = 0;
  const arrStr = stringFirmware.split(/\r?\n/);
  for (let str of arrStr) {
    let sum: uint8_t = 0;
    index = 0;
    chArray = Array.from(str);
    if (chArray[index++] !== ':') {
      SendMessage('File Firmware lỗi: dòng ' + currentLine);
      return false;
    }
    let numByteDataPerLine: uint8_t =
      0xff &
      ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
    sum = 0xff & (sum + numByteDataPerLine);
    let highAddr: uint8_t =
      0xff &
      ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
    sum = 0xff & (sum + highAddr);
    let lowAddr: uint8_t =
      0xff &
      ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
    sum = 0xff & (sum + lowAddr);
    let recordType: uint8_t =
      0xff &
      ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
    sum = 0xff & (sum + recordType);
    //let addr: int32_t = (highAddr << 8) + lowAddr;
    switch (recordType) {
      case Record_Type.DATA:
        bootVariable.flashSize += numByteDataPerLine;
        for (let i = 0; i < numByteDataPerLine; i++) {
          bootVariable.Flash[indexBuffFlash] =
            0xff &
            ((ASCIItoHEX(chArray[index++]) << 4) +
              ASCIItoHEX(chArray[index++]));
          sum = 0xff & (sum + bootVariable.Flash[indexBuffFlash]);
          indexBuffFlash++;
        }
        break;

      case Record_Type.END_FILE:
        bootVariable.Flash.fill(
          0xff,
          bootVariable.flashSize,
          (Math.floor(bootVariable.flashSize / bootVariable.pageSize) + 1) *
            bootVariable.pageSize,
        );
        //console.log(Buffer.from(bootVariable.Flash, 0, 512));
        console.log('buff[0]', bootVariable.Flash[0]);
        console.log('buff[256]', bootVariable.Flash[256]);
        console.log('buff[512]', bootVariable.Flash[512]);
        SendMessage(
          'Kích thước ' + (bootVariable.flashSize / 1024).toFixed(1) + 'kb',
        );
        return true;

      case Record_Type.EXTEND_SEGMENT:
        highAddr =
          0xff &
          ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
        sum = 0xff & (sum + highAddr);
        lowAddr =
          0xff &
          ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
        sum = 0xff & (sum + lowAddr);
        baseAddr = (highAddr << 8) + lowAddr;
        baseAddr = baseAddr << 4;
        break;

      case Record_Type.BASE_ADDR:
        highAddr =
          0xff &
          ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
        sum = 0xff & (sum + highAddr);
        lowAddr =
          0xff &
          ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
        sum = 0xff & (sum + lowAddr);
        baseAddr = (highAddr << 8) + lowAddr;
        baseAddr = baseAddr << 0x10;
        bootVariable.baseAddr = baseAddr;
        break;
    }
    let checkSum: uint8_t =
      0xff &
      ((ASCIItoHEX(chArray[index++]) << 4) + ASCIItoHEX(chArray[index++]));
    sum = 0xff & (0x100 - sum);
    if (checkSum !== sum) {
      SendMessage('File Firmware lỗi ' + currentLine);
      return false;
    }
    currentLine++;
  }
  return false;
}

export const SendFlashPage = async (): Promise<boolean> => {
  bootVariable.currentPage = 0;
  bootVariable.retries = 0;
  let totalPage = 0;
  let numRetries = 3;
  if (bootVariable.flashSize % bootVariable.pageSize === 0) {
    totalPage = bootVariable.flashSize / 256;
  } else {
    totalPage = Math.ceil(bootVariable.flashSize / bootVariable.pageSize);
  }

  let buff = Buffer.alloc(2 + bootVariable.pageSize);
  for (
    bootVariable.currentPage = 0;
    bootVariable.currentPage < totalPage;
    bootVariable.currentPage++
  ) {
    let index = 0;
    buff.writeUIntLE(bootVariable.currentPage, index, 2);
    index += 2;
    console.log('current page:', bootVariable.currentPage);
    bootVariable.Flash.copy(
      buff,
      index,
      bootVariable.currentPage * bootVariable.pageSize,
      bootVariable.currentPage * bootVariable.pageSize + bootVariable.pageSize,
    );

    const hhuHeader: hhuFunc_HeaderProps = {
      u16Length: 0,
      u16FSN: -1,
      u8Cmd: TYPE_HHU_CMD.PROGRAMING,
    };

    if (bootVariable.currentPage === totalPage - 1) {
      hhuHeader.u16FSN = 0xffff;
    } else {
      hhuHeader.u16FSN++;
    }
    hhuHeader.u16Length = buff.byteLength;
    console.log('FSN:', hhuHeader.u16FSN);
    const respond = {} as ResponseRxProps;
    for (let j = 0; j < numRetries; j++) {
      let bResult = await hhuFunc_Send(hhuHeader, buff);
      if (bResult === true) {
        console.log('wait ...');
        bResult = await analysisRx(respond, 4000);
        console.log('wait bResult:', bResult);
        if (bResult) {
          if (respond.hhuHeader.u8Cmd === TYPE_HHU_CMD.ACK) {
            if (bootVariable.currentPage === totalPage - 1) {
              // succed
              // if (bootVariable.retries === 0) {
              //   SendMessage('Nạp Firmware thành công!');
              // } else {
              //   SendMessage('Nạp Firmware thành công! ' + bootVariable.retries);
              // }
              SetProgressBar(1);
              return true;
            } else {
              SetProgressBar(bootVariable.currentPage / totalPage);
            }
            break;
          } else {
            console.log('Not desired ack');
            continue;
          }
        } else {
          bootVariable.retries++;
          console.log('retries ...');

          if (j === numRetries - 1) {
            return false;
          } else {
            setStatus('Đang thử lại lần ' + j);
          }
          continue;
        }
      } else {
        console.log('send failed');
        return false;
      }
    }
  }

  return false;
};
