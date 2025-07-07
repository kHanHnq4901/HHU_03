import { bool, byte, char, decimal, int, long } from '../../../define';
import { Buffer } from 'buffer';
import {
  ArrayCopy,
  EncodingASCIIGetBytes,
  EncodingASCIIGetString,
} from '../util';
import { enumDataType } from './enumDataType';
import { Convert } from '../../../aps/util';
import { MyGloab } from './MyGloab';
import { MyGlobal } from './MyGlobal';
import { StruBoard } from './StruBoard';
import { METERTYPE } from './METERTYPE';
import { sleep } from '../../../../../util';

const TAG = 'CommuClass: ';

export type PropsCommunicationClass = {
  clearBuffer: () => void;
  //receiveBuffer: (arr: Buffer) => void;
  sendBuffer: (arr: Buffer, offset: byte, length: byte) => Promise<bool>;
  dataReturn: (buff: Buffer) => void;
};

export class CommuClass {
  public bflag21: bool = false;
  public bHhu: bool = false;
  public bisNew: bool = false;
  public bReal: bool = false;
  public bSearch: bool = false;
  public bVN31: bool = false;
  public bytBaud: Buffer = Buffer.alloc(2);
  public FisValid: bool = false;
  public static getReal: bool = false;
  public haveRecvbyte: bool = false;
  public isReadMdlNo: bool = false;
  public isReadVersion: bool = false;
  public isUpgrade: bool = false;
  public static meterNum: long = 0;
  // private SerialPort SPComm = new SerialPort();
  public stopFlag: bool = false;
  public static struBoard: StruBoard = {
    strnID: [],
    strnVal: [],
    sStateVal: [],
    meterType: METERTYPE.CPC_DTO1P,
    DTS27_Flag: false,
  };
  private props: PropsCommunicationClass = {
    clearBuffer: function (): void {
      //throw new Error("Function not implemented.");
    },

    sendBuffer: async function (
      arr: Buffer,
      offset: number,
      length: number,
    ): Promise<boolean> {
      //throw new Error("Function not implemented.");
      return Promise.resolve(false);
    },
    dataReturn: function (buff: Buffer): void {
      //throw new Error("Function not implemented.");
    },
  };

  public async SendFunc(
    arr: Buffer,
    offset: number,
    length: number,
  ): Promise<boolean> {
    return await this.props.sendBuffer(arr, offset, length);
  }

  constructor(props: PropsCommunicationClass) {
    console.log('constructor PropsCommuClass is called');
    this.props.clearBuffer = props.clearBuffer;
    //this.props.receiveBuffer = props.receiveBuffer;
    this.props.sendBuffer = props.sendBuffer;
    this.props.dataReturn = props.dataReturn;

    CommuClass.struBoard.strnID = new Array<string>(10);
    CommuClass.struBoard.strnVal = new Array<string>(10);
    CommuClass.struBoard.sStateVal = new Array<string>(10);
  }

  private async Sleep(ms: number) {
    //console.log('sleep:' + ms + ' ms');
    await sleep(ms);
  }

  private DataReturn(buff: Buffer) {
    this.props.dataReturn(buff);
  }

  private CheckSum(sendArray: Buffer, iStart: int, iLen: int): byte {
    let num2: byte = 0;
    for (let i = 0; i < iLen; i++) {
      num2 = 0xff & (num2 + sendArray[iStart + i]);
    }
    return num2;
  }

  private CheckXor(sendArray: Buffer, iStart: int, iLen: int): byte {
    let num2: byte = 0;
    for (let i = 0; i < iLen; i++) {
      num2 = 0xff & (num2 ^ sendArray[iStart + i]);
    }
    return num2;
  }

  private ClearPort() {
    this.props.clearBuffer();

    MyGloab.gISTimeOut = false;
  }

  // private Get21Frame(
  //   outData: Buffer,
  //   refBeginB: { beginB: int },
  //   WorR: byte,
  //   di: string,
  //   strData: string,
  // ) {
  //   let num2: int = 0;
  //   outData[refBeginB.beginB++] = 1;
  //   let iStart: int = refBeginB.beginB;
  //   outData[refBeginB.beginB++] = WorR;
  //   outData[refBeginB.beginB++] = 0x31;
  //   outData[refBeginB.beginB++] = 2;
  //   let bytes: Buffer = EncodingASCIIGetBytes(di);
  //   for (num2 = 0; num2 < di.length; num2++) {
  //     outData[refBeginB.beginB++] = bytes[num2];
  //   }
  //   outData[refBeginB.beginB++] = 40;
  //   bytes = EncodingASCIIGetBytes(strData);
  //   for (num2 = 0; num2 < strData.length; num2++) {
  //     outData[refBeginB.beginB++] = bytes[num2];
  //   }
  //   outData[refBeginB.beginB++] = 0x29;
  //   outData[refBeginB.beginB++] = 3;
  //   outData[refBeginB.beginB++] = this.CheckXor(
  //     outData,
  //     iStart,
  //     refBeginB.beginB - iStart,
  //   );
  // }

  public GetEnd(bArrayTmp: Buffer, nbegin: int, nEnd: int): int {
    for (let i = nbegin; i < nEnd; i++) {
      if (bArrayTmp[i] == 3) {
        return i;
      }
    }
    return -1;
  }

  private GetObisV(strOBIS: string, strValue: string): string {
    let str2: string = '0.0';
    let index: int = strValue.indexOf(strOBIS);
    if (index >= 0) {
      let str: string = strValue.substring(index);
      index = str.indexOf('(');
      let num2: int = str.indexOf(')');
      let str3: string = str.substring(0, index);
      let str4: string = str.substring(index + 1, index + 1 + num2 - index - 1);
      let length: int = str4.indexOf('*');
      str2 = str4.substring(0, length);
    }
    return str2;
  }

  // private GetPWDFrame(
  //   outData: Buffer,
  //   refBeginB: { beginB: int },
  //   strPWD: string,
  // ) {
  //   let num2: int = 0;
  //   outData[refBeginB.beginB++] = 1;
  //   let iStart: int = refBeginB.beginB;
  //   outData[refBeginB.beginB++] = 80;
  //   outData[refBeginB.beginB++] = 50;
  //   outData[refBeginB.beginB++] = 2;
  //   outData[refBeginB.beginB++] = 40;
  //   let bytes: Buffer = EncodingASCIIGetBytes(strPWD);
  //   strPWD = '';
  //   for (num2 = 0; num2 < bytes.length; num2++) {
  //     strPWD = strPWD + bytes[num2].toString(16).padStart(2, '0');
  //   }
  //   bytes = EncodingASCIIGetBytes(strPWD);
  //   for (num2 = 0; num2 < bytes.length; num2++) {
  //     outData[refBeginB.beginB++] = bytes[num2];
  //   }
  //   outData[refBeginB.beginB++] = 0x29;
  //   outData[refBeginB.beginB++] = 3;
  //   outData[refBeginB.beginB++] = this.CheckXor(
  //     outData,
  //     iStart,
  //     refBeginB.beginB - iStart,
  //   );
  // }

  public GetStart(bArrayTmp: Buffer, nbegin: int, nEnd: int): int {
    for (let i = nbegin; i < nEnd; i++) {
      if (bArrayTmp[i] == 2) {
        return i;
      }
    }
    return -1;
  }

  //[DllImport("coredll.dll")]
  public static GwesPowerOffSystem() {
    console.log(TAG, 'GwesPowerOffSystem but i dont have this function');
  }
  public nDataReturn(nReturn: Buffer) {
    if (!this.bisNew) {
      let str: string = '';
      let str2: string = '';
      let str3: string = '';
      let flag: bool = false;
      CommuClass.meterNum += 1;
      for (let i = 3; i <= 6; i++) {
        str2 = nReturn[i].toString(16).padStart(2, '0');
        if (str2.length == 1) {
          str2 = '0' + str2;
        }
        str = str + str2;
      }
      if (CommuClass.meterNum > 1) {
        for (let k: int = 1; k < CommuClass.meterNum; k++) {
          if (str == CommuClass.struBoard.strnID[k]) {
            flag = true;
            CommuClass.meterNum -= 1;
          }
        }
      }
      for (let j: int = 2; j < 6; j++) {
        str3 = str3 + Convert.ToString(nReturn[6 + j], 0x10).padStart(2, '0');
      }
      str3 = (Convert.ToDecimal(str3) / 100).toString();
      if (!flag) {
        CommuClass.struBoard.strnID[CommuClass.meterNum] = str;
        CommuClass.struBoard.strnVal[CommuClass.meterNum] = str3;
        CommuClass.struBoard.sStateVal[CommuClass.meterNum] =
          nReturn[12].toString();
        CommuClass.getReal = true;
      }
      if (flag) {
        CommuClass.getReal = true;
      }
    }
  }

  public nDataReturn2(nReturn: Buffer) {
    let num4: int = 0;
    let strValue: string = '';
    let length: int = nReturn.length;
    let str2: string = '';
    let strArray: string[] = new Array<string>(10);
    CommuClass.struBoard.sStateVal[0] = '1';
    if (nReturn[0] == 0x68 && nReturn[7] == 0x68) {
      let num3: int = 0;
      let str3: string = '';
      let num5: byte = 0;
      let num6: decimal = 0;
      let num7: decimal;
      let num8: decimal;
      let num9: decimal;
      if (nReturn[9] == 0x2f && nReturn[8] == 0x81) {
        for (num3 = 0; num3 < 6; num3++) {
          str2 =
            Convert.ToString(nReturn[1 + num3], 0x10).padStart(2, '0') + str2;
        }
        if (length > 0x13) {
          for (num3 = 0; num3 < 9; num3++) {
            str3 = '';
            num4 = 4;
            while (num4 >= 0) {
              num5 = 0xff & (nReturn[12 + num4 + num3 * 5] - 0x33);
              if (num4 == 1) {
                str3 =
                  str3 + Convert.ToString(num5, 0x10).padStart(2, '0') + '.';
              } else {
                str3 = str3 + Convert.ToString(num5, 0x10).padStart(2, '0');
              }
              num4--;
            }
            strArray[num3] = str3;
          }
          num6 = Convert.ToDecimal(strArray[1]);
          num7 = Convert.ToDecimal(strArray[2]);
          num8 = Convert.ToDecimal(strArray[3]);
          num9 = Convert.ToDecimal(strArray[0]);
          CommuClass.struBoard.strnID[0] = str2;
          CommuClass.struBoard.strnVal[0] = num6.toString();
          CommuClass.struBoard.strnVal[1] = num7.toString();
          CommuClass.struBoard.strnVal[2] = num8.toString();
          CommuClass.struBoard.strnVal[3] = num9.toString();
          CommuClass.struBoard.meterType = METERTYPE.DTS27_645;
          CommuClass.getReal = true;
        }
      } else if (nReturn[8] == 0x91) {
        let num10: int = (nReturn[9] - 4) / 4;
        for (num3 = 0; num3 < 6; num3++) {
          str2 =
            Convert.ToString(nReturn[1 + num3], 0x10).padStart(2, '0') + str2;
        }
        for (num3 = 0; num3 < num10; num3++) {
          str3 = '';
          num4 = 3;
          while (num4 >= 0) {
            num5 = 0xff & (nReturn[14 + num4 + num3 * 4] - 0x33);
            if (num4 == 1) {
              str3 = str3 + Convert.ToString(num5, 0x10).padStart(2, '0') + '.';
            } else {
              str3 = str3 + Convert.ToString(num5, 0x10).padStart(2, '0');
            }
            num4--;
          }
          strArray[num3] = str3;
        }
        CommuClass.struBoard.meterType = METERTYPE.DTS27_645_07;
        if (num10 >= 4) {
          num6 = Convert.ToDecimal(strArray[1]);
          num7 = Convert.ToDecimal(strArray[2]);
          num8 = Convert.ToDecimal(strArray[3]);
          num9 = Convert.ToDecimal(strArray[0]);
          CommuClass.struBoard.strnID[0] = str2;
          CommuClass.struBoard.strnVal[0] = num6.toString();
          CommuClass.struBoard.strnVal[1] = num7.toString();
          CommuClass.struBoard.strnVal[2] = num8.toString();
          CommuClass.struBoard.strnVal[3] = num9.toString();
        } else {
          CommuClass.struBoard.strnID[0] = str2;
          CommuClass.struBoard.strnVal[0] = Convert.ToDecimal(
            strArray[0],
          ).toString();
        }
        CommuClass.getReal = true;
      }
    } else {
      let num11: int = this.GetStart(nReturn, 0, nReturn.length - 1);
      for (
        let i = this.GetEnd(nReturn, 0, nReturn.length - 1);
        num11 >= 0 && i >= 0 && num11 < i;
        i = this.GetEnd(nReturn, i + 1, nReturn.length - 1)
      ) {
        strValue = '';
        for (num4 = num11 + 1; num4 < i; num4++) {
          strValue =
            strValue + EncodingASCIIGetString(nReturn, num4, 1).toString();
        }
        let index: int = strValue.indexOf('(');
        let num14: int = strValue.indexOf(')');
        let str4: string = strValue.substring(0, index);
        let str5: string = strValue.substring(
          index + 1,
          index + 1 + num14 - index - 1,
        );
        let num15: int = 0;
        switch (str4) {
          case '0.0.0': {
            let totalWidth: int = str5.length;
            str2 = str5.padStart(totalWidth, '0').padStart(8, '0');
            break;
          }
          case '1.9.0': {
            let num17: int = str5.indexOf('*');
            strArray[0] = str5.substring(0, num17);
            num15 = 1;
            CommuClass.struBoard.strnVal[0] = strArray[0];
            CommuClass.struBoard.sStateVal[0] = '1';
            break;
          }
          case '15.8.0':
            CommuClass.struBoard.strnVal[num15++] = this.GetObisV(
              '15.8.0',
              strValue,
            );
            CommuClass.struBoard.strnVal[num15++] = this.GetObisV(
              '15.8.1',
              strValue,
            );
            CommuClass.struBoard.strnVal[num15++] = this.GetObisV(
              '15.8.2',
              strValue,
            );
            CommuClass.struBoard.strnVal[num15++] = this.GetObisV(
              '15.8.3',
              strValue,
            );
            CommuClass.struBoard.strnVal[num15++] = this.GetObisV(
              '17.8.0',
              strValue,
            );
            CommuClass.struBoard.sStateVal[0] = num15.toString();
            break;
        }
        num11 = this.GetStart(nReturn, i + 1, nReturn.length - 1);
      }
      CommuClass.struBoard.strnID[0] = str2;
      CommuClass.struBoard.meterType = METERTYPE.MESH_RF;
      CommuClass.getReal = true;
    }
  }

  public nDataReturn2_RF(nReturn: Buffer) {
    let num2: int = 0;
    let str: string = '';
    let str2: string = '';
    let num: decimal = 0;
    for (num2 = 0; num2 < 4; num2++) {
      str = str + Convert.ToString(nReturn[1 + num2], 0x10).padStart(2, '0');
    }
    for (num2 = 0; num2 < 4; num2++) {
      str2 = str2 + Convert.ToString(nReturn[6 + num2], 0x10).padStart(2, '0');
    }
    num = Convert.ToDecimal(str2) / 100;
    CommuClass.struBoard.strnID[0] = str;
    CommuClass.struBoard.strnVal[0] = num.toString();
    CommuClass.struBoard.sStateVal[0] = nReturn[12].toString();
    CommuClass.struBoard.meterType = METERTYPE.PTP_RF;
    CommuClass.getReal = true;
  }

  public nDataReturn645(nReturn: Buffer) {
    let str: string = '';
    let str2: string = '';
    let str3: string = '';
    let flag: bool = false;
    CommuClass.meterNum += 1;
    for (let i = 1; i <= 6; i++) {
      str2 = nReturn[i].toString(16).padStart(2, '0');
      if (str2.length == 1) {
        str2 = '0' + str2;
      }
      str = str2 + str;
    }
    if (CommuClass.meterNum > 1) {
      for (let k: int = 1; k < CommuClass.meterNum; k++) {
        if (str == CommuClass.struBoard.strnID[k]) {
          flag = true;
          CommuClass.meterNum -= 1;
        }
      }
    }
    let str4: string = '';
    for (let j: int = 4; j >= 0; j--) {
      let num6: byte = 0xff & (nReturn[12 + j] - 0x33);
      if (j == 1) {
        str4 = str4 + Convert.ToString(num6, 0x10).padStart(2, '0') + '.';
      } else {
        str4 = str4 + Convert.ToString(num6, 0x10).padStart(2, '0');
      }
    }
    str3 = Convert.ToDecimal(str4).toString();
    if (!flag) {
      CommuClass.struBoard.strnID[CommuClass.meterNum] = str;
      CommuClass.struBoard.strnVal[CommuClass.meterNum] = str3;
      CommuClass.struBoard.sStateVal[CommuClass.meterNum] =
        nReturn[12].toString();
      CommuClass.getReal = true;
    }
    if (flag) {
      CommuClass.getReal = true;
    }
  }

  public orgBase(
    bytFramType: byte,
    strControlField: string,
    bContainDataField: bool,
    bContainLLCHead: bool,
    strDataField: string,
  ): Buffer {
    try {
      let buffer2: Buffer;
      strDataField = strDataField.replaceAll(' ', '');
      let num: int = 0;
      num++;
      num += 2;
      num++;
      num++;
      num++;
      if (bContainDataField) {
        num += 2;
        if (bContainLLCHead) {
          num += 3;
        }
        num += strDataField.length / 2;
      }
      num += 2;
      num++;
      let bytData: Buffer = Buffer.alloc(num);
      let destinationIndex: int = 0;
      bytData[destinationIndex++] = 0x7e;
      bytData[destinationIndex++] = bytFramType;
      bytData[destinationIndex++] = 0xff & (num - 2);
      bytData[destinationIndex++] = 3;
      bytData[destinationIndex++] = 0x21;
      bytData[destinationIndex++] = Convert.ToByte(strControlField, 0x10);
      if (bContainDataField) {
        buffer2 = MyGlobal.CalculateCRC(bytData, 1, destinationIndex - 1);
        ArrayCopy(buffer2, 0, bytData, destinationIndex, buffer2.length);
        destinationIndex += buffer2.length;
        if (bContainLLCHead) {
          bytData[destinationIndex++] = 230;
          bytData[destinationIndex++] = 230;
          bytData[destinationIndex++] = 0;
        }
        buffer2 = MyGlobal.Hex2Bytes(strDataField);
        ArrayCopy(buffer2, 0, bytData, destinationIndex, buffer2.length);
        destinationIndex += buffer2.length;
      }
      buffer2 = MyGlobal.CalculateCRC(bytData, 1, destinationIndex - 1);
      ArrayCopy(buffer2, 0, bytData, destinationIndex, buffer2.length);
      destinationIndex += buffer2.length;
      bytData[destinationIndex] = 0x7e;
      return bytData;
    } catch {
      console.log(TAG, 'Format frame fail:');
      return Buffer.alloc(0);
    }
  }

  public ReturnASCII(bAddr: byte, nIndex: int): byte {
    switch (
      Convert.ToInt32(
        Convert.ToString(bAddr, 0x10)
          .padStart(2, '0')
          .substring(nIndex, nIndex + 1),
      )
    ) {
      case 0:
        return 0x30;

      case 1:
        return 0x31;

      case 2:
        return 50;

      case 3:
        return 0x33;

      case 4:
        return 0x34;

      case 5:
        return 0x35;

      case 6:
        return 0x36;

      case 7:
        return 0x37;

      case 8:
        return 0x38;

      case 9:
        return 0x39;
    }
    return 0x30;
  }

  private ReturnDHeadE(strCode: string): string {
    let length: int = strCode.length;
    let startIndex: int = 0;
    for (let i = 0; i < length; i++) {
      let ch: char = strCode[i];
      if (ch.toString() != '0') {
        startIndex = i;
        break;
      }
    }
    return strCode.substring(startIndex, startIndex + length - startIndex);
  }

  public ReturnIsEnergy(enumDType: enumDataType): bool {
    let flag: bool = false;
    if (
      enumDType == enumDataType.Energy_DataType ||
      enumDType == enumDataType.Energy_DataType_180
    ) {
      flag = true;
    }
    if (
      enumDType == enumDataType.Energy_T1_DataType ||
      enumDType == enumDataType.Energy_T1_DataType_180
    ) {
      flag = true;
    }
    if (
      enumDType == enumDataType.Energy_T2_DataType ||
      enumDType == enumDataType.Energy_T2_DataType_180
    ) {
      flag = true;
    }
    if (
      enumDType == enumDataType.Energy_T3_DataType ||
      enumDType == enumDataType.Energy_T3_DataType_180
    ) {
      flag = true;
    }
    if (enumDType == enumDataType.Energy_T4_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Energy_VC_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Demand_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Demand_T1_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Demand_T2_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Demand_T3_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Demand_T4_DataType) {
      flag = true;
    }
    if (enumDType == enumDataType.Demand_VC_DataType) {
      flag = true;
    }
    return flag;
  }

  public async SendData(
    addrArray: Buffer,
    ctrlID: byte,
    dataArray: Buffer,
    serialNo: byte,
    bstate: byte,
  ): Promise<void> {
    console.log(TAG, 'SendData');

    this.stopFlag = false;
    let sendArray: Buffer = Buffer.alloc(15);
    sendArray[0] = 0xfe;
    sendArray[1] = 0xfe;
    sendArray[2] = 0x68;
    for (let i = 0; i < 4; i++) {
      sendArray[3 + i] = addrArray[i];
    }
    sendArray[7] = ctrlID;
    sendArray[8] = dataArray[0];
    sendArray[9] = dataArray[1];
    sendArray[10] = dataArray[2];
    sendArray[11] = serialNo;
    sendArray[12] = bstate;
    sendArray[13] = this.CheckSum(sendArray, 2, 12);
    sendArray[14] = 0x16;
    this.WriteLog(sendArray, 15);
    try {
      this.ClearPort();
      await this.SendFunc(sendArray, 0, 15);
      await this.Sleep(500);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  // public async SendLow(): Promise<void> {
  //   let buffer: Buffer = Buffer.alloc(720);
  //   for (let i = 0; i < 720; i++) {
  //     buffer[i] = 0;
  //   }
  //   this.stopFlag = false;
  //   this.ClearPort();
  //   await this.SendFunc(buffer, 0, 720);
  // }

  public async SendX328_Hand(
    bAddr: Buffer,
    bBlock: bool,
    nSerial: byte,
    nlen: int,
    strAdd: string,
    bOBISData: Buffer,
    bRead21: bool,
    nLen6: int,
  ) {
    console.log(TAG, 'SendX328_Hand');

    let num: int = 0x3a + nlen;
    let len: int = 0;
    let sendArray: Buffer = Buffer.alloc(num);
    sendArray[len++] = 0x68;
    sendArray[len++] = 0xff & num;
    sendArray[len++] = 0;
    sendArray[len++] = 0x7e;
    sendArray[len++] = 4;
    sendArray[len++] = this.bytBaud[1];
    sendArray[len++] = 240;
    sendArray[len++] = 0;
    sendArray[len++] = 0;
    sendArray[len++] = 1;
    let flag: bool = true;
    for (let i = 0; i < 6; i++) {
      if (MyGloab.sHHu[i] != 0) {
        flag = false;
      }
    }
    if (flag) {
      sendArray[len++] = 0xff;
      sendArray[len++] = 0xff;
      sendArray[len++] = 0xff;
      sendArray[len++] = 0xff;
      sendArray[len++] = 1;
      sendArray[len++] = 0xfd;
    } else {
      sendArray[len++] = MyGloab.sHHu[0];
      sendArray[len++] = MyGloab.sHHu[1];
      sendArray[len++] = MyGloab.sHHu[2];
      sendArray[len++] = MyGloab.sHHu[3];
      sendArray[len++] = MyGloab.sHHu[4];
      sendArray[len++] = MyGloab.sHHu[5];
    }
    sendArray[len++] = bAddr[0];
    sendArray[len++] = bAddr[1];
    sendArray[len++] = bAddr[2];
    sendArray[len++] = bAddr[3];
    sendArray[len++] = bAddr[4];
    sendArray[len++] = bAddr[5];
    sendArray[len++] = 2;
    sendArray[len++] = 1;
    sendArray[len++] = 0;
    sendArray[len++] = 0xd0;
    let num4: int = 30 + nlen - 1;
    sendArray[len++] = 0xff & num4;
    sendArray[len++] = 0x2f;
    sendArray[len++] = 0x3f;
    if (nLen6 > 0) {
      let bytes: Buffer = EncodingASCIIGetBytes(this.ReturnDHeadE(strAdd));
      for (let k: int = 0; k < nLen6; k++) {
        sendArray[len++] = bytes[k];
      }
      sendArray[len++] = 0x21;
      sendArray[len++] = 13;
      sendArray[len++] = 10;
    } else {
      sendArray[len++] = 0x21;
      sendArray[len++] = 13;
      sendArray[len++] = 10;
    }
    sendArray[len++] = 1;
    let iStart: int = len;
    if (bRead21) {
      sendArray[len++] = 0x52;
    } else {
      sendArray[len++] = 0x57;
    }
    sendArray[len++] = 0x31;
    sendArray[len++] = 2;
    let length: int = bOBISData.length;
    for (let j: int = 0; j < length; j++) {
      sendArray[len++] = bOBISData[j];
    }
    sendArray[len++] = 3;
    let num9: int = len;
    let iLen: int = num9 - iStart;
    sendArray[len++] = this.CheckXor(sendArray, iStart, iLen);
    sendArray[len++] = this.CheckSum(sendArray, 3, num - 5);
    sendArray[len++] = 0x16;
    this.WriteLog(sendArray, len);
    try {
      this.ClearPort();
      await this.SendFunc(sendArray, 0, len);
      await this.Sleep(100);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  // public SP_DataReceive(buff: Buffer) {
  //   //Sleep(100);
  //   try {
  //     let numByteReceived: int = 0;
  //     let buffer: Buffer = buff;
  //     let num2: int = 0;
  //     let num5: int = 0;
  //     let buffer2: Buffer;
  //     let num6: int;
  //     //bool flag;
  //     let num7: int;
  //     let num9: byte;
  //     if (!this.stopFlag) {
  //       numByteReceived = buffer.byteLength;
  //       //buffer = Buffer.alloc(num);
  //       //this.SPComm.Read(buffer, 0, num);
  //       // if (MyGloab.bSaveLog) {
  //       //   let str2: string = '';
  //       //   for (num2 = 0; num2 < num; num2++) {
  //       //     str2 = str2 + ' ' + buffer[num2].toString(16).padStart(2, '0');
  //       //   }
  //       //   MyGloab.InPutLog('R->  ' + str2);
  //       // }
  //       if (numByteReceived > 0) {
  //         this.haveRecvbyte = true;
  //       }
  //       if (this.isReadMdlNo) {
  //         if (numByteReceived >= 0x22) {
  //           let num3: int = 0;
  //           let num4: int = 0;
  //           for (num5 = 0; num5 < buffer.length; num5++) {
  //             if (buffer[num5] == 0x68) {
  //               num3 = num5;
  //               break;
  //             }
  //           }
  //           num5 = 0;
  //           while (num5 < buffer.length) {
  //             if (buffer[numByteReceived - 1 - num5] == 0x16) {
  //               num4 = num5;
  //               break;
  //             }
  //             num5++;
  //           }
  //           buffer2 = Buffer.alloc(numByteReceived - 13 - 2 - num3 - num4);
  //           for (num6 = 0; num6 < buffer2.length; num6++) {
  //             buffer2[num6] = buffer[13 + num6 + num3];
  //           }
  //           this.DataReturn(buffer2);
  //         }
  //         return;
  //       }
  //       if (this.isUpgrade) {
  //         this.bisNew = false;
  //         buffer2 = Buffer.alloc(0x13);
  //         num6 = 0;
  //         while (num6 < 0x13) {
  //           buffer2[num6] = buffer[num6];
  //           num6++;
  //         }
  //         this.DataReturn(buffer2);
  //         this.bReal = true;
  //       } else if (this.isReadVersion) {
  //         if (numByteReceived >= 0x2e) {
  //           this.DataReturn(buffer);
  //         }
  //       } else {
  //         if (this.bisNew) {
  //           // continue Label_054B;
  //           Label_054B(this);
  //           return;
  //         }
  //         num5 = 0;
  //         //flag = false;
  //         CommuClass.getReal = false;
  //         this.bReal = false;
  //         num7 = 0;
  //         if (numByteReceived != 0x31) {
  //           Label_0519(this);
  //           return;
  //         }
  //         while (num5 + 14 <= numByteReceived) {
  //           if (
  //             buffer[num5] == 0xfe &&
  //             buffer[num5 + 1] == 0xfe &&
  //             buffer[num5 + 2] == 0x68 &&
  //             buffer[numByteReceived - 1] == 0x16
  //           ) {
  //             if (
  //               this.CheckSum(buffer, num5 + 2, numByteReceived - 4 - num5) ==
  //               buffer[numByteReceived - 2]
  //             ) {
  //               buffer2 = Buffer.alloc(numByteReceived - num5);
  //               num6 = 0;
  //               while (num6 < numByteReceived - num5) {
  //                 buffer2[num6] = buffer[num5 + num6];
  //                 num6++;
  //               }
  //               this.DataReturn(buffer2);
  //             } else {
  //               console.log(TAG, 'Checksum Error!');
  //             }
  //             break;
  //           }
  //         }
  //       }
  //     }
  //     return;
  //     function Label_034D(_this: CommuClass) {
  //       if (
  //         buffer[num5] == 0xfe &&
  //         buffer[num5 + 1] == 0xfe &&
  //         buffer[num5 + 2] == 0x68 &&
  //         (buffer[num5 + 14] == 0x16 ||
  //           buffer[num5 + 0x12] == 0x16 ||
  //           buffer[num5 + 20] == 0x16)
  //       ) {
  //         if (numByteReceived >= 20) {
  //           if (buffer[num5 + 20] == 0x16) {
  //             num7 = 6;
  //           } else if (buffer[num5 + 0x12] == 0x16) {
  //             num7 = 4;
  //           }
  //         } else if (numByteReceived > 15 && buffer[num5 + 0x12] == 0x16) {
  //           num7 = 4;
  //         }
  //         let num8: byte = _this.CheckSum(buffer, num5 + 2, 11 + num7);
  //         if (!_this.bSearch) {
  //           if (num8 == buffer[num5 + 13 + num7]) {
  //             buffer2 = Buffer.alloc(15 + num5 + num7);
  //             for (num6 = 0; num6 < 15 + num5 + num7; num6++) {
  //               buffer2[num6] = buffer[num5 + num6];
  //             }
  //             _this.DataReturn(buffer2);
  //           } else {
  //             console.log(TAG, 'Checksum Error!');
  //           }
  //           return;
  //         }
  //         if (_this.bSearch && num8 == buffer[num5 + 13]) {
  //           buffer2 = Buffer.alloc(15);
  //           for (num6 = 0; num6 < 15; num6++) {
  //             buffer2[num6] = buffer[num5 + num6];
  //           }
  //           _this.nDataReturn(buffer2);
  //           _this.bReal = true;
  //         }
  //       }
  //       num5++;
  //       //Label_0519:
  //       Label_0519(_this);
  //       return;
  //     }
  //     function Label_0519(_this: CommuClass) {
  //       if (num5 + 14 <= numByteReceived) {
  //         //continue Label_034D;
  //         Label_034D(_this);
  //         return;
  //       }
  //       if (_this.bReal) {
  //         CommuClass.getReal = true;
  //       }
  //     }

  //     function Label_054B(_this: CommuClass) {
  //       if (_this.isUpgrade) {
  //         return;
  //       }
  //       num5 = 0;
  //       //flag = false;
  //       CommuClass.getReal = false;
  //       _this.bReal = false;
  //       if (numByteReceived == 0x13 && _this.bHhu) {
  //         num9 = _this.CheckSum(buffer, 3, 14);
  //         if (buffer[0x11] == num9) {
  //           buffer2 = Buffer.alloc(0x13);
  //           for (num6 = 0; num6 < 0x13; num6++) {
  //             buffer2[num6] = buffer[num5 + num6];
  //           }
  //           buffer2[11] = 0xc4;
  //           _this.DataReturn(buffer2);
  //           _this.bReal = true;
  //         }
  //       } else if (
  //         numByteReceived == 0x15 &&
  //         _this.bHhu &&
  //         buffer[0] == 0x68 &&
  //         buffer[3] == 0x8a &&
  //         buffer[10] == 3
  //       ) {
  //         num9 = _this.CheckSum(buffer, 3, 0x10);
  //         if (buffer[0x13] == num9) {
  //           buffer2 = Buffer.alloc(0x15);
  //           for (num6 = 0; num6 < 0x15; num6++) {
  //             buffer2[num6] = buffer[num5 + num6];
  //           }
  //           _this.DataReturn(buffer2);
  //           _this.bReal = true;
  //         }
  //       } else {
  //         let buffer3: Buffer;
  //         let num14: int;
  //         let num15: int;
  //         let num10: int = 0;
  //         let flag2: bool = false;
  //         let num11: int = 0;
  //         let num12: int = 0;
  //         if (_this.bflag21) {
  //           num6 = 0;
  //           num10 = 0;
  //           while (num6 < numByteReceived) {
  //             num10 = num6;
  //             num6 = num10;
  //             while (num6 < numByteReceived) {
  //               if (
  //                 buffer[num6] == 0x68 &&
  //                 (buffer[num6 + 3] == 190 || buffer[num6 + 3] == 0xfe)
  //               ) {
  //                 num10 = num6;
  //                 flag2 = true;
  //                 break;
  //               }
  //               num6++;
  //             }
  //             if (!flag2) {
  //               break;
  //             }
  //             num12 = buffer[num10 + 1];
  //             buffer3 = Buffer.alloc(num12);
  //             num14 = 0;
  //             while (num14 < num12) {
  //               buffer3[num14] = buffer[num14 + num10];
  //               num14++;
  //             }
  //             if (
  //               num12 > 20 &&
  //               _this.bflag21 &&
  //               _this.CheckSum(buffer3, num11 + 3, num12 - 5) ==
  //                 buffer3[num5 + num12 - 2]
  //             ) {
  //               num15 = 0;
  //               if (num15 >= 0) {
  //                 let num16: int = buffer3[0x1a];
  //                 buffer2 = Buffer.alloc(num16);
  //                 num14 = 0;
  //                 while (num14 < num16) {
  //                   buffer2[num14] = buffer3[0x1b + num14];
  //                   num14++;
  //                 }
  //                 if (_this.bflag21 && MyGloab.bBroad21) {
  //                   _this.nDataReturn2(buffer2);
  //                 } else if (_this.bflag21 && MyGloab.bBroad_PTP_RF) {
  //                   _this.nDataReturn2_RF(buffer2);
  //                 } else {
  //                   _this.DataReturn(buffer2);
  //                 }
  //                 _this.bReal = true;
  //               }
  //             }
  //             if (flag2) {
  //               num6 += num12;
  //             }
  //           }
  //         } else {
  //           let num17: int;
  //           if (MyGloab.bFlagVN31) {
  //             if (buffer.length < 0x21) {
  //               return;
  //             }
  //             let str3: string = EncodingASCIIGetString(
  //               buffer,
  //               0x1c,
  //               5,
  //             ).toString();
  //             if (
  //               buffer[0] == 0x68 &&
  //               buffer[3] == 190 &&
  //               buffer[0x1b] == 2 &&
  //               str3.indexOf('0.0.0') >= 0
  //             ) {
  //               num9 = _this.CheckSum(buffer, 3, numByteReceived - 1 - 2 - 2);
  //               if (buffer[numByteReceived - 2] == num9) {
  //                 buffer2 = Buffer.alloc(buffer.length - 0x1b - 2);
  //                 for (num6 = 0x1b; num6 < buffer.length - 2; num6++) {
  //                   buffer2[num6 - 0x1b] = buffer[num6];
  //                 }
  //                 _this.DataReturn(buffer2);
  //                 _this.bReal = true;
  //               }
  //               return;
  //             }
  //           }
  //           if (MyGloab.bBroad645) {
  //             num6 = 0;
  //             num10 = 0;
  //             while (num6 < numByteReceived) {
  //               num10 = num6;
  //               flag2 = false;
  //               num6 = num10;
  //               while (num6 < numByteReceived) {
  //                 if (
  //                   buffer[num6] == 0x68 &&
  //                   (buffer[num6 + 3] == 190 || buffer[num6 + 3] == 0xfe)
  //                 ) {
  //                   num10 = num6;
  //                   flag2 = true;
  //                   break;
  //                 }
  //                 num6++;
  //               }
  //               if (!flag2) {
  //                 break;
  //               }
  //               num12 = buffer[num10 + 1];
  //               buffer3 = Buffer.alloc(num12);
  //               num14 = 0;
  //               while (num14 < num12) {
  //                 buffer3[num14] = buffer[num14 + num10];
  //                 num14++;
  //               }
  //               if (
  //                 _this.CheckSum(buffer3, num11 + 3, num12 - 5) ==
  //                 buffer3[num5 + 0x2e]
  //               ) {
  //                 _this.FisValid = true;
  //                 num15 = 0;
  //                 num17 = 0;
  //                 while (num17 < num12) {
  //                   if (buffer3[num17] == 0x68 && buffer3[num17 + 7] == 0x68) {
  //                     num15 = num17;
  //                   }
  //                   num17++;
  //                 }
  //                 if (num15 > 0) {
  //                   buffer2 = Buffer.alloc(0x13);
  //                   for (let i = 0; i < 0x13; i++) {
  //                     buffer2[i] = buffer3[num15 + i];
  //                   }
  //                   _this.nDataReturn645(buffer2);
  //                   _this.bReal = true;
  //                 }
  //               }
  //               if (flag2) {
  //                 num6 += num12;
  //               }
  //             }
  //           } else {
  //             let str4: string = '';
  //             if (numByteReceived > 0x19) {
  //               for (num2 = 0; num2 < numByteReceived; num2++) {
  //                 str4 = str4 + ' ' + buffer[num2].toString(16);
  //               }
  //             }
  //             num6 = 0;
  //             while (num6 < numByteReceived) {
  //               if (
  //                 buffer[num6] == 0x68 &&
  //                 (buffer[num6 + 3] == 0xfe || buffer[num6 + 3] == 190)
  //               ) {
  //                 num10 = num6;
  //                 flag2 = true;
  //                 break;
  //               }
  //               num6++;
  //             }
  //             if (flag2) {
  //               num12 = buffer[num10 + 1];
  //               buffer3 = Buffer.alloc(num12);
  //               for (num14 = 0; num14 < num12; num14++) {
  //                 buffer3[num14] = buffer[num14 + num10];
  //               }
  //               if (
  //                 buffer3[0x19] == 2 ||
  //                 (buffer3[0x19] == 1 && num12 == 0x33)
  //               ) {
  //                 if (
  //                   _this.CheckSum(buffer3, num11 + 3, num12 - 5) ==
  //                   buffer3[num5 + num12 - 2]
  //                 ) {
  //                   _this.FisValid = true;
  //                   num15 = 0;
  //                   for (num17 = 0; num17 < num12 - 7; num17++) {
  //                     if (
  //                       buffer3[num17] == 0x68 &&
  //                       buffer3[num17 + 7] == 0x68
  //                     ) {
  //                       num15 = num17;
  //                     }
  //                   }
  //                   if (num15 > 0) {
  //                     if (
  //                       buffer3[num15 + 8] != 0x91 &&
  //                       buffer3[num15 + 8] != 0x81
  //                     ) {
  //                       _this.FisValid = false;
  //                     } else {
  //                       buffer2 = Buffer.alloc(num12 - 0x1d);
  //                       for (num6 = 0; num6 < num12 - 0x1d; num6++) {
  //                         buffer2[num6] = buffer3[num15 + num6];
  //                       }
  //                       _this.DataReturn(buffer2);
  //                       _this.bReal = true;
  //                     }
  //                   }
  //                 } else {
  //                   _this.FisValid = false;
  //                 }
  //               } else if (num12 >= 0x58) {
  //                 if (
  //                   _this.CheckSum(buffer3, num11 + 3, num12 - 5) ==
  //                   buffer3[num5 + num12 - 2]
  //                 ) {
  //                   _this.FisValid = true;
  //                   num15 = 0;
  //                   for (num17 = 0; num17 < num12 - 7; num17++) {
  //                     if (
  //                       buffer3[num17] == 0x68 &&
  //                       buffer3[num17 + 7] == 0x68
  //                     ) {
  //                       num15 = num17;
  //                     }
  //                   }
  //                   if (num15 > 0) {
  //                     buffer2 = Buffer.alloc(num12 - 0x1d);
  //                     for (num6 = 0; num6 < num12 - 0x1d; num6++) {
  //                       buffer2[num6] = buffer3[num15 + num6];
  //                     }
  //                     _this.DataReturn(buffer2);
  //                     _this.bReal = true;
  //                   }
  //                 } else {
  //                   _this.FisValid = false;
  //                 }
  //               } else if (num12 == 0x30) {
  //                 if (
  //                   _this.CheckSum(buffer3, num11 + 3, 0x2b) ==
  //                   buffer3[num5 + 0x2e]
  //                 ) {
  //                   _this.FisValid = true;
  //                   num15 = 0;
  //                   for (num17 = 0; num17 < num12 - 7; num17++) {
  //                     if (
  //                       buffer3[num17] == 0x68 &&
  //                       buffer3[num17 + 7] == 0x68
  //                     ) {
  //                       num15 = num17;
  //                     }
  //                   }
  //                   if (num15 > 0) {
  //                     buffer2 = Buffer.alloc(0x13);
  //                     for (num6 = 0; num6 < 0x13; num6++) {
  //                       buffer2[num6] = buffer3[num15 + num6];
  //                     }
  //                     _this.DataReturn(buffer2);
  //                     _this.bReal = true;
  //                   }
  //                 } else {
  //                   _this.FisValid = false;
  //                 }
  //               } else if (num12 == 0x2e || num12 == 0x2f) {
  //                 let flag3: bool = false;
  //                 if (num12 == 0x2e) {
  //                   if (
  //                     _this.CheckSum(buffer3, num11 + 3, 0x29) ==
  //                     buffer3[num5 + 0x2c]
  //                   ) {
  //                     flag3 = true;
  //                   }
  //                 } else if (
  //                   _this.CheckSum(buffer3, num11 + 3, 0x2a) ==
  //                   buffer3[num5 + 0x2d]
  //                 ) {
  //                   flag3 = true;
  //                 }
  //                 if (flag3) {
  //                   _this.FisValid = true;
  //                   num15 = 0;
  //                   for (num17 = 0; num17 < num12 - 7; num17++) {
  //                     if (
  //                       buffer3[num17] == 0x68 &&
  //                       buffer3[num17 + 7] == 0x68
  //                     ) {
  //                       num15 = num17;
  //                     }
  //                   }
  //                   if (num15 > 0) {
  //                     buffer2 = Buffer.alloc(0x11);
  //                     for (num6 = 0; num6 < 0x11; num6++) {
  //                       buffer2[num6] = buffer3[num15 + num6];
  //                     }
  //                     _this.DataReturn(buffer2);
  //                     _this.bReal = true;
  //                   }
  //                 } else {
  //                   _this.FisValid = false;
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   } catch (err: any) {
  //     console.log(TAG, 'err1:', err.message);
  //   }
  // }

  // public async SP_SendStr(DataStr: string) {
  //   let buffer: Buffer = MyGlobal.Hex2Bytes(DataStr);
  //   try {
  //     this.stopFlag = false;
  //     this.isUpgrade = true;
  //     await this.SendFunc(buffer, 0, buffer.length);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  public async SP_Send(
    addrArray: Buffer,
    ctrlID: byte,
    dataArray: Buffer,
    serialNo: byte,
    bstate: byte,
    bytType: byte,
  ) {
    console.log(TAG, 'SP_Send');

    let num: int = 0;
    this.stopFlag = false;
    let sendArray: Buffer = Buffer.alloc(20);
    sendArray[0] = 0xfe;
    sendArray[1] = 0xfe;
    sendArray[2] = 0x68;
    for (let i = 0; i < 4; i++) {
      sendArray[3 + i] = addrArray[i];
    }
    if (MyGloab.isOldPtpModule == 0) {
      num = 7;
    } else {
      sendArray[7] = 0xfb;
      sendArray[8] = this.bytBaud[0];
      sendArray[9] = 0;
      sendArray[10] = 0;
      sendArray[11] = 0;
      num = 12;
    }
    sendArray[num++] = ctrlID;
    sendArray[num++] = dataArray[0];
    sendArray[num++] = dataArray[1];
    sendArray[num++] = dataArray[2];
    sendArray[num++] = serialNo;
    sendArray[num++] = bstate;
    sendArray[num] = this.CheckSum(sendArray, 2, num - 2);
    num++;
    sendArray[num] = 0x16;
    this.WriteLog(sendArray, num + 1);
    try {
      this.ClearPort();
      await this.SendFunc(sendArray, 0, num + 1);
      await this.Sleep(100);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  // public async SP_SendDelay(
  //   addrArray: Buffer,
  //   ctrlID: byte,
  //   dataArray: Buffer,
  //   serialNo: byte,
  //   bstate: byte,
  //   delay_ms: int,
  //   bytType: byte,
  // ) {
  //   let num: int = 0;
  //   this.stopFlag = false;
  //   let sendArray: Buffer = Buffer.alloc(20);
  //   sendArray[0] = 0xfe;
  //   sendArray[1] = 0xfe;
  //   sendArray[2] = 0x68;
  //   for (let i = 0; i < 4; i++) {
  //     sendArray[3 + i] = addrArray[i];
  //   }
  //   if (bytType == 0) {
  //     num = 7;
  //   } else {
  //     sendArray[7] = 0xfb;
  //     sendArray[8] = this.bytBaud[0];
  //     sendArray[9] = 0;
  //     sendArray[10] = 0;
  //     sendArray[11] = 0;
  //     num = 12;
  //   }
  //   sendArray[num++] = ctrlID;
  //   sendArray[num++] = dataArray[0];
  //   sendArray[num++] = dataArray[1];
  //   sendArray[num++] = dataArray[2];
  //   sendArray[num++] = serialNo;
  //   sendArray[num++] = bstate;
  //   sendArray[num] = this.CheckSum(sendArray, 2, num - 2);
  //   num++;
  //   sendArray[num] = 0x16;
  //   this.WriteLog(sendArray, num + 1);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, num + 1);
  //     await this.Sleep(delay_ms);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  public async SP_SendCPC_PWD(addrArray: Buffer, ctrlID: byte, delay_ms: int) {
    console.log(TAG, 'SP_SendCPC_PWD');

    this.stopFlag = false;
    let sendArray: Buffer = Buffer.alloc(15);
    sendArray[0] = 0xfe;
    sendArray[1] = 0xfe;
    sendArray[2] = 0x68;
    for (let i = 0; i < 4; i++) {
      sendArray[3 + i] = addrArray[i];
    }
    sendArray[7] = 0x21;
    sendArray[8] = ctrlID;
    sendArray[9] = 0;
    sendArray[10] = 1;
    sendArray[11] = 1;
    sendArray[12] = 0;
    sendArray[13] = this.CheckSum(sendArray, 2, 11);
    sendArray[14] = 0x16;
    this.WriteLog(sendArray, 15);
    try {
      this.ClearPort();
      await this.SendFunc(sendArray, 0, 15);
      await this.Sleep(delay_ms);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  public async sp_SendDLMSArrLog(
    addrArray1: Buffer,
    broad: bool,
    Log_Ns: string[],
    Class_id: string,
    Attribt: string,
    AFNno: byte,
    FirstFrame: bool,
  ) {
    console.log(TAG, 'sp_SendDLMSArrLog');

    let destinationArray: Buffer = Buffer.alloc(0xff);

    destinationArray[0] = 0x68;
    let num: int = 0;
    destinationArray[1] = 0x2f;
    destinationArray[2] = 0;
    destinationArray[3] = 0x7e;
    destinationArray[4] = 4;
    destinationArray[5] = this.bytBaud[1];
    destinationArray[6] = 0x30;
    destinationArray[7] = 0;
    destinationArray[8] = 0;
    destinationArray[9] = AFNno;
    destinationArray[10] = 0x21;
    destinationArray[11] = 0;
    destinationArray[12] = 0;
    destinationArray[13] = 0;
    destinationArray[14] = 0;
    destinationArray[15] = 0xfd;
    if (broad) {
      destinationArray[0x10] = 0xff;
      destinationArray[0x11] = 0xff;
      destinationArray[0x12] = 0xff;
      destinationArray[0x13] = 0xff;
      destinationArray[20] = 0xff;
      destinationArray[0x15] = 0xff;
    } else {
      destinationArray[0x10] = addrArray1[0];
      destinationArray[0x11] = addrArray1[1];
      destinationArray[0x12] = addrArray1[2];
      destinationArray[0x13] = addrArray1[3];
      destinationArray[20] = addrArray1[4];
      destinationArray[0x15] = addrArray1[5];
    }
    destinationArray[0x16] = 2;
    destinationArray[0x17] = 1;
    destinationArray[0x18] = 0;
    destinationArray[0x19] = 0xd1;
    let num2: int = 0;
    destinationArray[0x1a] = 0xff & num2;
    destinationArray[0x1b] = 0x2f;
    destinationArray[0x1c] = 0x3f;
    destinationArray[0x1d] = this.ReturnASCII(addrArray1[5], 0);
    destinationArray[30] = this.ReturnASCII(addrArray1[5], 1);
    destinationArray[0x1f] = this.ReturnASCII(addrArray1[4], 0);
    destinationArray[0x20] = this.ReturnASCII(addrArray1[4], 1);
    destinationArray[0x21] = this.ReturnASCII(addrArray1[3], 0);
    destinationArray[0x22] = this.ReturnASCII(addrArray1[3], 1);
    destinationArray[0x23] = this.ReturnASCII(addrArray1[2], 0);
    destinationArray[0x24] = this.ReturnASCII(addrArray1[2], 1);
    destinationArray[0x25] = this.ReturnASCII(addrArray1[1], 0);
    destinationArray[0x26] = this.ReturnASCII(addrArray1[1], 1);
    destinationArray[0x27] = this.ReturnASCII(addrArray1[0], 0);
    destinationArray[40] = this.ReturnASCII(addrArray1[0], 1);
    destinationArray[0x29] = 0x21;
    destinationArray[0x2a] = 13;
    destinationArray[0x2b] = 10;
    destinationArray[0x2c] = 0x7e;
    let num3: int = 0x2d;
    if (FirstFrame) {
      let sourceArray: Buffer = Buffer.from([
        0x7e, 160, 0x20, 3, 0x21, 0x93, 0x7d, 0xd9, 0x81, 0x80, 20, 5, 2, 0,
        0x80, 6, 2, 0, 0x80, 7, 4, 0, 0, 0, 1, 8, 4, 0, 0, 0, 1, 0xce, 0x6a,
        0x7e,
      ]);
      ArrayCopy(
        sourceArray,
        0,
        destinationArray,
        num3 + num2,
        sourceArray.length,
      );
      num2 += sourceArray.length;
      let buffer3: Buffer = Buffer.from([
        0x7e, 160, 0x2b, 3, 0x21, 0x10, 0xfb, 0xaf, 230, 230, 0, 0x60, 0x1d,
        0xa1, 9, 6, 7, 0x60, 0x85, 0x74, 5, 8, 1, 1, 190, 0x10, 4, 14, 1, 0, 0,
        0, 6, 0x5f, 0x1f, 4, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x9d, 0xf8,
        0x7e,
      ]);
      ArrayCopy(buffer3, 0, destinationArray, num3 + num2, buffer3.length);
      num2 += buffer3.length;
    }
    for (let i = 0; i < Log_Ns.length; i++) {
      let buffer4: Buffer = this.orgBase(
        160,
        MyGlobal.getControlFieldForI(),
        true,
        true,
        'C001C100' + Class_id + Log_Ns[i] + Attribt,
      );
      ArrayCopy(buffer4, 0, destinationArray, num3 + num2, buffer4.length);
      num2 += buffer4.length;
      MyGlobal.varHDLC.bytClientRRR =
        0xff & (MyGlobal.varHDLC.bytClientRRR + 1);
      MyGlobal.varHDLC.bytClientSSS =
        0xff & (MyGlobal.varHDLC.bytClientSSS + 1);
    }
    num2 += 0x12;
    destinationArray[0x1a] = 0xff & num2;
    num = 0x1b + num2 + 2;
    destinationArray[1] =
      0xff &
      Convert.ToInt16(
        num
          .toString(16)
          .padStart(4, '0')
          .substring(2, 2 + 2),
        0x10,
      );
    destinationArray[2] =
      0xff &
      Convert.ToInt16(
        num
          .toString(16)
          .padStart(4, '0')
          .substring(0, 0 + 2),
        0x10,
      );
    destinationArray[0x1b + num2] = this.CheckSum(
      destinationArray,
      3,
      0x1b + num2 - 1 - 2,
    );
    destinationArray[0x1b + num2 + 1] = 0x16;
    try {
      this.WriteLog(destinationArray, 0x1b + num2 + 2);
      this.bisNew = true;
      this.isUpgrade = false;
      await this.SendFunc(destinationArray, 0, 0x1b + num2 + 1 + 1);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  public async sp_SendDLMS(
    addrArray1: Buffer,
    broad: bool,
    Log_N: string,
    Class_id: string,
    Attribt: string,
    AFNno: byte,
    FirstFrame: bool,
  ) {
    console.log(TAG, 'sp_SendDLMS');

    let destinationArray: Buffer = Buffer.alloc(0xff);

    destinationArray[0] = 0x68;
    let num: int = 0;
    destinationArray[1] = 0x2f;
    destinationArray[2] = 0;
    destinationArray[3] = 0x7e;
    destinationArray[4] = 4;
    destinationArray[5] = this.bytBaud[1];
    destinationArray[6] = 0x30;
    destinationArray[7] = 0;
    destinationArray[8] = 0;
    destinationArray[9] = AFNno;
    destinationArray[10] = 0x21;
    destinationArray[11] = 0;
    destinationArray[12] = 0;
    destinationArray[13] = 0;
    destinationArray[14] = 0;
    destinationArray[15] = 0xfd;
    if (broad) {
      destinationArray[0x10] = 0xff;
      destinationArray[0x11] = 0xff;
      destinationArray[0x12] = 0xff;
      destinationArray[0x13] = 0xff;
      destinationArray[20] = 0xff;
      destinationArray[0x15] = 0xff;
    } else {
      destinationArray[0x10] = addrArray1[0];
      destinationArray[0x11] = addrArray1[1];
      destinationArray[0x12] = addrArray1[2];
      destinationArray[0x13] = addrArray1[3];
      destinationArray[20] = addrArray1[4];
      destinationArray[0x15] = addrArray1[5];
    }
    destinationArray[0x16] = 2;
    destinationArray[0x17] = 1;
    destinationArray[0x18] = 0;
    destinationArray[0x19] = 0xd1;
    let num2: int = 0;
    destinationArray[0x1a] = 0xff & num2;
    destinationArray[0x1b] = 0x2f;
    destinationArray[0x1c] = 0x3f;
    destinationArray[0x1d] = this.ReturnASCII(addrArray1[5], 0);
    destinationArray[30] = this.ReturnASCII(addrArray1[5], 1);
    destinationArray[0x1f] = this.ReturnASCII(addrArray1[4], 0);
    destinationArray[0x20] = this.ReturnASCII(addrArray1[4], 1);
    destinationArray[0x21] = this.ReturnASCII(addrArray1[3], 0);
    destinationArray[0x22] = this.ReturnASCII(addrArray1[3], 1);
    destinationArray[0x23] = this.ReturnASCII(addrArray1[2], 0);
    destinationArray[0x24] = this.ReturnASCII(addrArray1[2], 1);
    destinationArray[0x25] = this.ReturnASCII(addrArray1[1], 0);
    destinationArray[0x26] = this.ReturnASCII(addrArray1[1], 1);
    destinationArray[0x27] = this.ReturnASCII(addrArray1[0], 0);
    destinationArray[40] = this.ReturnASCII(addrArray1[0], 1);
    destinationArray[0x29] = 0x21;
    destinationArray[0x2a] = 13;
    destinationArray[0x2b] = 10;
    destinationArray[0x2c] = 0x7e;
    let num3: int = 0x2d;
    if (FirstFrame) {
      let buffer2: Buffer = Buffer.from([
        0x7e, 160, 0x20, 3, 0x21, 0x93, 0x7d, 0xd9, 0x81, 0x80, 20, 5, 2, 0,
        0x80, 6, 2, 0, 0x80, 7, 4, 0, 0, 0, 1, 8, 4, 0, 0, 0, 1, 0xce, 0x6a,
        0x7e,
      ]);
      ArrayCopy(buffer2, 0, destinationArray, num3 + num2, buffer2.length);
      num2 += buffer2.length;
      let buffer3: Buffer = Buffer.from([
        0x7e, 160, 0x2b, 3, 0x21, 0x10, 0xfb, 0xaf, 230, 230, 0, 0x60, 0x1d,
        0xa1, 9, 6, 7, 0x60, 0x85, 0x74, 5, 8, 1, 1, 190, 0x10, 4, 14, 1, 0, 0,
        0, 6, 0x5f, 0x1f, 4, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x9d, 0xf8,
        0x7e,
      ]);
      ArrayCopy(buffer3, 0, destinationArray, num3 + num2, buffer3.length);
      num2 += buffer3.length;
    }
    let sourceArray: Buffer = this.orgBase(
      160,
      MyGlobal.getControlFieldForI(),
      true,
      true,
      'C001C100' + Class_id + Log_N + Attribt,
    );
    ArrayCopy(
      sourceArray,
      0,
      destinationArray,
      num3 + num2,
      sourceArray.length,
    );
    num2 = num2 + sourceArray.length + 0x12;
    destinationArray[0x1a] = 0xff & num2;
    num = 0x1b + num2 + 2;
    destinationArray[1] =
      0xff &
      Convert.ToInt16(
        num
          .toString(16)
          .padStart(4, '0')
          .substring(2, 2 + 2),
        0x10,
      );
    destinationArray[2] =
      0xff &
      Convert.ToInt16(
        num
          .toString(16)
          .padStart(4, '0')
          .substring(0, 0 + 2),
        0x10,
      );
    destinationArray[0x1b + num2] = this.CheckSum(
      destinationArray,
      3,
      0x1b + num2 - 1 - 2,
    );
    destinationArray[0x1b + num2 + 1] = 0x16;
    try {
      this.WriteLog(destinationArray, 0x1b + num2 + 2);
      this.bisNew = true;
      this.isUpgrade = false;
      await this.SendFunc(destinationArray, 0, 0x1b + num2 + 1 + 1);
      MyGlobal.varHDLC.bytClientRRR =
        0xff & (MyGlobal.varHDLC.bytClientRRR + 1);
      MyGlobal.varHDLC.bytClientSSS =
        0xff & (MyGlobal.varHDLC.bytClientSSS + 1);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  // public async sp_SendElster(
  //   addrArray1: Buffer,
  //   broad: bool,
  //   nSerial: byte,
  //   addr2: Buffer,
  //   nlen6: int,
  //   writeOrR: byte,
  //   enumDType: enumDataType,
  //   strPWD: string,
  // ) {
  //   let outData: Buffer = Buffer.alloc(0xff);
  //   this.stopFlag = false;
  //   outData[0] = 0x68;
  //   outData[1] = 0;
  //   outData[2] = 0;
  //   outData[3] = 0x7e;
  //   outData[4] = 4;
  //   outData[5] = 0xff & (this.bytBaud[1] + 1);
  //   outData[6] = 0;
  //   outData[7] = 0;
  //   outData[8] = 0;
  //   if (broad) {
  //     outData[9] = nSerial;
  //   } else {
  //     outData[9] = 6;
  //   }
  //   let flag: bool = true;
  //   for (let i = 0; i < 6; i++) {
  //     if (MyGloab.sHHu[i] != 0) {
  //       flag = false;
  //     }
  //   }
  //   if (flag) {
  //     outData[10] = 0x21;
  //     outData[11] = 0x47;
  //     outData[12] = 0;
  //     outData[13] = 0;
  //     outData[14] = 0;
  //     outData[15] = 0xfd;
  //   } else {
  //     outData[10] = MyGloab.sHHu[0];
  //     outData[11] = MyGloab.sHHu[1];
  //     outData[12] = MyGloab.sHHu[2];
  //     outData[13] = MyGloab.sHHu[3];
  //     outData[14] = MyGloab.sHHu[4];
  //     outData[15] = MyGloab.sHHu[5];
  //   }
  //   if (broad) {
  //     outData[0x10] = 0xff;
  //     outData[0x11] = 0xff;
  //     outData[0x12] = 0xff;
  //     outData[0x13] = 0xff;
  //     outData[20] = 0xff;
  //     outData[0x15] = 0xff;
  //   } else {
  //     outData[0x10] = addrArray1[0];
  //     outData[0x11] = addrArray1[1];
  //     outData[0x12] = addrArray1[2];
  //     outData[0x13] = addrArray1[3];
  //     outData[20] = addrArray1[4];
  //     outData[0x15] = addrArray1[5];
  //   }
  //   outData[0x16] = 2;
  //   outData[0x17] = 1;
  //   outData[0x18] = 0;
  //   outData[0x19] = 0xd0;
  //   outData[0x1a] = 0;
  //   outData[0x1b] = 0x2f;
  //   outData[0x1c] = 0x3f;
  //   if (nlen6 > 0) {
  //     for (let j: int = 0; j < nlen6; j++) {
  //       outData[0x1d + j] = addr2[j];
  //     }
  //     outData[0x1d + nlen6] = 0x21;
  //     outData[30 + nlen6] = 13;
  //     outData[0x1f + nlen6] = 10;
  //   } else {
  //     outData[0x1d] = 0x21;
  //     outData[30] = 13;
  //     outData[0x1f] = 10;
  //   }
  //   // let beginB :int = 0x20 + nlen6;
  //   let refBeginB = {
  //     beginB: 0x20 + nlen6,
  //   };
  //   if (strPWD != '') {
  //     this.GetPWDFrame(outData, refBeginB, strPWD);
  //   }
  //   if (enumDType == enumDataType.Energy_DataType) {
  //     this.Get21Frame(outData, refBeginB, writeOrR, '507001', '40');
  //   } else if (enumDType == enumDataType.Energy_T1_DataType) {
  //     this.Get21Frame(outData, refBeginB, writeOrR, '508001', '40');
  //   } else if (enumDType == enumDataType.Demand_DataType) {
  //     this.Get21Frame(outData, refBeginB, writeOrR, '509001', '40');
  //   } else if (enumDType == enumDataType.Demand_T1_DataType) {
  //     this.Get21Frame(outData, refBeginB, writeOrR, '510001', '40');
  //   } else if (enumDType == enumDataType.Demand_T2_DataType) {
  //     this.Get21Frame(outData, refBeginB, writeOrR, '510002', '40');
  //   } else if (enumDType == enumDataType.Demand_T3_DataType) {
  //     this.Get21Frame(outData, refBeginB, writeOrR, '510003', '40');
  //   } else if (enumDType == enumDataType.Voltage_DataType) {
  //     this.Get21Frame(outData, refBeginB, 0x57, '605001', '1B2B4B00');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '606001', '1C');
  //   } else if (enumDType == enumDataType.Curerent_DataType) {
  //     this.Get21Frame(outData, refBeginB, 0x57, '605001', '1A2A4A00');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '605001', '04');

  //     this.Get21Frame(outData, refBeginB, 0x52, '606001', '1C');
  //   }
  //   outData[1] = 0xff & (refBeginB.beginB + 2);
  //   outData[0x1a] = 0xff & (refBeginB.beginB - 0x1b);
  //   outData[refBeginB.beginB++] = this.CheckSum(
  //     outData,
  //     3,
  //     refBeginB.beginB - 3,
  //   );
  //   outData[refBeginB.beginB++] = 0x16;
  //   this.WriteLog(outData, refBeginB.beginB);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(outData, 0, refBeginB.beginB);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendEx() {
  //   this.stopFlag = false;
  //   let sendD: Buffer = Buffer.from([
  //     0xfe,
  //     0xfe,
  //     0x68,
  //     0x2d,
  //     0,
  //     0x7e,
  //     4,
  //     this.bytBaud[1],
  //     0,
  //     0xb0,
  //     4,
  //     2,
  //     0xff,
  //     0xff,
  //     0xff,
  //     0xff,
  //     1,
  //     0xfd,
  //     0xff,
  //     0xff,
  //     0xff,
  //     0xff,
  //     0xff,
  //     0xff,
  //     2,
  //     1,
  //     0,
  //     1,
  //     0x10,
  //     0xfe,
  //     0xfe,
  //     0x68,
  //     0x99,
  //     0x99,
  //     0x99,
  //     0x99,
  //     0x99,
  //     0x99,
  //     0x68,
  //     1,
  //     2,
  //     0x65,
  //     0xf3,
  //     0xc1,
  //     0x16,
  //     0xd4,
  //     0x16,
  //   ]);
  //   try {
  //     this.WriteLog(sendD, 0x2f);
  //     this.ClearPort();
  //     await this.SendFunc(sendD, 0, 0x2f);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public SP_SendGELEX(addrArray: Buffer, ctrlID: byte) {
  //   this.stopFlag = false;
  //   let sendArray: Buffer = Buffer.alloc(15);
  //   sendArray[0] = 0xfe;
  //   sendArray[1] = 0xfe;
  //   sendArray[2] = 0x68;
  //   for (let i = 0; i < 4; i++) {
  //     sendArray[3 + i] = addrArray[i];
  //   }
  //   sendArray[7] = 0x20;
  //   sendArray[8] = 0;
  //   sendArray[9] = 0;
  //   sendArray[10] = 1;
  //   sendArray[11] = ctrlID;
  //   sendArray[12] = 0;
  //   sendArray[13] = this.CheckSum(sendArray, 2, 11);
  //   sendArray[14] = 0x16;
  //   this.WriteLog(sendArray, 15);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, 15);
  //     await this.Sleep(100);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  public async sp_SendPower(
    addrArray1: Buffer,
    diCtrl: Buffer,
    bySerial: byte,
  ) {
    console.log(TAG, 'sp_SendPower');
    let sendArray: Buffer = Buffer.alloc(0x2d);
    sendArray[0] = 0x68;
    sendArray[1] = 0x2d;
    sendArray[2] = 0;
    sendArray[3] = 0x7e;
    sendArray[4] = 4;
    sendArray[5] = this.bytBaud[0];
    sendArray[6] = 0;
    sendArray[7] = 0;
    sendArray[8] = 0;
    sendArray[9] = 0;
    let flag: bool = true;
    for (let i = 0; i < 6; i++) {
      if (MyGloab.sHHu[i] != 0) {
        flag = false;
      }
    }
    if (flag) {
      sendArray[10] = 0xff;
      sendArray[11] = 0xff;
      sendArray[12] = 0xff;
      sendArray[13] = 0xff;
      sendArray[14] = 1;
      sendArray[15] = 0xfd;
    } else {
      sendArray[10] = MyGloab.sHHu[0];
      sendArray[11] = MyGloab.sHHu[1];
      sendArray[12] = MyGloab.sHHu[2];
      sendArray[13] = MyGloab.sHHu[3];
      sendArray[14] = MyGloab.sHHu[4];
      sendArray[15] = MyGloab.sHHu[5];
    }
    sendArray[0x10] = addrArray1[0];
    sendArray[0x11] = addrArray1[1];
    sendArray[0x12] = addrArray1[2];
    sendArray[0x13] = addrArray1[3];
    sendArray[20] = addrArray1[4];
    sendArray[0x15] = addrArray1[5];
    sendArray[0x16] = 2;
    sendArray[0x17] = 1;
    sendArray[0x18] = 0;
    sendArray[0x19] = 1;
    sendArray[0x1a] = 0x10;
    sendArray[0x1b] = 0xfe;
    sendArray[0x1c] = 0xfe;
    sendArray[0x1d] = 0x68;
    sendArray[30] = addrArray1[0];
    sendArray[0x1f] = addrArray1[1];
    sendArray[0x20] = addrArray1[2];
    sendArray[0x21] = addrArray1[3];
    sendArray[0x22] = addrArray1[4];
    sendArray[0x23] = addrArray1[5];
    sendArray[0x24] = 0x68;
    sendArray[0x25] = 1;
    sendArray[0x26] = 2;
    sendArray[0x27] = diCtrl[0];
    sendArray[40] = diCtrl[1];
    sendArray[0x29] = this.CheckSum(sendArray, 0x1d, 12);
    sendArray[0x2a] = 0x16;
    sendArray[0x2b] = this.CheckSum(sendArray, 3, 40);
    sendArray[0x2c] = 0x16;
    try {
      this.stopFlag = false;
      this.WriteLog(sendArray, 0x2d);
      this.ClearPort();
      await this.SendFunc(sendArray, 0, 0x2d);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  public async sp_SendPower_07(
    addrArray1: Buffer,
    diCtrl: Buffer,
    bySerial: byte,
  ) {
    console.log(TAG, 'sp_SendPower_07');
    let sendArray: Buffer = Buffer.alloc(0x2f);
    sendArray[0] = 0x68;
    sendArray[1] = 0x2f;
    sendArray[2] = 0;
    sendArray[3] = 0x7e;
    sendArray[4] = 4;
    sendArray[5] = this.bytBaud[1];
    sendArray[6] = 0;
    sendArray[7] = 0;
    sendArray[8] = 0;
    sendArray[9] = 0;
    let flag: bool = true;
    for (let i = 0; i < 6; i++) {
      if (MyGloab.sHHu[i] != 0) {
        flag = false;
      }
    }
    if (flag) {
      sendArray[10] = 0xff;
      sendArray[11] = 0xff;
      sendArray[12] = 0xff;
      sendArray[13] = 0xff;
      sendArray[14] = 1;
      sendArray[15] = 0xfd;
    } else {
      sendArray[10] = MyGloab.sHHu[0];
      sendArray[11] = MyGloab.sHHu[1];
      sendArray[12] = MyGloab.sHHu[2];
      sendArray[13] = MyGloab.sHHu[3];
      sendArray[14] = MyGloab.sHHu[4];
      sendArray[15] = MyGloab.sHHu[5];
    }
    sendArray[0x10] = addrArray1[0];
    sendArray[0x11] = addrArray1[1];
    sendArray[0x12] = addrArray1[2];
    sendArray[0x13] = addrArray1[3];
    sendArray[20] = addrArray1[4];
    sendArray[0x15] = addrArray1[5];
    sendArray[0x16] = 2;
    sendArray[0x17] = 1;
    sendArray[0x18] = 0;
    sendArray[0x19] = 2;
    sendArray[0x1a] = 0x12;
    sendArray[0x1b] = 0xfe;
    sendArray[0x1c] = 0xfe;
    sendArray[0x1d] = 0x68;
    sendArray[30] = addrArray1[0];
    sendArray[0x1f] = addrArray1[1];
    sendArray[0x20] = addrArray1[2];
    sendArray[0x21] = addrArray1[3];
    sendArray[0x22] = addrArray1[4];
    sendArray[0x23] = addrArray1[5];
    sendArray[0x24] = 0x68;
    sendArray[0x25] = 0x11;
    sendArray[0x26] = 4;
    sendArray[0x27] = diCtrl[0];
    sendArray[40] = diCtrl[1];
    sendArray[0x29] = diCtrl[2];
    sendArray[0x2a] = diCtrl[3];
    sendArray[0x2b] = this.CheckSum(sendArray, 0x1d, 14);
    sendArray[0x2c] = 0x16;
    sendArray[0x2d] = this.CheckSum(sendArray, 3, 0x2a);
    sendArray[0x2e] = 0x16;
    try {
      this.stopFlag = false;
      this.WriteLog(sendArray, 0x2f);
      this.ClearPort();
      await this.SendFunc(sendArray, 0, 0x2f);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  // public async sp_SendPower_07_4Para(
  //   addrArray1: Buffer,
  //   diCtrl: Buffer,
  //   diCtrl2: Buffer,
  //   bySerial: byte,
  // ) {
  //   let sendArray: Buffer = Buffer.alloc(0x2f + diCtrl2.length);
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0xff & (0x2f + diCtrl2.length);
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = 0;
  //   sendArray[6] = this.bytBaud[1];
  //   sendArray[7] = 0;
  //   sendArray[8] = 0;
  //   sendArray[9] = 0;
  //   let flag: bool = true;
  //   for (let i = 0; i < 6; i++) {
  //     if (MyGloab.sHHu[i] != 0) {
  //       flag = false;
  //     }
  //   }
  //   if (flag) {
  //     sendArray[10] = 0xff;
  //     sendArray[11] = 0xff;
  //     sendArray[12] = 0xff;
  //     sendArray[13] = 0xff;
  //     sendArray[14] = 1;
  //     sendArray[15] = 0xfd;
  //   } else {
  //     sendArray[10] = MyGloab.sHHu[0];
  //     sendArray[11] = MyGloab.sHHu[1];
  //     sendArray[12] = MyGloab.sHHu[2];
  //     sendArray[13] = MyGloab.sHHu[3];
  //     sendArray[14] = MyGloab.sHHu[4];
  //     sendArray[15] = MyGloab.sHHu[5];
  //   }
  //   sendArray[0x10] = 0xff;
  //   sendArray[0x11] = 0xff;
  //   sendArray[0x12] = 0xff;
  //   sendArray[0x13] = 0xff;
  //   sendArray[20] = 0xff;
  //   sendArray[0x15] = 0xff;
  //   sendArray[0x16] = 2;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 0;
  //   sendArray[0x1a] = 0x17;
  //   sendArray[0x1b] = 0xfe;
  //   sendArray[0x1c] = 0xfe;
  //   sendArray[0x1d] = 0x68;
  //   sendArray[30] = addrArray1[0];
  //   sendArray[0x1f] = addrArray1[1];
  //   sendArray[0x20] = addrArray1[2];
  //   sendArray[0x21] = addrArray1[3];
  //   sendArray[0x22] = addrArray1[4];
  //   sendArray[0x23] = addrArray1[5];
  //   sendArray[0x24] = 0x68;
  //   sendArray[0x25] = 0x11;
  //   sendArray[0x26] = 0xff & (4 + diCtrl2.length);
  //   sendArray[0x27] = diCtrl[0];
  //   sendArray[40] = diCtrl[1];
  //   sendArray[0x29] = diCtrl[2];
  //   sendArray[0x2a] = diCtrl[3];
  //   for (let j: int = 0; j < diCtrl2.length; j++) {
  //     sendArray[0x2b + j] = diCtrl2[j];
  //   }
  //   sendArray[0x2b + diCtrl2.length] = this.CheckSum(
  //     sendArray,
  //     0x1d,
  //     14 + diCtrl2.length,
  //   );
  //   sendArray[0x2c + diCtrl2.length] = 0x16;
  //   sendArray[0x2d + diCtrl2.length] = this.CheckSum(
  //     sendArray,
  //     3,
  //     0x2a + diCtrl2.length,
  //   );
  //   sendArray[0x2e + diCtrl2.length] = 0x16;
  //   try {
  //     this.stopFlag = false;
  //     this.WriteLog(sendArray, 0x2f + diCtrl2.length);
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, 0x2f + diCtrl2.length);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendPower21(addrArray1: Buffer, broad: bool, nSerial: byte) {
  //   let sendArray: Buffer = Buffer.alloc(0x2f);
  //   this.stopFlag = false;
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0x2f;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = this.bytBaud[1];
  //   sendArray[6] = 240;
  //   sendArray[7] = 0;
  //   sendArray[8] = 0;
  //   if (broad) {
  //     sendArray[9] = nSerial;
  //   } else {
  //     sendArray[9] = 1;
  //   }
  //   let flag: bool = true;
  //   for (let i = 0; i < 6; i++) {
  //     if (MyGloab.sHHu[i] != 0) {
  //       flag = false;
  //     }
  //   }
  //   if (flag) {
  //     sendArray[10] = 0xff;
  //     sendArray[11] = 0xff;
  //     sendArray[12] = 0xff;
  //     sendArray[13] = 0xff;
  //     sendArray[14] = 1;
  //     sendArray[15] = 0xfd;
  //   } else {
  //     sendArray[10] = MyGloab.sHHu[0];
  //     sendArray[11] = MyGloab.sHHu[1];
  //     sendArray[12] = MyGloab.sHHu[2];
  //     sendArray[13] = MyGloab.sHHu[3];
  //     sendArray[14] = MyGloab.sHHu[4];
  //     sendArray[15] = MyGloab.sHHu[5];
  //   }
  //   if (broad) {
  //     sendArray[0x10] = 0xff;
  //     sendArray[0x11] = 0xff;
  //     sendArray[0x12] = 0xff;
  //     sendArray[0x13] = 0xff;
  //     sendArray[20] = 0xff;
  //     sendArray[0x15] = 0xff;
  //   } else {
  //     sendArray[0x10] = addrArray1[0];
  //     sendArray[0x11] = addrArray1[1];
  //     sendArray[0x12] = addrArray1[2];
  //     sendArray[0x13] = addrArray1[3];
  //     sendArray[20] = addrArray1[4];
  //     sendArray[0x15] = addrArray1[5];
  //   }
  //   sendArray[0x16] = 2;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 0xd0;
  //   sendArray[0x1a] = 0x12;
  //   sendArray[0x1b] = 0x2f;
  //   sendArray[0x1c] = 0x3f;
  //   sendArray[0x1d] = 0x21;
  //   sendArray[30] = 13;
  //   sendArray[0x1f] = 10;
  //   sendArray[0x20] = 1;
  //   sendArray[0x21] = 0x52;
  //   sendArray[0x22] = 0x31;
  //   sendArray[0x23] = 2;
  //   sendArray[0x24] = 0x31;
  //   sendArray[0x25] = 0x2e;
  //   sendArray[0x26] = 0x39;
  //   sendArray[0x27] = 0x2e;
  //   sendArray[40] = 0x30;
  //   sendArray[0x29] = 40;
  //   sendArray[0x2a] = 0x29;
  //   sendArray[0x2b] = 3;
  //   sendArray[0x2c] = 0x5b;
  //   sendArray[0x2d] = this.CheckSum(sendArray, 3, 0x2a);
  //   sendArray[0x2e] = 0x16;
  //   try {
  //     this.WriteLog(sendArray, 0x2f);
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, 0x2f);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  public async sp_SendPower212(
    addrArray1: Buffer,
    broad: bool,
    nSerial: byte,
    addr2: Buffer,
    nlen6: int,
    enumDType: enumDataType,
  ) {
    console.log(TAG, 'sp_SendPower212');
    let num: int = 0;
    let sendArray: Buffer = Buffer.alloc(50 + nlen6);
    this.stopFlag = false;
    sendArray[0] = 0x68;
    if (this.ReturnIsEnergy(enumDType)) {
      num = 0xff & (0x2f + nlen6);
    } else {
      num = 0xff & (0x2f + nlen6 + 1);
    }
    sendArray[1] = 0xff & num;
    sendArray[2] = 0;
    sendArray[3] = 0x7e;
    sendArray[4] = 4;
    sendArray[5] = this.bytBaud[1];
    sendArray[6] = 240;
    sendArray[7] = 0;
    sendArray[8] = 0;
    if (broad) {
      sendArray[9] = nSerial;
    } else {
      sendArray[9] = 1;
    }
    let flag: bool = true;
    for (let i = 0; i < 6; i++) {
      if (MyGloab.sHHu[i] != 0) {
        flag = false;
      }
    }
    if (flag) {
      sendArray[10] = 0xff;
      sendArray[11] = 0xff;
      sendArray[12] = 0xff;
      sendArray[13] = 0xff;
      sendArray[14] = 1;
      sendArray[15] = 0xfd;
    } else {
      sendArray[10] = MyGloab.sHHu[0];
      sendArray[11] = MyGloab.sHHu[1];
      sendArray[12] = MyGloab.sHHu[2];
      sendArray[13] = MyGloab.sHHu[3];
      sendArray[14] = MyGloab.sHHu[4];
      sendArray[15] = MyGloab.sHHu[5];
    }
    if (broad) {
      sendArray[0x10] = 0xff;
      sendArray[0x11] = 0xff;
      sendArray[0x12] = 0xff;
      sendArray[0x13] = 0xff;
      sendArray[20] = 0xff;
      sendArray[0x15] = 0xff;
    } else {
      sendArray[0x10] = addrArray1[0];
      sendArray[0x11] = addrArray1[1];
      sendArray[0x12] = addrArray1[2];
      sendArray[0x13] = addrArray1[3];
      sendArray[20] = addrArray1[4];
      sendArray[0x15] = addrArray1[5];
    }
    sendArray[0x16] = 2;
    sendArray[0x17] = 1;
    sendArray[0x18] = 0;
    sendArray[0x19] = 0xd0;
    let num3: int = 0x12 + nlen6;
    if (this.ReturnIsEnergy(enumDType)) {
      sendArray[0x1a] = 0xff & num3;
    } else {
      sendArray[0x1a] = 0xff & (num3 + 1);
    }
    sendArray[0x1b] = 0x2f;
    sendArray[0x1c] = 0x3f;
    if (nlen6 > 0) {
      for (let j: int = 0; j < nlen6; j++) {
        sendArray[0x1d + j] = addr2[j];
      }
      sendArray[0x1d + nlen6] = 0x21;
      sendArray[30 + nlen6] = 13;
      sendArray[0x1f + nlen6] = 10;
    } else {
      sendArray[0x1d] = 0x21;
      sendArray[30] = 13;
      sendArray[0x1f] = 10;
    }
    sendArray[0x20 + nlen6] = 1;
    sendArray[0x21 + nlen6] = 0x52;
    sendArray[0x22 + nlen6] = 0x31;
    sendArray[0x23 + nlen6] = 2;
    let len: int = 0x29 + nlen6;
    if (enumDType == enumDataType.Energy_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x39;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x30;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_DataType_180) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x38;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x30;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_All_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x35;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x38;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Energy_T1_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x39;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x31;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_T2_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x39;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 50;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_T3_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x39;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x33;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_T4_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x39;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x34;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_VC_DataType) {
      sendArray[0x24 + nlen6] = 0x33;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x38;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x30;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_T1_DataType_180) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x38;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x31;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_T2_DataType_180) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x38;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 50;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Energy_T3_DataType_180) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x38;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x33;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Demand_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x36;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x30;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Demand_T1_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x36;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x31;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Demand_T2_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x36;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 50;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Demand_T3_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x36;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x33;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Demand_VC_DataType) {
      sendArray[0x24 + nlen6] = 0x33;
      sendArray[0x25 + nlen6] = 0x2e;
      sendArray[0x26 + nlen6] = 0x36;
      sendArray[0x27 + nlen6] = 0x2e;
      sendArray[40 + nlen6] = 0x30;
      len = 0x29 + nlen6;
    } else if (enumDType == enumDataType.Voltage_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 50;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Curerent_DataType) {
      sendArray[0x24 + nlen6] = 0x31;
      sendArray[0x25 + nlen6] = 0x31;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Voltage_DataType_A) {
      sendArray[0x24 + nlen6] = 0x33;
      sendArray[0x25 + nlen6] = 50;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Curerent_DataType_A) {
      sendArray[0x24 + nlen6] = 0x33;
      sendArray[0x25 + nlen6] = 0x31;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Voltage_DataType_B) {
      sendArray[0x24 + nlen6] = 0x35;
      sendArray[0x25 + nlen6] = 50;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Curerent_DataType_B) {
      sendArray[0x24 + nlen6] = 0x35;
      sendArray[0x25 + nlen6] = 0x31;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Voltage_DataType_C) {
      sendArray[0x24 + nlen6] = 0x37;
      sendArray[0x25 + nlen6] = 50;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    } else if (enumDType == enumDataType.Curerent_DataType_C) {
      sendArray[0x24 + nlen6] = 0x37;
      sendArray[0x25 + nlen6] = 0x31;
      sendArray[0x26 + nlen6] = 0x2e;
      sendArray[0x27 + nlen6] = 0x37;
      sendArray[40 + nlen6] = 0x2e;
      sendArray[0x29 + nlen6] = 0x30;
      len = 0x2a + nlen6;
    }
    sendArray[len++] = 40;
    sendArray[len++] = 0x29;
    sendArray[len++] = 3;
    sendArray[len++] = this.CheckXor(
      sendArray,
      0x21 + nlen6,
      len - 0x21 - nlen6,
    );
    sendArray[len++] = this.CheckSum(sendArray, 3, len - 3);
    sendArray[len++] = 0x16;
    this.WriteLog(sendArray, len);
    try {
      this.ClearPort();
      await this.SendFunc(sendArray, 0, len);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  public async sp_SendPower212Group(
    addrArray1: Buffer,
    bGroup: bool,
    nSerial: byte,
    addr2: Buffer,
    nlen6: int,
    enumDType: enumDataType,
    bNeedPWD: bool,
  ) {
    console.log(TAG, 'sp_SendPower212Group');

    if (bNeedPWD) {
      nlen6 += 0x10;
    }
    let sendArray: Buffer = Buffer.alloc(0x3a + nlen6);
    let len: int = 0x3a + nlen6;
    this.stopFlag = false;
    sendArray[0] = 0x68;
    let num2: int = 0xff & (0x3a + nlen6);
    sendArray[1] = 0xff & num2;
    sendArray[2] = 0;
    sendArray[3] = 0x7e;
    sendArray[4] = 4;
    sendArray[5] = this.bytBaud[1];
    sendArray[6] = 0x30;
    sendArray[7] = 0;
    sendArray[8] = 0;
    sendArray[9] = 3;
    sendArray[10] = 0x21;
    sendArray[11] = 0;
    sendArray[12] = 0;
    sendArray[13] = 0;
    sendArray[14] = 0;
    sendArray[15] = 0xfd;
    sendArray[0x10] = addrArray1[0];
    sendArray[0x11] = addrArray1[1];
    sendArray[0x12] = addrArray1[2];
    sendArray[0x13] = addrArray1[3];
    sendArray[20] = addrArray1[4];
    sendArray[0x15] = addrArray1[5];
    sendArray[0x16] = 2;
    sendArray[0x17] = 1;
    sendArray[0x18] = 0;
    sendArray[0x19] = 0xd0;
    let num3: int = 30;
    if (!bGroup) {
      num3 = 30;
    } else if (bNeedPWD) {
      num3 = 0x2f;
    } else {
      num3 = 0x1f;
    }
    sendArray[0x1a] = 0xff & num3;
    sendArray[0x1b] = 0x2f;
    sendArray[0x1c] = 0x3f;
    let bytes: Buffer = EncodingASCIIGetBytes(MyGloab.strMeterAdd);
    sendArray[0x1d] = bytes[0];
    sendArray[30] = bytes[1];
    sendArray[0x1f] = bytes[2];
    sendArray[0x20] = bytes[3];
    sendArray[0x21] = bytes[4];
    sendArray[0x22] = bytes[5];
    sendArray[0x23] = bytes[6];
    sendArray[0x24] = bytes[7];
    sendArray[0x25] = bytes[8];
    sendArray[0x26] = bytes[9];
    sendArray[0x27] = bytes[10];
    sendArray[40] = bytes[11];
    sendArray[0x29] = 0x21;
    sendArray[0x2a] = 13;
    sendArray[0x2b] = 10;
    let num4: int = 0x2c;
    if (bNeedPWD) {
      sendArray[0x2c] = 1;
      sendArray[0x2d] = 80;
      sendArray[0x2e] = 0x33;
      sendArray[0x2f] = 2;
      sendArray[0x30] = 40;
      sendArray[0x31] = 0x31;
      sendArray[50] = 50;
      sendArray[0x33] = 0x33;
      sendArray[0x34] = 0x34;
      sendArray[0x35] = 0x35;
      sendArray[0x36] = 0x36;
      sendArray[0x37] = 0x37;
      sendArray[0x38] = 0x38;
      sendArray[0x39] = 0x29;
      sendArray[0x3a] = 3;
      sendArray[0x3b] = this.CheckXor(sendArray, 0x2d, 14);
      num4 = 60;
    }
    sendArray[num4++] = 1;
    sendArray[num4++] = 0x52;
    sendArray[num4++] = 0x31;
    sendArray[num4++] = 2;
    if (!bGroup) {
      sendArray[num4++] = 0x31;
      sendArray[num4++] = 0x2e;
      sendArray[num4++] = 0x39;
      sendArray[num4++] = 0x2e;
      sendArray[num4++] = 0x30;
      sendArray[num4++] = 40;
      sendArray[num4++] = 0x29;
      sendArray[num4++] = 3;
      sendArray[num4++] = this.CheckXor(sendArray, num4 - 12, 12);
      sendArray[num4++] = this.CheckSum(sendArray, 3, len - 5);
      sendArray[num4++] = 0x16;
    } else {
      if (enumDType == enumDataType.GroupData_DataType_2) {
        sendArray[num4++] = 0x39;
        sendArray[num4++] = 0x39;
        sendArray[num4++] = 0x2e;
        sendArray[num4++] = 0x31;
        sendArray[num4++] = 0x2e;
        sendArray[num4++] = 0x31;
      } else {
        sendArray[num4++] = 0x39;
        sendArray[num4++] = 0x39;
        sendArray[num4++] = 0x2e;
        sendArray[num4++] = 0x31;
        sendArray[num4++] = 0x2e;
        sendArray[num4++] = 0x30;
      }
      sendArray[num4++] = 40;
      sendArray[num4++] = 0x29;
      sendArray[num4++] = 3;
      sendArray[num4++] = this.CheckXor(sendArray, num4 - 13, 13);
      sendArray[num4++] = this.CheckSum(sendArray, 3, len - 5);
      sendArray[num4++] = 0x16;
    }
    this.WriteLog(sendArray, len);
    try {
      this.ClearPort();
      await this.SendFunc(sendArray, 0, len);
    } catch {
      console.log(TAG, 'Error');
    }
  }

  // public async sp_SendPower212New(
  //   addrArray1: Buffer,
  //   broad: bool,
  //   nSerial: byte,
  //   addr2: Buffer,
  //   nlen6: int,
  //   enumDType: enumDataType,
  // ) {
  //   let num: int = 0;
  //   let sendArray: Buffer = Buffer.alloc(50 + nlen6);
  //   this.stopFlag = false;
  //   sendArray[0] = 0x68;
  //   if (enumDType == enumDataType.Energy_DataType) {
  //     num = 0xff & (0x2f + nlen6);
  //   } else {
  //     num = 0xff & (0x2f + nlen6 + 1);
  //   }
  //   sendArray[1] = 0xff & num;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = this.bytBaud[1];
  //   sendArray[6] = 240;
  //   sendArray[7] = 0;
  //   sendArray[8] = 0;
  //   if (broad) {
  //     sendArray[9] = nSerial;
  //   } else {
  //     sendArray[9] = 1;
  //   }
  //   let flag: bool = true;
  //   for (let i = 0; i < 6; i++) {
  //     if (MyGloab.sHHu[i] != 0) {
  //       flag = false;
  //     }
  //   }
  //   if (flag) {
  //     sendArray[10] = 0xff;
  //     sendArray[11] = 0xff;
  //     sendArray[12] = 0xff;
  //     sendArray[13] = 0xff;
  //     sendArray[14] = 1;
  //     sendArray[15] = 0xfd;
  //   } else {
  //     sendArray[10] = MyGloab.sHHu[0];
  //     sendArray[11] = MyGloab.sHHu[1];
  //     sendArray[12] = MyGloab.sHHu[2];
  //     sendArray[13] = MyGloab.sHHu[3];
  //     sendArray[14] = MyGloab.sHHu[4];
  //     sendArray[15] = MyGloab.sHHu[5];
  //   }
  //   if (broad) {
  //     sendArray[0x10] = 0xff;
  //     sendArray[0x11] = 0xff;
  //     sendArray[0x12] = 0xff;
  //     sendArray[0x13] = 0xff;
  //     sendArray[20] = 0xff;
  //     sendArray[0x15] = 0xff;
  //   } else {
  //     sendArray[0x10] = addrArray1[0];
  //     sendArray[0x11] = addrArray1[1];
  //     sendArray[0x12] = addrArray1[2];
  //     sendArray[0x13] = addrArray1[3];
  //     sendArray[20] = addrArray1[4];
  //     sendArray[0x15] = addrArray1[5];
  //   }
  //   sendArray[0x16] = 2;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 0xd0;
  //   let num3: int = 0x12 + nlen6;
  //   if (enumDType == enumDataType.Energy_DataType) {
  //     sendArray[0x1a] = 0xff & num3;
  //   } else {
  //     sendArray[0x1a] = 0xff & (num3 + 1);
  //   }
  //   sendArray[0x1b] = 0x2f;
  //   sendArray[0x1c] = 0x3f;
  //   if (nlen6 > 0) {
  //     for (let j: int = 0; j < nlen6; j++) {
  //       sendArray[0x1d + j] = addr2[j];
  //     }
  //     sendArray[0x1d + nlen6] = 0x21;
  //     sendArray[30 + nlen6] = 13;
  //     sendArray[0x1f + nlen6] = 10;
  //   } else {
  //     sendArray[0x1d] = 0x21;
  //     sendArray[30] = 13;
  //     sendArray[0x1f] = 10;
  //   }
  //   sendArray[0x20 + nlen6] = 1;
  //   sendArray[0x21 + nlen6] = 0x52;
  //   sendArray[0x22 + nlen6] = 0x31;
  //   sendArray[0x23 + nlen6] = 2;
  //   let index: int = 0x29 + nlen6;
  //   if (enumDType == enumDataType.Energy_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 0x2e;
  //     sendArray[0x26 + nlen6] = 0x39;
  //     sendArray[0x27 + nlen6] = 0x2e;
  //     sendArray[40 + nlen6] = 0x30;
  //     index = 0x29 + nlen6;
  //   } else if (enumDType == enumDataType.Energy_T1_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 0x2e;
  //     sendArray[0x26 + nlen6] = 0x39;
  //     sendArray[0x27 + nlen6] = 0x2e;
  //     sendArray[40 + nlen6] = 0x31;
  //     index = 0x29 + nlen6;
  //   } else if (enumDType == enumDataType.Energy_T2_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 0x2e;
  //     sendArray[0x26 + nlen6] = 0x39;
  //     sendArray[0x27 + nlen6] = 0x2e;
  //     sendArray[40 + nlen6] = 50;
  //     index = 0x29 + nlen6;
  //   } else if (enumDType == enumDataType.Energy_T3_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 0x2e;
  //     sendArray[0x26 + nlen6] = 0x39;
  //     sendArray[0x27 + nlen6] = 0x2e;
  //     sendArray[40 + nlen6] = 0x33;
  //     index = 0x29 + nlen6;
  //   } else if (enumDType == enumDataType.Energy_T4_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 0x2e;
  //     sendArray[0x26 + nlen6] = 0x39;
  //     sendArray[0x27 + nlen6] = 0x2e;
  //     sendArray[40 + nlen6] = 0x34;
  //     index = 0x29 + nlen6;
  //   } else if (enumDType == enumDataType.Voltage_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 50;
  //     sendArray[0x26 + nlen6] = 0x2e;
  //     sendArray[0x27 + nlen6] = 0x37;
  //     sendArray[40 + nlen6] = 0x2e;
  //     sendArray[0x29 + nlen6] = 0x30;
  //     index = 0x2a + nlen6;
  //   } else if (enumDType == enumDataType.Curerent_DataType) {
  //     sendArray[0x24 + nlen6] = 0x31;
  //     sendArray[0x25 + nlen6] = 0x31;
  //     sendArray[0x26 + nlen6] = 0x2e;
  //     sendArray[0x27 + nlen6] = 0x37;
  //     sendArray[40 + nlen6] = 0x2e;
  //     sendArray[0x29 + nlen6] = 0x30;
  //     index = 0x2a + nlen6;
  //   }
  //   sendArray[index++] = 40;
  //   sendArray[index++] = 0x29;
  //   sendArray[index++] = 3;
  //   if (enumDType == enumDataType.Energy_DataType) {
  //     sendArray[index++] = 0x5b;
  //   } else if (enumDType == enumDataType.Voltage_DataType) {
  //     sendArray[index++] = 0x67;
  //   } else if (enumDType == enumDataType.Curerent_DataType) {
  //     sendArray[index++] = 100;
  //   }
  //   sendArray[index] = this.CheckSum(sendArray, 3, index - 3);
  //   sendArray[index + 1] = 0x16;
  //   this.WriteLog(sendArray, index + 2);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, index + 2);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendPowerBroad(nSerial: byte) {
  //   let sendArray: Buffer = Buffer.alloc(0x2f);
  //   let num: int = 0x2f;
  //   this.stopFlag = false;
  //   sendArray[0] = 0x68;
  //   let num2: int = 0xff & num;
  //   sendArray[1] = 0xff & num2;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = this.bytBaud[1];
  //   sendArray[6] = 0x30;
  //   sendArray[7] = 0;
  //   sendArray[8] = 0;
  //   sendArray[9] = nSerial;
  //   sendArray[10] = 0x21;
  //   sendArray[11] = 0;
  //   sendArray[12] = 0;
  //   sendArray[13] = 0;
  //   sendArray[14] = 0;
  //   sendArray[15] = 0xfd;
  //   sendArray[0x10] = 0xff;
  //   sendArray[0x11] = 0xff;
  //   sendArray[0x12] = 0xff;
  //   sendArray[0x13] = 0xff;
  //   sendArray[20] = 0xff;
  //   sendArray[0x15] = 0xff;
  //   sendArray[0x16] = 2;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 0xd0;
  //   let num3: int = 0x12;
  //   sendArray[0x1a] = 0xff & num3;
  //   sendArray[0x1b] = 0x2f;
  //   sendArray[0x1c] = 0x3f;
  //   sendArray[0x1d] = 0x21;
  //   sendArray[30] = 13;
  //   sendArray[0x1f] = 10;
  //   sendArray[0x20] = 1;
  //   sendArray[0x21] = 0x52;
  //   sendArray[0x22] = 0x31;
  //   sendArray[0x23] = 2;
  //   sendArray[0x24] = 0x30;
  //   sendArray[0x25] = 0x2e;
  //   sendArray[0x26] = 50;
  //   sendArray[0x27] = 0x2e;
  //   sendArray[40] = 0x33;
  //   sendArray[0x29] = 40;
  //   sendArray[0x2a] = 0x29;
  //   sendArray[0x2b] = 3;
  //   sendArray[0x2c] = 0x52;
  //   sendArray[0x2d] = this.CheckSum(sendArray, 3, num - 5);
  //   sendArray[0x2e] = 0x16;
  //   this.WriteLog(sendArray, 0x2f);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, num);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendPowerGroup(diCtrl: Buffer, bySerial: byte) {
  //   let sendArray: Buffer = Buffer.alloc(0x2d);
  //   this.stopFlag = false;
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0x2d;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = this.bytBaud[1];
  //   sendArray[6] = 240;
  //   sendArray[7] = 0xb0;
  //   sendArray[8] = 4;
  //   sendArray[9] = bySerial;
  //   let flag: bool = true;
  //   for (let i = 0; i < 6; i++) {
  //     if (MyGloab.sHHu[i] != 0) {
  //       flag = false;
  //     }
  //   }
  //   if (flag) {
  //     sendArray[10] = 0xff;
  //     sendArray[11] = 0xff;
  //     sendArray[12] = 0xff;
  //     sendArray[13] = 0xff;
  //     sendArray[14] = 2;
  //     sendArray[15] = 0xfd;
  //   } else {
  //     sendArray[10] = MyGloab.sHHu[0];
  //     sendArray[11] = MyGloab.sHHu[1];
  //     sendArray[12] = MyGloab.sHHu[2];
  //     sendArray[13] = MyGloab.sHHu[3];
  //     sendArray[14] = MyGloab.sHHu[4];
  //     sendArray[15] = MyGloab.sHHu[5];
  //   }
  //   sendArray[0x10] = 0xff;
  //   sendArray[0x11] = 0xff;
  //   sendArray[0x12] = 0xff;
  //   sendArray[0x13] = 0xff;
  //   sendArray[20] = 0xff;
  //   sendArray[0x15] = 0xff;
  //   sendArray[0x16] = 2;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 1;
  //   sendArray[0x1a] = 0x10;
  //   sendArray[0x1b] = 0xfe;
  //   sendArray[0x1c] = 0xfe;
  //   sendArray[0x1d] = 0x68;
  //   sendArray[30] = 0x99;
  //   sendArray[0x1f] = 0x99;
  //   sendArray[0x20] = 0x99;
  //   sendArray[0x21] = 0x99;
  //   sendArray[0x22] = 0x99;
  //   sendArray[0x23] = 0x99;
  //   sendArray[0x24] = 0x68;
  //   sendArray[0x25] = 1;
  //   sendArray[0x26] = 2;
  //   sendArray[0x27] = diCtrl[0];
  //   sendArray[40] = diCtrl[1];
  //   sendArray[0x29] = this.CheckSum(sendArray, 0x1d, 12);
  //   sendArray[0x2a] = 0x16;
  //   sendArray[0x2b] = this.CheckSum(sendArray, 3, 40);
  //   sendArray[0x2c] = 0x16;
  //   try {
  //     this.stopFlag = false;
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, 0x2d);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendPowerRF(addrArray1: Buffer, broad: bool, nSerial: byte) {
  //   let sendArray: Buffer = Buffer.alloc(0x2f);
  //   this.stopFlag = false;
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0x2c;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = 0xff & (4 + this.bytBaud[1]);
  //   sendArray[6] = 240;
  //   sendArray[7] = 0x73;
  //   sendArray[8] = 0x80;
  //   if (broad) {
  //     sendArray[9] = nSerial;
  //   } else {
  //     sendArray[9] = 1;
  //   }
  //   let flag: bool = true;
  //   for (let i = 0; i < 6; i++) {
  //     if (MyGloab.sHHu[i] != 0) {
  //       flag = false;
  //     }
  //   }
  //   if (flag) {
  //     sendArray[10] = 0xff;
  //     sendArray[11] = 0xff;
  //     sendArray[12] = 0xff;
  //     sendArray[13] = 0xff;
  //     sendArray[14] = 1;
  //     sendArray[15] = 0xfd;
  //   } else {
  //     sendArray[10] = MyGloab.sHHu[0];
  //     sendArray[11] = MyGloab.sHHu[1];
  //     sendArray[12] = MyGloab.sHHu[2];
  //     sendArray[13] = MyGloab.sHHu[3];
  //     sendArray[14] = MyGloab.sHHu[4];
  //     sendArray[15] = MyGloab.sHHu[5];
  //   }
  //   if (broad) {
  //     sendArray[0x10] = 0xff;
  //     sendArray[0x11] = 0xff;
  //     sendArray[0x12] = 0xff;
  //     sendArray[0x13] = 0xff;
  //     sendArray[20] = 0xff;
  //     sendArray[0x15] = 0xff;
  //   } else {
  //     sendArray[0x10] = addrArray1[0];
  //     sendArray[0x11] = addrArray1[1];
  //     sendArray[0x12] = addrArray1[2];
  //     sendArray[0x13] = addrArray1[3];
  //     sendArray[20] = addrArray1[4];
  //     sendArray[0x15] = addrArray1[5];
  //   }
  //   sendArray[0x16] = 2;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 0xe0;
  //   sendArray[0x1a] = 15;
  //   sendArray[0x1b] = 0xfe;
  //   sendArray[0x1c] = 0xfe;
  //   sendArray[0x1d] = 0x68;
  //   sendArray[30] = 0x99;
  //   sendArray[0x1f] = 0x99;
  //   sendArray[0x20] = 0x99;
  //   sendArray[0x21] = 0x99;
  //   sendArray[0x22] = 0xb8;
  //   sendArray[0x23] = 0;
  //   sendArray[0x24] = 0;
  //   sendArray[0x25] = 0;
  //   sendArray[0x26] = 0;
  //   sendArray[0x27] = 0;
  //   sendArray[40] = this.CheckSum(sendArray, 0x1d, 11);
  //   sendArray[0x29] = 0x16;
  //   sendArray[0x2a] = this.CheckSum(sendArray, 3, 0x27);
  //   sendArray[0x2b] = 0x16;
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, 0x2c);
  //   } catch {}
  // }

  // public async sp_SendReadHHU() {
  //   let buffer: Buffer = Buffer.alloc(0);
  //   this.stopFlag = false;
  //   buffer = Buffer.from([
  //     0x68,
  //     15,
  //     0,
  //     0x4a,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     3,
  //     8,
  //     0,
  //     this.CheckSum(buffer, 3, 10),
  //     0x16,
  //   ]);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(buffer, 0, 15);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async SP_SendReadModuleN0() {
  //   let buffer: Buffer = Buffer.from([
  //     0x68, 15, 0, 0x4a, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0x4e, 0x16,
  //   ]);
  //   try {
  //     this.stopFlag = false;
  //     this.isReadMdlNo = true;
  //     this.ClearPort();
  //     await this.SendFunc(buffer, 0, 15);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendSetHHU(addr: Buffer) {
  //   this.stopFlag = false;
  //   let sendArray: Buffer = Buffer.alloc(0x15);
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0x2d;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   sendArray[5] = 0;
  //   sendArray[6] = 0;
  //   sendArray[7] = 0xb0;
  //   sendArray[8] = 4;
  //   sendArray[9] = 0;
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0x15;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x4a;
  //   sendArray[4] = 0;
  //   sendArray[5] = 0;
  //   sendArray[6] = 0;
  //   sendArray[7] = 0;
  //   sendArray[8] = 0;
  //   sendArray[9] = 0;
  //   sendArray[10] = 5;
  //   sendArray[11] = 1;
  //   sendArray[12] = 0;
  //   sendArray[13] = addr[0];
  //   sendArray[14] = addr[1];
  //   sendArray[15] = addr[2];
  //   sendArray[0x10] = addr[3];
  //   sendArray[0x11] = addr[4];
  //   sendArray[0x12] = addr[5];
  //   sendArray[0x13] = this.CheckSum(sendArray, 3, 0x10);
  //   sendArray[20] = 0x16;
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(sendArray, 0, 0x15);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendSetRFParam1() {
  //   let buffer: Buffer = Buffer.alloc(0);
  //   this.stopFlag = false;
  //   buffer = Buffer.from([
  //     0x68,
  //     0x16,
  //     0,
  //     0x4a,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     5,
  //     0x10,
  //     0,
  //     0xff,
  //     0xff,
  //     8,
  //     5,
  //     5,
  //     3,
  //     4,
  //     this.CheckSum(buffer, 3, 0x11),
  //     0x16,
  //   ]);
  //   try {
  //     this.ClearPort();
  //     await this.SendFunc(buffer, 0, 0x16);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendTest() {
  //   let sendD: Buffer = Buffer.alloc(0x1c);
  //   let str: string =
  //     '68 1c 00 7e 04 6f f9 00 00 01 21 00 00 00 00 fd ff ff ff ff ff ff 03 01 00 01 08 16 ';
  //   for (let i = 0; i < 0x1c; i++) {
  //     sendD[i] = 0xff && parseInt(str.substring(i * 3, i * 3 + 3).trim(), 16);
  //   }
  //   try {
  //     this.WriteLog(sendD, 0x1c);
  //     this.ClearPort();
  //     this.bisNew = true;
  //     await this.SendFunc(sendD, 0, 0x1c);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  // public async sp_SendVersion(addrArray1: Buffer, isDCU: bool, nSerial: byte) {
  //   let sendArray: Buffer = Buffer.alloc(0x1c);
  //   this.stopFlag = false;
  //   sendArray[0] = 0x68;
  //   sendArray[1] = 0x1c;
  //   sendArray[2] = 0;
  //   sendArray[3] = 0x7e;
  //   sendArray[4] = 4;
  //   if (isDCU) {
  //     sendArray[5] = 0x6f;
  //   } else {
  //     sendArray[5] = 0;
  //   }
  //   sendArray[6] = 240;
  //   sendArray[7] = 0;
  //   sendArray[8] = 0;
  //   sendArray[9] = 0x34;
  //   sendArray[10] = 0x21;
  //   sendArray[11] = 0;
  //   sendArray[12] = 0;
  //   sendArray[13] = 0;
  //   sendArray[14] = 0;
  //   sendArray[15] = 0xfd;
  //   sendArray[0x10] = addrArray1[0];
  //   sendArray[0x11] = addrArray1[1];
  //   sendArray[0x12] = addrArray1[2];
  //   sendArray[0x13] = addrArray1[3];
  //   sendArray[20] = addrArray1[4];
  //   sendArray[0x15] = addrArray1[5];
  //   sendArray[0x16] = 3;
  //   sendArray[0x17] = 1;
  //   sendArray[0x18] = 0;
  //   sendArray[0x19] = 1;
  //   sendArray[0x1a] = this.CheckSum(sendArray, 3, 0x17);
  //   sendArray[0x1b] = 0x16;
  //   try {
  //     this.WriteLog(sendArray, 0x1c);
  //     this.ClearPort();
  //     this.isReadVersion = true;
  //     await this.SendFunc(sendArray, 0, 0x1c);
  //   } catch {
  //     console.log(TAG, 'Error');
  //   }
  // }

  public SPCommClose() {}

  public SPCommOpen() {}

  public static TouchCalibrate() {
    console.log(TAG, 'TouchCalibrate but i dont have this function');
  }
  private WriteLog(sendD: Buffer, len: int) {
    if (MyGloab.bSaveLog) {
      let str: string = '';
      for (let i = 0; i < len; i++) {
        str = str + ' ' + sendD[i].toString(16).padStart(2, '0');
      }
      MyGloab.InPutLog(
        'S->' + (new Date().toLocaleTimeString('vi') + ': ' + str),
      );
    }
  }

  public WriteSystemLog(logString: string) {
    MyGloab.InPutLog(logString);
  }

  private ConvertBCDToByte(strBCD: string): byte {
    let Hbyte: byte;
    let Lbyte: byte;
    let Result: byte;

    Hbyte = Convert.ToByte(strBCD[0].toString());
    Lbyte = Convert.ToByte(strBCD[1].toString());
    Hbyte = 0xff & (Hbyte << 4);
    Result = 0xff & (Hbyte | Lbyte);
    return Result;
  }
  //---------------------------------------------------------------------------------------------------
  public ConvertByteToBCD(bytebcd: byte): string {
    let Hbyte: byte, Lbyte: byte;
    let Result: string = '';
    Hbyte = 0xff & ((bytebcd & 0xf0) >> 4);
    Lbyte = 0xff & (bytebcd & 0x0f);
    if (Hbyte >= 10) {
      Result = this.ToHex(Hbyte.toString());
    } else {
      Result = Hbyte.toString();
    }

    if (Lbyte >= 10) {
      Result += this.ToHex(Lbyte.toString());
    } else {
      Result += Lbyte.toString();
    }

    return Result;
  }
  //---------------------------------------------------------------------------------------------------
  public ToHex(sovao: string): string {
    let dec: byte = Convert.ToByte(sovao);
    if (dec < 10) {
      return dec.toString();
    } else {
      switch (dec) {
        case 10:
          return 'A';
        case 11:
          return 'B';
        case 12:
          return 'C';
        case 13:
          return 'D';
        case 14:
          return 'E';
        case 15:
          return 'F';
        default:
          return '';
      }
    }
  }
  //---------------------------------------------------------------------------------------------------
  // public BeginGELEX() {}
  // //---------------------------------------------------------------------------------------------------
  // public EndGELEX() {}
  //---------------------------------------------------------------------------------------------------

  //------------------------------------------------
  public ReturnDay(bDay: string): string {
    switch (bDay) {
      case 'Monday': //ME-41 16CH
        return '1';

      case 'Tuesday': //ME-41 16CH
        return '2';

      case 'Wednesday': //ME-41 16CH
        return '3';

      case 'Thursday': //ME-41 16CH
        return '4';

      case 'Friday': //ME-41 16CH
        return '5';

      case 'Saturday': //ME-41 16CH
        return '6';

      case 'Sunday': //ME-41 16CH
        return '7';
      default:
        return '1';
    }
  }

  // public GELEX_ReadRF_GCS(
  //   strSERY_CTO: string,
  //   strMA_CTO: string,
  //   strLOAI_BCS_CMIS: string,
  //   strRF: string,
  //   iDate: Date,
  // ): string {
  //   console.log(TAG, 'Read Gelex GELEX_ReadRF_GCS but i return nack');

  //   return 'NACK';
  // }

  //---------------------------------------------------------------------------------------------------
  // public GELEX_ReadRF_GCS_Chot0h(
  //   strSERY_CTO: string,
  //   strMA_CTO: string,
  //   strLOAI_BCS_CMIS: string,
  //   strRF: string,
  //   iDate: Date,
  // ): string {
  //   console.log(TAG, 'Read Gelex GELEX_ReadRF_GCS_Chot0h but i return nack');

  //   return 'NACK';
  // }
  //---------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------
  // private ByteToAsciiHex(bytevalue: byte): string {
  //   let Value: string = '';
  //   Value = Convert.ToString(bytevalue, 16).toUpperCase();
  //   return Value;
  // }
}
