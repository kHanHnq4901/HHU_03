import { TurboModuleRegistry } from 'react-native';
import { StringFromArray, sleep } from '../../../../../util';
import { PropsCommonResponse } from '../../../../api';
import { Convert } from '../../../aps/util';
import {
  bool,
  byte,
  char,
  decimal,
  float,
  int,
  long,
  uint8_t,
} from '../../../define';
import {
  EncodingASCIIGetString,
  EncodingDefaultGetBytes,
  formatTimeHHM,
} from '../util';
import { CommuClass, PropsCommunicationClass } from './CommuClass';
import { ConvertTypeMeterToString, METERTYPE } from './METERTYPE';
import { METER_PHASE } from './METER_PHASE';
import { MyGloab, PropsLsRange } from './MyGloab';
import { MyGlobal } from './MyGlobal';
import { ConvertEnumDataTypeToString, enumDataType } from './enumDataType';
import {
  HhuObj,
  ResponseRxProps,
  TYPE_HHU_CMD,
  analysisRx,
} from '../../../hhuFunc';
import { Buffer } from 'buffer';
import { GelexProcessReceive, GetTypeMeterAndPhase } from '../hhuApsHHM';
import { PropsResponse } from '../../../aps/hhuAps';

const TAG = 'ReadSTClass: ';

export type MeterTypeInfo = {
  strMeterType: string;
  strMeterRange: string[];
};

export type PropsReadSTClass = Omit<PropsCommunicationClass, 'dataReturn'>;

export class ReadSTClass {
  private bAddr: uint8_t[] = new Array<uint8_t>(4);
  private bBoxNo: uint8_t[] = new Array<uint8_t>(3);
  private bCurrent: bool = false;
  private bDemand: bool = false;
  private bDisplayAddr: bool = false;
  private bIsInRange: bool = false;
  private bIsSinglePhase: bool = false;
  private bIsThreePhase: bool = true;
  //private bool bPowerBroad = false;
  private bReadContinue: bool = false;
  private bReadGroupData: bool = false;

  private ct_Den: int = 1;
  private ct_Num: int = 1;
  private cur: float[] = new Array<float>(3);
  //private int delayNum = 5;
  //private int delayTime;
  private iCT_Meter: decimal = 1;
  private iCT_Value: decimal = 1;
  private iCTVT_Value: decimal = 1;
  private iSampleCount: int = 1;
  //private int iSerialN = 1;
  //private int iTabIndex;
  //private ColumnHeader item;
  private ItemIndex: int = 0;
  private ItemN: string[] = ['SG', 'BT', 'CD', 'TD', 'VC'];
  private iVT_Meter: decimal = 1;
  private iVT_Value: decimal = 1;
  private meterPhase: METER_PHASE = METER_PHASE.SINGLE_PHASE;
  //private string MeterSN = "";
  private meterType: METERTYPE = METERTYPE.DDS26_GELEX;
  //private int rdNUM = 0;
  public Ret: bool = false;
  private RetVal: decimal[] = new Array<decimal>(10);
  //private METERTYPE[] SamplePriority = new METERTYPE[] { METERTYPE.MESH_RF, METERTYPE.PTP_RF, METERTYPE.DTS27_645_07, METERTYPE.DDS26_GELEX, METERTYPE.DTS27_VN31, METERTYPE.DTS27_645, METERTYPE.CPC_DTO1P, METERTYPE.CPC_DTO1P80, METERTYPE.CPC_PWD, METERTYPE.LTE66, METERTYPE.DTS27_ELSTER };
  private SamplePriority: METERTYPE[] = [METERTYPE.MESH_RF, METERTYPE.PTP_RF];
  private Stop_Flag: bool = false;
  private strDemand: string[] = new Array<string>(2);
  private szMeterSN: string = '';
  private thisText: string = '';
  //private Timer timer1;
  //private ColumnHeader value;
  private vol: float[] = new Array<float>(3);
  private volcurIndex: int = 0;
  private vt_Den: int = 1;
  private vt_Num: int = 1;
  public x: string = '';
  private Text: string = '';

  public static lsMeterTypeInfo: MeterTypeInfo[] = [];

  public communicationClass: CommuClass;

  public strMeterType: string = 'MESH_RF';
  public strResult: string = '';
  public strSERY_CTO: string = '12345678';
  public strMA_CTO: string = '66666612345678';

  // emic custom,

  public desiredSeri: string = '';
  public desiredTypeRead: enumDataType = enumDataType.Demand_DataType;
  public hasResultString: boolean = false;
  public resultStringFromBuffRec: string = '';
  public response: PropsResponse = {
    bSucceed: false,
    strMessage: '',
    obj: {},
  };

  //

  public constructor(props: PropsReadSTClass) {
    console.log('init constructor ReadST');
    this.communicationClass = new CommuClass({
      ...props,
      dataReturn: this.MeterData,
    });

    ReadSTClass.InitMeterRange();

    this.communicationClass.SPCommOpen();
    this.communicationClass.bytBaud[0] = 6;
    this.communicationClass.bytBaud[1] =
      0xff & (this.communicationClass.bytBaud[0] * 0x10);
  }

  public async GetOneDataType(dataType: enumDataType): Promise<boolean> {
    try {
      let meterType: METERTYPE = this.meterType;
      this.bReadContinue = false;

      if (!(await this.SampleData(dataType)) || this.bReadContinue) {
        //----------------------------------

        for (let i = 0; i < this.SamplePriority.length; i++) {
          if (this.bReadContinue) {
            this.meterType = METERTYPE.DTS27_645_07;
            if (!(!(await this.SampleData(dataType)) || this.bReadContinue)) {
              //MyGloab.SetMeterType(this.szMeterSN, (0xffffffff & this.meterType).toString());
              return true;
            }
            return false;
          }
          if (this.Stop_Flag) {
            return false;
          }
          if (
            this.SamplePriority[i] != meterType &&
            (meterType != METERTYPE.MESH_RF_180 ||
              this.SamplePriority[i] != METERTYPE.MESH_RF) &&
            (meterType != METERTYPE.MESH_RF ||
              this.SamplePriority[i] != METERTYPE.MESH_RF_180)
          ) {
            this.meterType = this.SamplePriority[i];
            this.bReadContinue = false;

            if (!(!(await this.SampleData(dataType)) || this.bReadContinue)) {
              //MyGloab.SetMeterType(this.szMeterSN, (0xffffffff & this.meterType).toString());
              return true;
            }
          }
        }

        //-----------------------------
      } else {
        //console.log('6');
        return true;
      }
    } catch (err: any) {
      console.log(TAG, 'err: ', err.message);
    }
    //console.log('7');
    return false;
  }

  public CommuteReceiveBufferCallback(buffer: Buffer) {
    //console.log('buffer here length:', buffer.byteLength);
    //this.communicationClass.SP_DataReceive(buffer);
  }

  private AppendLV(item: string, itemValue: string) {
    this.strResult += item + ' = ' + itemValue + '|';
  }

  public InitParameterByAddr() {
    this.strResult = '';

    try {
      this.Stop_Flag = false;
      //this.listView1.Items.Clear();

      if (this.strSERY_CTO.length < 8) {
        this.strSERY_CTO = this.strSERY_CTO.padStart(8, '0');
      }
      if (
        this.strSERY_CTO.substring(0, 1).toUpperCase() != 'M' &&
        this.strSERY_CTO.substring(0, 1).toUpperCase() != 'F'
      ) {
        this.bAddr[0] = Convert.ToByte(
          this.strSERY_CTO.substring(0, 0 + 2),
          0x10,
        );
        this.bAddr[1] = Convert.ToByte(
          this.strSERY_CTO.substring(2, 2 + 2),
          0x10,
        );
        this.bAddr[2] = Convert.ToByte(
          this.strSERY_CTO.substring(4, 4 + 2),
          0x10,
        );
        this.bAddr[3] = Convert.ToByte(
          this.strSERY_CTO.substring(6, 6 + 2),
          0x10,
        );
      }

      this.communicationClass.haveRecvbyte = false;
      this.bDisplayAddr = false;
      this.szMeterSN = this.strSERY_CTO;

      let objRef: any = {};

      this.meterType = MyGloab.GetMeterType(this.szMeterSN, true, objRef);
      this.bIsInRange = objRef.bIsInRange;

      console.log('\r\n\r\nseri: ', this.strSERY_CTO);

      console.log('this.meterType:', GetTypeMeterAndPhase(this.strSERY_CTO));

      if (this.bIsInRange && this.meterType == METERTYPE.DTS27_645_07) {
        let num: long = Convert.ToInt64(this.szMeterSN);
        if (
          (num >= 0x59afe6c5 && num <= 0x59afe6f6) ||
          (num >= 0x59afe6f7 && num <= 0x59afe728) ||
          (num >= 0x5b50785f && num <= 0x5b507890)
        ) {
          this.bIsSinglePhase = true;
        }
      }

      MyGloab.strMeterAdd = this.szMeterSN.padStart(12, '0');
      this.meterPhase = MyGloab.GetMeterPhase(MyGloab.strMeterAdd, 'KT');

      //if (this.meterPhase == METER_PHASE.SINGLE_PHASE)
      //{
      this.initCTVT();
    } catch (e: any) {
      console.log(TAG, e.message);
    }
  }

  public static GetMeterTypeRangeInfo(): void {
    let item: MeterTypeInfo = {
      strMeterRange: [],
      strMeterType: '',
    };
    ReadSTClass.lsMeterTypeInfo = [];

    const txt = `[MESH]
            13062552-13062601
            13115894-13116273
            [RTC]
            14111716-14277299
            14278900-14319869
            15072001-15074000 
            [PTP]
            16000001-19000001
            14000001-14063000
            14063301-14064600
            14065601-14111715
            13000001-13010811
            13014812-13062411
            13062907-13062943
            13063094-13115893
            13116274-13116473
            15074101-15080850
            15112791-15114790
            [DTS27-X329]
            34089114-34089213
            14999001-14999165
            33000123-33000123
            [DTS27-X335]
            1504700001-1504700250
            1532000001-1532099999
            1632000001-1632999999
            1732000001-1732999999
            1832000001-1832999999
            1932000001-1932999999
            [DTS27-645]
            1501700001-1501799999`;

    if (true) {
      let fileStr: string[] = txt.split(/\r?\n/);
      if (fileStr.length > 0) {
        for (let i = 0; i < fileStr.length; i++) {
          if (fileStr[i].indexOf('[') > -1 && fileStr[i].indexOf(']') > -1) {
            if (i != 0) {
              ReadSTClass.lsMeterTypeInfo.push(item);
            }
            item = {
              strMeterRange: [],
              strMeterType: fileStr[i]
                .trim()
                .replaceAll('[', '')
                .replaceAll(']', ''),
            };
          } else if (fileStr[i].trim().replaceAll(' ', '') != '') {
            item.strMeterRange.push(fileStr[i].trim().replaceAll(' ', ''));
            if (
              i == fileStr.length - 1 &&
              fileStr[i].indexOf('[') == -1 &&
              fileStr[i].indexOf(']') == -1
            ) {
              ReadSTClass.lsMeterTypeInfo.push(item);
            }
          }
        }
      }
    }

    //console.log('ReadSTClass.lsMeterTypeInfo:', ReadSTClass.lsMeterTypeInfo);
  }

  public static GetNowMeterRangeInfo(sMeterType: string): string {
    let str: string = '';
    let count: int = ReadSTClass.lsMeterTypeInfo.length;
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        let strMeterType: string = ReadSTClass.lsMeterTypeInfo[i].strMeterType;
        if (sMeterType == strMeterType) {
          let num3: int = ReadSTClass.lsMeterTypeInfo[i].strMeterRange.length;
          if (num3 > 0) {
            for (let j = 0; j < num3; j++) {
              if (
                ReadSTClass.lsMeterTypeInfo[i].strMeterRange[j] != '' &&
                ReadSTClass.lsMeterTypeInfo[i].strMeterRange[j] != null
              ) {
                if (j == 0) {
                  str = ReadSTClass.lsMeterTypeInfo[i].strMeterRange[j];
                } else {
                  str =
                    str + ',' + ReadSTClass.lsMeterTypeInfo[i].strMeterRange[j];
                }
              }
            }
          }
        }
      }
    }
    return str;
  }

  //   private CommOK(): bool {
  //     let flag: bool = true;
  //     let num: int = 60;
  //     let num2: int = 0;
  //     while (!this.Ret && num2 <= num) {
  //       await this.Sleep(50);

  //       if (this.Stop_Flag) {
  //         return false;
  //       }
  //       num2++;
  //     }
  //     if (num2 > num) {
  //       flag = false;
  //     }
  //     return flag;
  //   }

  private async CommOK_CPC(): Promise<boolean> {
    let flag: bool = false;
    let timeout: int = 0x2d * 100;

    const response: ResponseRxProps = {
      hhuHeader: {
        u8Cmd: 0,
        u16FSN: 0,
        u16Length: 0,
      },
    };

    console.log('CommOK_CPC');
    const succeed = await analysisRx(response, timeout);
    if (succeed) {
      if (response.hhuHeader.u8Cmd === TYPE_HHU_CMD.DATA) {
        const buffer = Buffer.alloc(HhuObj.countRec);
        HhuObj.buffRx.copy(buffer, 0, 0, HhuObj.countRec);
        console.log('countRec1:', HhuObj.countRec);

        this.hasResultString = true;
        this.resultStringFromBuffRec = StringFromArray(
          HhuObj.buffRx,
          0,
          HhuObj.countRec,
        );

        this.response = GelexProcessReceive({
          desiredSeri: this.desiredSeri,
          desiredDataType: this.desiredTypeRead,
          stringReceived: this.resultStringFromBuffRec,
        });

        this.CommuteReceiveBufferCallback(buffer);

        flag = this.response.bSucceed;
        // if (this.Ret) {
        //   return true;
        // } else {
        //   flag = false;
        // }
      } else {
        console.log('not command data HHM');
      }
    } else {
      flag = false;
      this.response.strMessage = 'Timeout';
    }
    return flag;
  }

  private async CommOK_Mesh(): Promise<boolean> {
    let flag: bool = false;
    let timeout: int = 7000;
    const response: ResponseRxProps = {
      hhuHeader: {
        u8Cmd: 0,
        u16FSN: 0,
        u16Length: 0,
      },
    };
    console.log('CommOK_Mesh');
    const succeed = await analysisRx(response, timeout);
    if (succeed) {
      if (response.hhuHeader.u8Cmd === TYPE_HHU_CMD.DATA) {
        //const buffer = Buffer.from(HhuObj.buffRx, 0, HhuObj.countRec);
        const buffer = Buffer.alloc(HhuObj.countRec);
        HhuObj.buffRx.copy(buffer, 0, 0, HhuObj.countRec);
        console.log('countRec1:', HhuObj.countRec);

        this.hasResultString = true;
        this.resultStringFromBuffRec = StringFromArray(
          HhuObj.buffRx,
          0,
          HhuObj.countRec,
        );

        this.response = GelexProcessReceive({
          desiredSeri: this.desiredSeri,
          desiredDataType: this.desiredTypeRead,
          stringReceived: this.resultStringFromBuffRec,
        });

        this.CommuteReceiveBufferCallback(buffer);

        flag = this.response.bSucceed;
      } else {
        console.log('not command data HHM');
        this.response.strMessage = 'Timeout';
      }
    } else {
      flag = false;
      this.response.strMessage = 'Timeout';
    }
    return flag;
  }

  private async CommOK1(): Promise<boolean> {
    let flag: bool = false;
    let timeout: int = 7000;
    const response: ResponseRxProps = {
      hhuHeader: {
        u8Cmd: 0,
        u16FSN: 0,
        u16Length: 0,
      },
    };
    console.log('CommOK1');
    const succeed = await analysisRx(response, timeout);
    if (succeed) {
      if (response.hhuHeader.u8Cmd === TYPE_HHU_CMD.DATA) {
        const buffer = Buffer.alloc(HhuObj.countRec);
        HhuObj.buffRx.copy(buffer, 0, 0, HhuObj.countRec);
        console.log('countRec1:', HhuObj.countRec);

        this.hasResultString = true;
        this.resultStringFromBuffRec = StringFromArray(
          HhuObj.buffRx,
          0,
          HhuObj.countRec,
        );

        this.response = GelexProcessReceive({
          desiredSeri: this.desiredSeri,
          desiredDataType: this.desiredTypeRead,
          stringReceived: this.resultStringFromBuffRec,
        });

        this.CommuteReceiveBufferCallback(buffer);

        flag = this.response.bSucceed;
      } else {
        console.log('not command data HHM');
      }
    } else {
      flag = false;
      this.response.strMessage = 'Timeout';
    }
    return flag;
  }

  private async CommOKElster(): Promise<boolean> {
    let flag = false;
    let timeout: int = 18000;
    const response: ResponseRxProps = {
      hhuHeader: {
        u8Cmd: 0,
        u16FSN: 0,
        u16Length: 0,
      },
    };
    console.log('CommOKElster');
    const succeed = await analysisRx(response, timeout);
    if (succeed) {
      if (response.hhuHeader.u8Cmd === TYPE_HHU_CMD.DATA) {
        const buffer = Buffer.alloc(HhuObj.countRec);
        HhuObj.buffRx.copy(buffer, 0, 0, HhuObj.countRec);
        console.log('countRec1:', HhuObj.countRec);

        this.hasResultString = true;
        this.resultStringFromBuffRec = StringFromArray(
          HhuObj.buffRx,
          0,
          HhuObj.countRec,
        );

        this.response = GelexProcessReceive({
          desiredSeri: this.desiredSeri,
          desiredDataType: this.desiredTypeRead,
          stringReceived: this.resultStringFromBuffRec,
        });

        this.CommuteReceiveBufferCallback(buffer);

        flag = this.response.bSucceed;
      } else {
        console.log('not command data HHM');
      }
    } else {
      flag = false;
      this.response.strMessage = 'Timeout';
    }
    return flag;
  }

  private async CommOKVN31(): Promise<boolean> {
    let flag = false;
    let timeout: int = 10000;
    const response: ResponseRxProps = {
      hhuHeader: {
        u8Cmd: 0,
        u16FSN: 0,
        u16Length: 0,
      },
    };
    console.log('CommOKVN31');
    const succeed = await analysisRx(response, timeout);
    if (succeed) {
      if (response.hhuHeader.u8Cmd === TYPE_HHU_CMD.DATA) {
        const buffer = Buffer.alloc(HhuObj.countRec);
        HhuObj.buffRx.copy(buffer, 0, 0, HhuObj.countRec);
        console.log('countRec1:', HhuObj.countRec);

        this.hasResultString = true;
        this.resultStringFromBuffRec = StringFromArray(
          HhuObj.buffRx,
          0,
          HhuObj.countRec,
        );

        this.response = GelexProcessReceive({
          desiredSeri: this.desiredSeri,
          desiredDataType: this.desiredTypeRead,
          stringReceived: this.resultStringFromBuffRec,
        });

        this.CommuteReceiveBufferCallback(buffer);

        flag = this.response.bSucceed;
      } else {
        console.log('not command data HHM');
      }
    } else {
      flag = false;
      this.response.strMessage = 'Timeout';
    }
    return flag;
  }

  public Confirm(bData: Buffer) {
    this.Ret = true;
  }

  private get29Num(bArray: Buffer, nStart: int): int {
    let length: int = bArray.length;
    let num2: int = 0;
    for (let i = nStart; i < length; i++) {
      if (bArray[i] == 0x29) {
        num2++;
      }
    }
    return num2;
  }

  public GetEnd(bArrayTmp: Buffer, nbegin: number, nEnd: number): number {
    for (let i = nbegin; i < nEnd; i++) {
      if (bArrayTmp[i] == 3) {
        return i;
      }
    }
    return -1;
  }

  public GetEnd_new(bArrayTmp: Buffer, nbegin: int, nEnd: int): int {
    for (let i = nbegin; i < nEnd; i++) {
      if (bArrayTmp[i] == 3) {
        return i;
      }
    }
    return -1;
  }

  private GetIndex(strType: string): byte {
    switch (strType) {
      case '50K_300':
        return 1;

      case '50K_600':
        return 2;

      case '50K_1_2k':
        return 3;

      case '50K_2_4k':
        return 4;

      case '50K_4_8k':
        return 5;

      case '50K_9_6k':
        return 6;

      case '50K_19_2k':
        return 7;

      case '50K_38_4k':
        return 8;

      case 'ST_70K':
        return 15;
    }
    return 6;
  }

  public GetMeterState(bState: byte): string[] {
    let str: string = Convert.ToString(bState, 2).padStart(8, '0');
    let str2: string = str.substring(str.length - 8, str.length - 8 + 8);
    let strArray: string[] = new Array<string>(str2.replaceAll('0', '').length);
    if (strArray.length > 0) {
      let num2: int = 0;
      if (str2.substring(7, 7 + 1) == '1') {
        strArray[num2++] = 'Miss_A';
      }
      if (str2.substring(6, 6 + 1) == '1') {
        strArray[num2++] = 'Miss_B';
      }
      if (str2.substring(5, 5 + 1) == '1') {
        strArray[num2++] = 'Miss_C';
      }
      if (str2.substring(4, 4 + 1) == '1') {
        strArray[num2++] = 'Reverse_A';
      }
      if (str2.substring(3, 3 + 1) == '1') {
        strArray[num2++] = 'Reverse_B';
      }
      if (str2.substring(2, 2 + 1) == '1') {
        strArray[num2++] = 'Reverse_C';
      }
      if (str2.substring(1, 1 + 1) == '1') {
        strArray[num2++] = 'BatteryLow';
      }
      if (str2.substring(0, 0 + 1) == '1') {
        strArray[num2++] = 'PowerDown';
      }
    }
    return strArray;
  }

  public GetStart(bArrayTmp: Buffer, nbegin: int, nEnd: int): int {
    for (let i = nbegin; i < nEnd; i++) {
      if (bArrayTmp[i] == 2) {
        return i;
      }
    }
    return -1;
  }

  public GetStartNew(bArrayTmp: Buffer, nbegin: int, nEnd: int): int {
    let num: int = 0;
    for (let i = nbegin; i < nEnd; i++) {
      if (bArrayTmp[i] == 40) {
        return num;
      }
      num++;
    }
    return num;
  }

  private getValueLength(bArray: Buffer, nStart: int): int {
    let length: int = bArray.length;
    let num2: int = 0;
    for (let i = nStart; i < length; i++) {
      if (bArray[i] == 0x29) {
        num2++;
        return num2;
      }
      num2++;
    }
    return num2;
  }

  private initCTVT(): void {
    this.ct_Num = 1;
    this.vt_Num = 1;
    this.ct_Den = 1;
    this.vt_Den = 1;
    this.iCT_Meter = 1;
    this.iVT_Meter = 1;
    this.iCT_Value = 1;
    this.iVT_Value = 1;
    this.iCTVT_Value = 1;
  }

  public MeterData(bArray: Buffer) {}

  // public MeterData(bArray: Buffer) {
  //   try {
  //     let iStatus: int = 0;
  //     let dEneregy: decimal = 0;
  //     if (!this.bDisplayAddr) {
  //       let str: string = '';
  //       let strArray: string[] = new Array<string>(9);
  //       let length: int = bArray.length;
  //       let str2: string = '';
  //       iStatus = 0;
  //       dEneregy = 0;
  //       let arrayD: Buffer = Buffer.alloc(4);
  //       let str3: string = '';
  //       for (let j = 0; j < bArray.length; j++) {
  //         str3 = str3 + ' ' + bArray[j].toString(16).padStart(2, '0');
  //       }
  //       let index: int = 0;
  //       while (index < strArray.length) {
  //         strArray[index] = '0';
  //         index++;
  //       }
  //       if (this.communicationClass.isReadVersion) {
  //         let version: string =
  //           bArray[0x1f].toString(16).padStart(2, '0') +
  //           bArray[30].toString(16).padStart(2, '0') +
  //           bArray[0x1d].toString(16).padStart(2, '0') +
  //           '-' +
  //           bArray[0x20].toString(16).padStart(2, '0');
  //         this.AppendLV('Version', version);
  //         this.Ret = true;
  //       } else {
  //         if (this.bReadGroupData) {
  //           let str4: string = str3.replaceAll('28', '');
  //           let num2: int = (str3.length - str4.length) / 2;
  //           str4 = str3.replaceAll('29', '');
  //           let num3: int = (str3.length - str4.length) / 2;
  //           if (num2 > num3) {
  //             num2 = num3;
  //           }
  //           if (num2 == 9) {
  //             this.meterType = METERTYPE.MESH_RF;
  //           }
  //         }
  //         if (
  //           bArray[0] == 0x68 &&
  //           bArray[7] == 0x68 &&
  //           (bArray[8] == 0x91 || bArray[8] == 0xb1) &&
  //           this.meterType == METERTYPE.MESH_RF
  //         ) {
  //           this.Ret = true;
  //           this.bReadContinue = true;
  //         } else {
  //           let num8: int = 0;
  //           if (
  //             this.meterType == METERTYPE.MESH_RF ||
  //             this.meterType == METERTYPE.MESH_RF_180 ||
  //             this.meterType == METERTYPE.DTS27_X329 ||
  //             this.meterType == METERTYPE.DTS27_ELSTER
  //           ) {
  //             let str5: string = '';
  //             let flag: bool = false;
  //             if (bArray.length < 20) {
  //               return;
  //             }
  //             let num6: int = this.GetStart(bArray, 0, bArray.length - 1);
  //             let nbegin: int = this.GetEnd(bArray, 0, bArray.length - 1);
  //             while (num6 >= 0 && nbegin >= 0 && num6 < nbegin) {
  //               str5 = '';
  //               try {
  //                 let num21: int = 0;
  //                 let str11: string = '';
  //                 num8 = num6 + 1;
  //                 while (num8 < nbegin) {
  //                   str5 =
  //                     str5 + EncodingASCIIGetString(bArray, num8, 1).toString();
  //                   num8++;
  //                 }
  //                 let num9: int = str5.indexOf('(');
  //                 let num10: int = str5.indexOf(')');
  //                 let str6: string = str5.substring(0, num9);
  //                 let str7: string = str5.substring(
  //                   num9 + 1,
  //                   num9 + 1 + num10 - num9 - 1,
  //                 );
  //                 if (str6 == '0.0.0') {
  //                   let num12: int = 0;
  //                   let num13: int = 0;
  //                   let num14: int = 0;
  //                   flag = true;
  //                   let totalWidth: int = str7.length;
  //                   str2 = str7.padStart(totalWidth, '0').padStart(8, '0');
  //                   if (
  //                     this.meterType != METERTYPE.MESH_RF &&
  //                     this.meterType != METERTYPE.MESH_RF_180
  //                   ) {
  //                     if (this.meterType == METERTYPE.DTS27_X329) {
  //                       let num16: int = this.GetStart(
  //                         bArray,
  //                         nbegin,
  //                         bArray.length - 1,
  //                       );
  //                       let num17: int = this.GetEnd(
  //                         bArray,
  //                         nbegin + 1,
  //                         bArray.length - 1,
  //                       );
  //                       let str8: string = '';
  //                       for (let k = num16 + 1; k < num17; k++) {
  //                         str8 =
  //                           str8 +
  //                           EncodingASCIIGetString(bArray, k, 1).toString();
  //                       }
  //                       let num19: int = str8.indexOf('(');
  //                       let num20: int = str8.indexOf(')');
  //                       let str9: string = str8.substring(0, num19);
  //                       let str10: string = str8.substring(
  //                         num19 + 1,
  //                         num19 + 1 + num20 - num19 - 1,
  //                       );
  //                       switch (str9) {
  //                         case '15.8.0':
  //                           num21 = str10.indexOf('*');
  //                           str11 = str10.substring(0, num21);
  //                           dEneregy = Convert.ToDecimal(str11);
  //                           this.AppendLV('KT', dEneregy.toString() + ' kWh');

  //                           break;

  //                         case '3.8.0':
  //                           num21 = str10.indexOf('*');
  //                           str11 = str10.substring(0, num21);
  //                           dEneregy = Convert.ToDecimal(str11);
  //                           this.AppendLV('VC', dEneregy.toString() + ' kVarh');

  //                           break;

  //                         case '99.1.0':
  //                           num12 = this.GetStartNew(
  //                             bArray,
  //                             num16,
  //                             bArray.length - 1,
  //                           );
  //                           num13 = num16 + num12 + 1;
  //                           num14 = 0;
  //                           try {
  //                             num14 = this.getValueLength(bArray, num13);
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Current-R',
  //                               'A',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Current-Y',
  //                               'A',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Current-B',
  //                               'A',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Voltage-R',
  //                               'V',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Voltage-Y',
  //                               'V',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Voltage-B',
  //                               'V',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'LostPhase',
  //                               '',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'SEQ',
  //                               '',
  //                             );
  //                             num13 += num14;
  //                             num14 = this.getValueLength(bArray, num13);
  //                             this.RtturnBlockValue(
  //                               bArray,
  //                               num13,
  //                               num14,
  //                               'Event State',
  //                               '',
  //                             );
  //                           } catch {}
  //                           break;
  //                       }
  //                       this.Ret = true;
  //                       return;
  //                     }
  //                   } else if (this.bReadGroupData) {
  //                     this.bReadGroupData = false;
  //                     num12 = this.GetStartNew(
  //                       bArray,
  //                       nbegin,
  //                       bArray.length - 1,
  //                     );
  //                     num13 = nbegin + num12;
  //                     str5 = '';
  //                     let flag2: bool = true;
  //                     num8 = nbegin + 3;
  //                     while (num8 < num13) {
  //                       if (bArray[num8] == 2 || !flag2) {
  //                         if (bArray[num8] == 2) {
  //                           flag2 = false;
  //                         } else {
  //                           str5 =
  //                             str5 +
  //                             EncodingASCIIGetString(
  //                               bArray,
  //                               num8,
  //                               1,
  //                             ).toString();
  //                         }
  //                       }
  //                       num8++;
  //                     }
  //                     str6 = str5;
  //                     num14 = 0;
  //                     let num15: int = 0;
  //                     try {
  //                       num15 = this.get29Num(bArray, num13);
  //                       let strArray2: string[] = new Array<string>(num15);
  //                       let strArray3: string[] = new Array<string>(num15);
  //                       if (this.meterPhase == METER_PHASE.THREE_PHASE) {
  //                         switch (str6) {
  //                           case '99.1.0':
  //                             strArray2 = [
  //                               'CT Numerator',
  //                               'CT Denominator',
  //                               'VT Numerator',
  //                               'VT Denominator',
  //                               'A Phase Current',
  //                               'B Phase Current',
  //                               'C Phase Current',
  //                               'A Phase Voltage',
  //                               'B Phase Voltage',
  //                               'C Phase Voltage',
  //                               'KT',
  //                               'T1',
  //                               'T2',
  //                               'T3',
  //                               'VC',
  //                             ];
  //                             strArray3 = [
  //                               '',
  //                               '',
  //                               '',
  //                               '',
  //                               'A',
  //                               'A',
  //                               'A',
  //                               'V',
  //                               'V',
  //                               'V',
  //                               'kWh',
  //                               'kWh',
  //                               'kWh',
  //                               'kWh',
  //                               'kVarh',
  //                             ];
  //                             num8 = 0;
  //                             while (num8 < num15) {
  //                               num14 = this.getValueLength(bArray, num13);
  //                               this.RtturnBlockValue(
  //                                 bArray,
  //                                 num13,
  //                                 num14,
  //                                 strArray2[num8],
  //                                 strArray3[num8],
  //                               );
  //                               num13 += num14;
  //                               num8++;
  //                             }
  //                             console.log('go to label: Label_230B');
  //                             break;

  //                           //continue Label_230B;

  //                           case '99.1.1':
  //                             strArray2 = [
  //                               'Max Demand',
  //                               'Max T1 Demand',
  //                               'Max T2 Demand',
  //                               'Max T3 Demand',
  //                               'Max VC Demand',
  //                             ];
  //                             strArray3 = ['kW', 'kW', 'kW', 'kW', 'kVar'];
  //                             num8 = 0;
  //                             while (num8 < num15) {
  //                               num14 = this.getValueLength(bArray, num13);
  //                               this.RtturnDemondValue(
  //                                 bArray,
  //                                 num13,
  //                                 num14,
  //                                 strArray2[num8],
  //                                 strArray3[num8],
  //                               );
  //                               num13 += num14;
  //                               num8++;
  //                             }
  //                             break;
  //                         }
  //                       } else {
  //                         if (num15 > 6) {
  //                           num14 = this.getValueLength(bArray, num13);
  //                           this.RtturnBlockValue(
  //                             bArray,
  //                             num13,
  //                             num14,
  //                             'Date Add Week',
  //                             '',
  //                           );
  //                           num13 += num14;
  //                           num14 = this.getValueLength(bArray, num13);
  //                           this.RtturnBlockValue(
  //                             bArray,
  //                             num13,
  //                             num14,
  //                             'Time',
  //                             '',
  //                           );
  //                           num13 += num14;
  //                         }
  //                         num14 = this.getValueLength(bArray, num13);
  //                         num13 += num14;
  //                         num14 = this.getValueLength(bArray, num13);
  //                         this.RtturnBlockValue(
  //                           bArray,
  //                           num13,
  //                           num14,
  //                           'Voltage',
  //                           'V',
  //                         );
  //                         num13 += num14;
  //                         num14 = this.getValueLength(bArray, num13);
  //                         this.RtturnBlockValue(
  //                           bArray,
  //                           num13,
  //                           num14,
  //                           'Current',
  //                           'A',
  //                         );
  //                         num13 += num14;
  //                         num14 = this.getValueLength(bArray, num13);
  //                         this.RtturnBlockValue(
  //                           bArray,
  //                           num13,
  //                           num14,
  //                           'power',
  //                           '',
  //                         );
  //                         num13 += num14;
  //                         num14 = this.getValueLength(bArray, num13);
  //                         this.RtturnBlockValue(
  //                           bArray,
  //                           num13,
  //                           num14,
  //                           'SEQ',
  //                           '',
  //                         );
  //                         num13 += num14;
  //                         num14 = this.getValueLength(bArray, num13);
  //                         this.RtturnBlockValue(
  //                           bArray,
  //                           num13,
  //                           num14,
  //                           'Tamper Times',
  //                           '',
  //                         );
  //                       }
  //                     } catch {
  //                       console.log(TAG, 'Data block Error');
  //                     }
  //                   }
  //                 } else if (str6 == '1.8.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('KT', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.8.1') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T1', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.8.2') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T2', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.8.3') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T3', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.8.4') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T4', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.9.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('KT', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.9.1') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T1', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.9.2') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T2', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.9.3') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T3', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '1.9.4') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T4', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '3.8.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('VC', dEneregy.toString() + ' kVarh');
  //                 } else if (str6 == '1.6.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   let dt: string = MyGloab.MaxDemandTime(
  //                     str5.substring(num10 + 1),
  //                   );
  //                   dEneregy = Convert.ToDecimal(str11);

  //                   this.AppendLV('Max Demand', dEneregy.toString() + ' kW');
  //                   this.AppendLV('Time', dt);
  //                 } else if (str6 == '1.6.1') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   let dt: string = MyGloab.MaxDemandTime(
  //                     str5.substring(num10 + 1),
  //                   );
  //                   dEneregy = Convert.ToDecimal(str11);

  //                   this.AppendLV('Max T1 Demand', dEneregy.toString() + ' kW');
  //                   this.AppendLV('Time', dt);
  //                 } else if (str6 == '1.6.2') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   let dt: string = MyGloab.MaxDemandTime(
  //                     str5.substring(num10 + 1),
  //                   );
  //                   dEneregy = Convert.ToDecimal(str11);

  //                   this.AppendLV('Max T2 Demand', dEneregy.toString() + ' kW');
  //                   this.AppendLV('Time', dt);
  //                 } else if (str6 == '1.6.3') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   let dt: string = MyGloab.MaxDemandTime(
  //                     str5.substring(num10 + 1),
  //                   );
  //                   dEneregy = Convert.ToDecimal(str11);

  //                   this.AppendLV('Max T3 Demand', dEneregy.toString() + ' kW');
  //                   this.AppendLV('Time', dt);
  //                 } else if (str6 == '3.6.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   let dt: string = MyGloab.MaxDemandTime(
  //                     str5.substring(num10 + 1),
  //                   );
  //                   dEneregy = Convert.ToDecimal(str11);

  //                   this.AppendLV(
  //                     'Max VC Demand',
  //                     dEneregy.toString() + ' kVar',
  //                   );
  //                   this.AppendLV('Time', dt);
  //                 } else if (str6 == '11.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('Current', dEneregy.toString() + 'A');
  //                 } else if (str6 == '12.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('Voltage', dEneregy.toString() + 'V');
  //                 } else if (str6 == '31.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('A Current', dEneregy.toString() + 'A');
  //                 } else if (str6 == '32.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('A Voltage', dEneregy.toString() + 'V');
  //                 } else if (str6 == '51.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('B Current', dEneregy.toString() + 'A');
  //                 } else if (str6 == '52.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('B Voltage', dEneregy.toString() + 'V');
  //                 } else if (str6 == '71.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('C Current', dEneregy.toString() + 'A');
  //                 } else if (str6 == '72.7.0') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('C Voltage', dEneregy.toString() + 'V');
  //                 } else if (str6 == '15.8.0') {
  //                   let strObisN: string = '';
  //                   let strUnit: string = '';
  //                   let isDisplay: bool = true;
  //                   while (num9 > 0 && num10 > 0) {
  //                     try {
  //                       isDisplay = true;
  //                       strUnit = ' kWh';
  //                       if (str6 == '15.8.0') {
  //                         strObisN = 'KT';
  //                       } else if (str6 == '15.8.1') {
  //                         strObisN = 'T1';
  //                       } else if (str6 == '15.8.2') {
  //                         strObisN = 'T2';
  //                       } else if (str6 == '15.8.3') {
  //                         strObisN = 'T3';
  //                       } else if (str6 == '17.8.0') {
  //                         strObisN = 'VC';
  //                         strUnit = ' kVarh';
  //                       } else {
  //                         isDisplay = false;
  //                       }
  //                       if (isDisplay) {
  //                         num21 = str7.indexOf('*');
  //                         str11 = str7.substring(0, num21);
  //                         dEneregy = Convert.ToDecimal(str11);
  //                         this.AppendLV(
  //                           strObisN,
  //                           dEneregy.toString() + strUnit,
  //                         );
  //                       }
  //                       str5 = str5.substring(num10 + 1);
  //                       if (str5 == '') {
  //                         break;
  //                       }
  //                       num9 = str5.indexOf('(');
  //                       num10 = str5.indexOf(')');
  //                       str6 = str5.substring(0, num9);
  //                       str7 = str5.substring(
  //                         num9 + 1,
  //                         num9 + 1 + num10 - num9 - 1,
  //                       );
  //                     } catch {}
  //                   }
  //                 } else if (str6 == '15.8.1') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T1', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '15.8.2') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T2', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '15.8.3') {
  //                   num21 = str7.indexOf('*');
  //                   str11 = str7.substring(0, num21);
  //                   dEneregy = Convert.ToDecimal(str11);
  //                   this.AppendLV('T3', dEneregy.toString() + ' kWh');
  //                 } else if (str6 == '507001') {
  //                   this.meterType = METERTYPE.DTS27_ELSTER;
  //                   if (str7.length != 0x80) {
  //                     return;
  //                   }
  //                   let strCommand: string[] = [
  //                     'Forward Active Energy',
  //                     'Reverse Active Energy',
  //                     'Q1 Energy',
  //                     'Q2 Energy',
  //                     'Q3 Energy',
  //                     'Q4 Energy',
  //                     'Q1+Q2',
  //                     'Q3+Q4',
  //                     'Q1+Q2+Q3+Q4',
  //                     'Apparent Energy',
  //                     'Combined1 Energy',
  //                   ];
  //                   let strUnit: string[] = [
  //                     'Wh',
  //                     'Wh',
  //                     'varh',
  //                     'varh',
  //                     'varh',
  //                     'varh',
  //                     'varh',
  //                     'varh',
  //                     'varh',
  //                     'VAh',
  //                     'Wh',
  //                   ];
  //                   let dValue: number[] = new Array(11);
  //                   index = 0;
  //                   while (index < 8) {
  //                     let str12: string = str7.substring(
  //                       0x10 * index,
  //                       0x10 * index + 0x10,
  //                     );
  //                     if (index < 6) {
  //                       dValue[index] =
  //                         Convert.ToDecimal(MyGloab.Reverse2String(str12)) /
  //                         1000.0;
  //                     } else {
  //                       dValue[index + 3] =
  //                         Convert.ToDecimal(MyGloab.Reverse2String(str12)) /
  //                         1000.0;
  //                     }
  //                     if (index == 5) {
  //                       dValue[index + 1] =
  //                         dValue[index - 2] + dValue[index - 3];
  //                       dValue[index + 2] = dValue[index - 1] + dValue[index];
  //                       dValue[index + 3] =
  //                         dValue[index + 1] + dValue[index + 2];
  //                     }
  //                     index++;
  //                   }

  //                   for (let i = 0; i < 11; i++) {
  //                     this.AppendLV(
  //                       strCommand[i],
  //                       dValue[i].toString() + ' ' + strUnit[i],
  //                     );
  //                   }
  //                 } else {
  //                   let num28: decimal = 0;
  //                   if (str6 == '508001') {
  //                     let strN: string = '';
  //                     if (str7.length != 0x80) {
  //                       return;
  //                     }
  //                     for (let i = 0; i < 6; i++) {
  //                       if (i < 3) {
  //                         strN = 'Forward T';
  //                       } else {
  //                         strN = 'Reverse T';
  //                       }
  //                       let sValue: string = str7.substring(
  //                         0x10 * i,
  //                         0x10 * i + 0x10,
  //                       );
  //                       num28 =
  //                         Convert.ToDecimal(MyGloab.Reverse2String(sValue)) /
  //                         1000.0;
  //                       sValue = num28.toString();

  //                       if (i < 3) {
  //                         let num = i + 1;
  //                         this.AppendLV(strN + num.toString(), sValue + ' Wh');
  //                       } else {
  //                         this.AppendLV(
  //                           strN + (i - 2).toString(),
  //                           sValue + ' Wh',
  //                         );
  //                       }
  //                     }
  //                   } else if (
  //                     str6 == '509001' ||
  //                     str6 == '510001' ||
  //                     str6 == '510002' ||
  //                     str6 == '510003'
  //                   ) {
  //                     let strName: string = '';
  //                     if (str6 == '509001') {
  //                       strName = 'Max Demand';
  //                     } else {
  //                       strName =
  //                         'T' + str6.substring(5, 5 + 1) + ' Max Demand';
  //                     }
  //                     let strTime: string = str7.substring(0, 8);
  //                     let num22: long =
  //                       Convert.ToInt64(strTime.substring(6, 6 + 2), 0x10) *
  //                         0x100 *
  //                         0x100 *
  //                         0x100 +
  //                       Convert.ToInt64(strTime.substring(4, 4 + 2), 0x10) *
  //                         0x100 *
  //                         0x100 +
  //                       Convert.ToInt64(strTime.substring(2, 2 + 2), 0x10) *
  //                         0x100 +
  //                       Convert.ToInt64(strTime.substring(0, 0 + 2), 0x10);
  //                     if (num22 == 0) {
  //                       return;
  //                     }
  //                     //   strTime = MyGloab.ConvertIntDateTime(
  //                     //     Convert.ToDouble(num22),
  //                     //   ).toString('yyyy-MM-dd HH:mm:ss');

  //                     strTime = formatTimeHHM(
  //                       MyGloab.ConvertIntDateTime(Convert.ToDouble(num22)),
  //                     );

  //                     this.AppendLV(strName + ' Time', strTime);
  //                     let sValue: string = str7.substring(10, 10 + 14);
  //                     num28 =
  //                       Convert.ToDecimal(MyGloab.Reverse2String(sValue)) /
  //                       1000.0;
  //                     sValue = num28.toString();
  //                     this.AppendLV(strName, sValue + ' W');
  //                   } else if (str6 == '605001') {
  //                     if (str7.indexOf('9A') >= 0) {
  //                       this.bCurrent = true;
  //                     } else {
  //                       this.bCurrent = false;
  //                     }
  //                   } else if (str6 == '606001') {
  //                     let strCurr: string[] = [];
  //                     if (str7.length != 0x38) {
  //                       return;
  //                     }
  //                     let strUnit: string = ' V';
  //                     if (this.bCurrent) {
  //                       strCurr = ['Current A', 'Current B', 'Current C'];
  //                       strUnit = ' A';
  //                     } else {
  //                       strCurr = ['Voltage A', 'Voltage B', 'Voltage C'];
  //                     }
  //                     for (let i = 0; i < 3; i++) {
  //                       let sValue: string = str7.substring(
  //                         14 * i,
  //                         14 * i + 14,
  //                       );
  //                       sValue = (
  //                         Convert.ToDecimal(sValue) / 10000.0
  //                       ).toString();
  //                       this.AppendLV(strCurr[i], sValue + strUnit);
  //                     }
  //                   }
  //                 }
  //                 console.log('this is label Label_230B');

  //                 num6 = this.GetStart(bArray, nbegin + 1, bArray.length - 1);
  //                 nbegin = this.GetEnd(bArray, nbegin + 1, bArray.length - 1);
  //               } catch {
  //                 return;
  //               }
  //             }
  //             this.communicationClass.bflag21 = false;
  //             if (!flag) {
  //               return;
  //             }
  //           } else {
  //             let str13: string = '';
  //             let num23: byte = 0;
  //             if (this.meterType == METERTYPE.DTS27_645) {
  //               for (index = 0; index < 6; index++) {
  //                 str =
  //                   Convert.ToString(bArray[1 + index], 0x10).padStart(2, '0') +
  //                   str;
  //               }
  //               if (bArray[11] == 0xd3 || bArray[11] == 0xe3) {
  //                 if (bArray[11] == 0xd3) {
  //                   this.strDemand[0] =
  //                     MyGloab.ByteToBCD(bArray[14]) +
  //                     '.' +
  //                     MyGloab.ByteToBCD(bArray[13]) +
  //                     MyGloab.ByteToBCD(bArray[12]);
  //                   this.strDemand[1] =
  //                     MyGloab.ByteToBCD(bArray[0x29]) +
  //                     '.' +
  //                     MyGloab.ByteToBCD(bArray[40]) +
  //                     MyGloab.ByteToBCD(bArray[0x27]);
  //                   this.bDemand = true;
  //                 } else if (this.bDemand) {
  //                   let dt1: string =
  //                     '20' +
  //                     MyGloab.ByteToBCD(bArray[0x10]) +
  //                     '/' +
  //                     MyGloab.ByteToBCD(bArray[15]) +
  //                     '/' +
  //                     MyGloab.ByteToBCD(bArray[14]) +
  //                     ' ' +
  //                     MyGloab.ByteToBCD(bArray[13]) +
  //                     ':' +
  //                     MyGloab.ByteToBCD(bArray[12]);
  //                   let dt2: string =
  //                     '20' +
  //                     MyGloab.ByteToBCD(bArray[0x3d]) +
  //                     '/' +
  //                     MyGloab.ByteToBCD(bArray[60]) +
  //                     '/' +
  //                     MyGloab.ByteToBCD(bArray[0x3b]) +
  //                     ' ' +
  //                     MyGloab.ByteToBCD(bArray[0x3a]) +
  //                     ':' +
  //                     MyGloab.ByteToBCD(bArray[0x39]);

  //                   this.AppendLV(
  //                     'Max Demand+',
  //                     Convert.ToDecimal(this.strDemand[0]).toString() + ' kW',
  //                   );
  //                   this.AppendLV('Date time', dt1.toString());
  //                   this.AppendLV(
  //                     'Max Demand-',
  //                     Convert.ToDecimal(this.strDemand[1]).toString() + ' kW',
  //                   );
  //                   this.AppendLV('Date time', dt2.toString());
  //                 }
  //               } else if (bArray[10] == 0x4f && bArray[11] == 0xf4) {
  //                 this.strDemand[0] =
  //                   MyGloab.ByteToBCD(bArray[13]) +
  //                   MyGloab.ByteToBCD(bArray[12]) +
  //                   '.' +
  //                   MyGloab.ByteToBCD(bArray[0x13]) +
  //                   MyGloab.ByteToBCD(bArray[0x12]);
  //                 this.strDemand[1] =
  //                   MyGloab.ByteToBCD(bArray[15]) +
  //                   MyGloab.ByteToBCD(bArray[14]) +
  //                   '.' +
  //                   MyGloab.ByteToBCD(bArray[0x11]) +
  //                   MyGloab.ByteToBCD(bArray[0x10]);
  //                 this.iCT_Value = Convert.ToDecimal(this.strDemand[0]);
  //                 this.iVT_Value = Convert.ToDecimal(this.strDemand[1]);
  //                 this.iCTVT_Value = this.iCT_Value * this.iVT_Value;

  //                 this.AppendLV('CT_Value', this.iCT_Value.toString());
  //                 this.AppendLV('VT_Value', this.iVT_Value.toString());
  //               } else if (bArray[11] == 0xe9) {
  //                 str13 = '';
  //                 if (bArray[9] == 6) {
  //                   num8 = 3;
  //                 } else {
  //                   num8 = 2;
  //                 }
  //                 while (num8 >= 0) {
  //                   num23 = 0xff & (bArray[12 + num8] - 0x33);
  //                   if (num8 == 1) {
  //                     str13 =
  //                       str13 +
  //                       Convert.ToString(num23, 0x10).padStart(2, '0') +
  //                       '.';
  //                   } else {
  //                     str13 =
  //                       str13 + Convert.ToString(num23, 0x10).padStart(2, '0');
  //                   }
  //                   num8--;
  //                 }
  //                 strArray[0] = str13;
  //                 let nt1: decimal = Convert.ToDecimal(str13);
  //                 if (bArray[10] == 0x44) {
  //                   this.AppendLV('A Voltage', nt1.toString() + ' V');
  //                 } else if (bArray[10] == 0x45) {
  //                   this.AppendLV('B Voltage', nt1.toString() + ' V');
  //                 } else if (bArray[10] == 70) {
  //                   this.AppendLV('C Voltage', nt1.toString() + ' V');
  //                 } else if (bArray[10] == 0x54) {
  //                   this.AppendLV('A Current', nt1.toString() + ' A');
  //                 } else if (bArray[10] == 0x55) {
  //                   this.AppendLV('B Current', nt1.toString() + ' A');
  //                 } else if (bArray[10] == 0x56) {
  //                   this.AppendLV('C Current', nt1.toString() + ' A');
  //                 }
  //               } else if (bArray[10] != 0x43 || bArray[11] != 0xc3) {
  //                 if (length > 0x13) {
  //                   for (index = 0; index < 9; index++) {
  //                     str13 = '';
  //                     for (num8 = 4; num8 >= 0; num8--) {
  //                       num23 = 0xff & (bArray[12 + num8 + index * 5] - 0x33);
  //                       if (num8 == 1) {
  //                         str13 =
  //                           str13 +
  //                           Convert.ToString(num23, 0x10).padStart(2, '0') +
  //                           '.';
  //                       } else {
  //                         str13 =
  //                           str13 +
  //                           Convert.ToString(num23, 0x10).padStart(2, '0');
  //                       }
  //                     }
  //                     strArray[index] = str13;
  //                   }
  //                   let nt1: decimal = Convert.ToDecimal(strArray[1]);
  //                   let nt2: decimal = Convert.ToDecimal(strArray[2]);
  //                   let nt3: decimal = Convert.ToDecimal(strArray[3]);
  //                   let nt5: decimal = Convert.ToDecimal(strArray[0]);

  //                   this.AppendLV('BT', nt1.toString() + ' kWh');
  //                   this.AppendLV('CD', nt2.toString() + ' kWh');
  //                   this.AppendLV('TD', nt3.toString() + ' kWh');
  //                   this.AppendLV('SG', nt5.toString() + ' kWh');
  //                 } else if (length > 0x11) {
  //                   str13 = '';
  //                   num8 = 4;
  //                   while (num8 >= 0) {
  //                     num23 = 0xff & (bArray[12 + num8] - 0x33);
  //                     if (num8 == 1) {
  //                       str13 =
  //                         str13 +
  //                         Convert.ToString(num23, 0x10).padStart(2, '0') +
  //                         '.';
  //                     } else {
  //                       str13 =
  //                         str13 +
  //                         Convert.ToString(num23, 0x10).padStart(2, '0');
  //                     }
  //                     num8--;
  //                   }
  //                   strArray[0] = str13;
  //                   let nt1: decimal = Convert.ToDecimal(str13);
  //                   this.AppendLV('VC', nt1.toString() + ' kVarh');
  //                 }
  //               }
  //             } else if (this.meterType == METERTYPE.DTS27_VN31) {
  //               index = 0;
  //               index = 7;
  //               while (index < bArray.length) {
  //                 if (bArray[index] != 0x29) {
  //                   str2 =
  //                     str2 +
  //                     EncodingASCIIGetString(bArray, index, 1).toString();
  //                 } else {
  //                   break;
  //                 }
  //                 index++;
  //               }
  //               let str14: string = str2.padStart(12, '0');
  //               let szData: string = '';
  //               let flag3: bool = false;
  //               for (index += 3; index < bArray.length; index++) {
  //                 if (
  //                   bArray[index] == 0xc4 &&
  //                   bArray[index + 1] == 1 &&
  //                   bArray[index + 2] == 0xc1 &&
  //                   bArray[index + 3] == 0
  //                 ) {
  //                   szData =
  //                     bArray[index + 5].toString(16).padStart(2, '0') +
  //                     bArray[index + 6].toString(16).padStart(2, '0') +
  //                     bArray[index + 7].toString(16).padStart(2, '0') +
  //                     bArray[index + 8].toString(16).padStart(2, '0');
  //                   if (szData != '') {
  //                     this.RetVal[this.ItemIndex] =
  //                       Convert.ToDecimal(Convert.ToInt32(szData, 0x10)) /
  //                       100.0;
  //                     this.ItemIndex++;
  //                   }
  //                   index += 8;
  //                   flag3 = true;
  //                 }
  //               }
  //               if (!flag3) {
  //                 return;
  //               }
  //             } else if (this.meterType == METERTYPE.DTS27_645_07) {
  //               for (index = 0; index < 6; index++) {
  //                 str =
  //                   Convert.ToString(bArray[1 + index], 0x10).padStart(2, '0') +
  //                   str;
  //               }
  //               if (
  //                 bArray[10] == 0x33 &&
  //                 (bArray[11] == 50 || bArray[11] == 0x33) &&
  //                 (bArray[12] == 0x33 || bArray[12] == 0x34) &&
  //                 bArray[13] == 0x33
  //               ) {
  //                 let iTariffNum: int = 4;
  //                 if (this.bIsSinglePhase || bArray[9] < 0x18) {
  //                   iTariffNum = 1;
  //                 }
  //                 for (index = 0; index < iTariffNum; index++) {
  //                   str13 = '';
  //                   num8 = 3;
  //                   while (num8 >= 0) {
  //                     num23 = 0xff & (bArray[14 + num8 + index * 4] - 0x33);
  //                     if (num8 == 1) {
  //                       str13 =
  //                         str13 +
  //                         Convert.ToString(num23, 0x10).padStart(2, '0') +
  //                         '.';
  //                     } else {
  //                       str13 =
  //                         str13 +
  //                         Convert.ToString(num23, 0x10).padStart(2, '0');
  //                     }
  //                     num8--;
  //                   }
  //                   strArray[index] = str13;
  //                 }
  //                 let nt1: decimal =
  //                   Convert.ToDecimal(strArray[1]) * this.iCTVT_Value;
  //                 let nt2: decimal =
  //                   Convert.ToDecimal(strArray[2]) * this.iCTVT_Value;
  //                 let nt3: decimal =
  //                   Convert.ToDecimal(strArray[3]) * this.iCTVT_Value;
  //                 let nt5: decimal =
  //                   Convert.ToDecimal(strArray[0]) * this.iCTVT_Value;

  //                 if (iTariffNum == 4) {
  //                   this.AppendLV('BT', nt1.toString() + ' kWh');
  //                   this.AppendLV('CD', nt2.toString() + ' kWh');
  //                   this.AppendLV('TD', nt3.toString() + ' kWh');
  //                   this.AppendLV('SG', nt5.toString() + ' kWh');
  //                 } else {
  //                   this.AppendLV('KT', nt5.toString() + ' kWh');
  //                 }
  //               } else if (
  //                 bArray[10] == 0x33 &&
  //                 bArray[11] == 0x33 &&
  //                 bArray[12] == 0x36 &&
  //                 bArray[13] == 0x33
  //               ) {
  //                 str13 = '';
  //                 for (num8 = 3; num8 >= 0; num8--) {
  //                   num23 = 0xff & (bArray[14 + num8] - 0x33);
  //                   if (num8 == 1) {
  //                     str13 =
  //                       str13 +
  //                       Convert.ToString(num23, 0x10).padStart(2, '0') +
  //                       '.';
  //                   } else {
  //                     str13 =
  //                       str13 + Convert.ToString(num23, 0x10).padStart(2, '0');
  //                   }
  //                 }
  //                 strArray[0] = str13;
  //                 let nt1: decimal =
  //                   Convert.ToDecimal(str13) * this.iCTVT_Value;
  //                 this.AppendLV('VC', nt1.toString() + ' kVarh');
  //               } else {
  //                 let num24: int = 0;
  //                 let str15: string = '';
  //                 let str16: string = '';
  //                 let num25: int = 0;
  //                 let num26: int = 0;
  //                 if (
  //                   bArray[10] == 0x33 &&
  //                   bArray[11] == 50 &&
  //                   bArray[12] == 0x34 &&
  //                   bArray[13] == 0x34
  //                 ) {
  //                   let dt: string[] = new Array<string>(4);
  //                   let iTariffNum: int = 4;
  //                   num24 = 3;
  //                   if (this.bIsSinglePhase || bArray[9] < 0x2c) {
  //                     iTariffNum = 1;
  //                   } else {
  //                     num24 = (bArray[9] - 4) / 5 - 5;
  //                     if (num24 != 4) {
  //                       num24 = 3;
  //                     }
  //                   }
  //                   str15 = '00';
  //                   try {
  //                     str16 = '';
  //                     for (num25 = 0; num25 < str.length; num25++) {
  //                       if (!(str.substring(num25, num25 + 1) == '0')) {
  //                         str16 = str.substring(num25);
  //                         break;
  //                       }
  //                     }
  //                     num26 = Convert.ToInt32(str16.substring(0, 0 + 2));
  //                     if (num26 >= 15 && num26 <= 0x1d) {
  //                       this.bIsInRange = false;
  //                     }
  //                   } catch {}
  //                   for (index = 0; index < iTariffNum; index++) {
  //                     str15 = MyGloab.ByteToBCD(bArray[15 + index * 8]);
  //                     if (this.bIsInRange) {
  //                       strArray[index] =
  //                         MyGloab.ByteToBCD_H(bArray[0x10 + index * 8]) +
  //                         str15.substring(0, 1) +
  //                         '.' +
  //                         str15.substring(1, 1 + 1) +
  //                         MyGloab.ByteToBCD(bArray[14 + index * 8]);
  //                     } else if (num24 == 4) {
  //                       arrayD[0] = bArray[0x11 + index * 9];
  //                       arrayD[1] = bArray[0x10 + index * 9];
  //                       arrayD[2] = bArray[15 + index * 9];
  //                       arrayD[3] = bArray[14 + index * 9];
  //                       strArray[index] = MyGloab.DemandValue(arrayD, 4);
  //                     } else {
  //                       arrayD[0] = bArray[0x10 + index * 8];
  //                       arrayD[1] = bArray[15 + index * 8];
  //                       arrayD[2] = bArray[14 + index * 8];
  //                       strArray[index] = MyGloab.DemandValue(arrayD, 3);
  //                     }
  //                     if (num24 == 4) {
  //                       if (bArray[0x15 + index * 9] == 0x33) {
  //                         dt[index] = '2000/01/01 00:00';
  //                       } else {
  //                         dt[index] =
  //                           '20' +
  //                           MyGloab.ByteToBCD(bArray[0x16 + index * 9]) +
  //                           '/' +
  //                           MyGloab.ByteToBCD(bArray[0x15 + index * 9]) +
  //                           '/' +
  //                           MyGloab.ByteToBCD(bArray[20 + index * 9]) +
  //                           ' ' +
  //                           MyGloab.ByteToBCD(bArray[0x13 + index * 9]) +
  //                           ':' +
  //                           MyGloab.ByteToBCD(bArray[0x12 + index * 9]);
  //                       }
  //                     } else if (bArray[0x15 + index * 8] == 0x33) {
  //                       dt[index] = '2000/01/01 00:00';
  //                     } else {
  //                       dt[index] =
  //                         '20' +
  //                         MyGloab.ByteToBCD(bArray[0x15 + index * 8]) +
  //                         '/' +
  //                         MyGloab.ByteToBCD(bArray[20 + index * 8]) +
  //                         '/' +
  //                         MyGloab.ByteToBCD(bArray[0x13 + index * 8]) +
  //                         ' ' +
  //                         MyGloab.ByteToBCD(bArray[0x12 + index * 8]) +
  //                         ':' +
  //                         MyGloab.ByteToBCD(bArray[0x11 + index * 8]);
  //                     }
  //                   }
  //                   let nt1: decimal =
  //                     Convert.ToDecimal(strArray[1]) * this.iCTVT_Value;
  //                   let nt2: decimal =
  //                     Convert.ToDecimal(strArray[2]) * this.iCTVT_Value;
  //                   let nt3: decimal =
  //                     Convert.ToDecimal(strArray[3]) * this.iCTVT_Value;
  //                   let nt5: decimal =
  //                     Convert.ToDecimal(strArray[0]) * this.iCTVT_Value;

  //                   if (iTariffNum == 4) {
  //                     this.AppendLV('BT_PMAX', nt1.toString() + ' kW');
  //                     this.AppendLV('BT_NGAY_PMAX', dt[1]);
  //                     this.AppendLV('CD_PMAX', nt2.toString() + ' kW');
  //                     this.AppendLV('CD_NGAY_PMAX', dt[2]);
  //                     this.AppendLV('TD_PMAX', nt3.toString() + ' kW');
  //                     this.AppendLV('TD_NGAY_PMAX', dt[3]);
  //                     this.AppendLV('SG_PMAX', nt5.toString() + ' kW');
  //                     this.AppendLV('SG_NGAY_PMAX', dt[0]);
  //                   } else {
  //                     this.AppendLV('KT_PMAX', nt5.toString() + ' kW');
  //                     this.AppendLV('KT_NGAY_PMAX', dt[0]);
  //                   }
  //                 } else if (
  //                   bArray[10] == 0x33 &&
  //                   bArray[11] == 0x33 &&
  //                   bArray[12] == 0x36 &&
  //                   bArray[13] == 0x34
  //                 ) {
  //                   let dt: string = '';
  //                   num24 = 3;
  //                   str15 = '00';
  //                   str15 = MyGloab.ByteToBCD(bArray[15]);
  //                   if (bArray[9] == 13) {
  //                     num24 = 4;
  //                   }
  //                   try {
  //                     str16 = '';
  //                     for (num25 = 0; num25 < str.length; num25++) {
  //                       if (!(str.substring(num25, num25 + 1) == '0')) {
  //                         str16 = str.substring(num25);
  //                         break;
  //                       }
  //                     }
  //                     num26 = Convert.ToInt32(str16.substring(0, 0 + 2));
  //                     if (num26 >= 15 && num26 <= 0x1d) {
  //                       this.bIsInRange = false;
  //                     }
  //                   } catch {}
  //                   if (this.bIsInRange) {
  //                     strArray[0] =
  //                       MyGloab.ByteToBCD_H(bArray[0x10]) +
  //                       str15.substring(0, 1) +
  //                       '.' +
  //                       str15.substring(1, 1 + 1) +
  //                       MyGloab.ByteToBCD(bArray[14]);
  //                   } else if (num24 == 4) {
  //                     arrayD[0] = bArray[0x11];
  //                     arrayD[1] = bArray[0x10];
  //                     arrayD[2] = bArray[15];
  //                     arrayD[3] = bArray[14];
  //                     strArray[0] = MyGloab.DemandValue(arrayD, 4);
  //                   } else {
  //                     arrayD[0] = bArray[0x10];
  //                     arrayD[1] = bArray[15];
  //                     arrayD[2] = bArray[14];
  //                     strArray[0] = MyGloab.DemandValue(arrayD, 3);
  //                   }
  //                   if (bArray[0x15] == 0x33) {
  //                     dt = '2000/01/01 00:00';
  //                   } else if (num24 == 4) {
  //                     dt =
  //                       '20' +
  //                       MyGloab.ByteToBCD(bArray[0x16]) +
  //                       '/' +
  //                       MyGloab.ByteToBCD(bArray[0x15]) +
  //                       '/' +
  //                       MyGloab.ByteToBCD(bArray[20]) +
  //                       ' ' +
  //                       MyGloab.ByteToBCD(bArray[0x13]) +
  //                       ':' +
  //                       MyGloab.ByteToBCD(bArray[0x12]);
  //                   } else {
  //                     dt =
  //                       '20' +
  //                       MyGloab.ByteToBCD(bArray[0x15]) +
  //                       '/' +
  //                       MyGloab.ByteToBCD(bArray[20]) +
  //                       '/' +
  //                       MyGloab.ByteToBCD(bArray[0x13]) +
  //                       ' ' +
  //                       MyGloab.ByteToBCD(bArray[0x12]) +
  //                       ':' +
  //                       MyGloab.ByteToBCD(bArray[0x11]);
  //                   }
  //                   let nt1: decimal =
  //                     Convert.ToDecimal(strArray[0]) * this.iCTVT_Value;

  //                   this.AppendLV('VC_PMAX', nt1.toString() + ' kVar');
  //                   this.AppendLV('VC_NGAY_PMAX', dt);
  //                 } else if (
  //                   bArray[10] == 0x33 &&
  //                   bArray[11] == 50 &&
  //                   bArray[12] == 0x34 &&
  //                   bArray[13] == 0x35
  //                 ) {
  //                   for (index = 0; index < 3; index++) {
  //                     strArray[index] =
  //                       MyGloab.ByteToBCD(bArray[15 + index * 2]) +
  //                       MyGloab.ByteToBCD(bArray[14 + index * 2]);
  //                   }
  //                   if (strArray[0] != 'FFFF' && strArray[0] != 'EEEE') {
  //                     let nt1: decimal =
  //                       (Convert.ToDecimal(strArray[0]) / 10.0) *
  //                       this.iVT_Value;
  //                     this.AppendLV('A_Voltage', nt1.toString() + ' V');
  //                   }
  //                   if (strArray[1] != 'FFFF' && strArray[1] != 'EEEE') {
  //                     let nt2: decimal =
  //                       (Convert.ToDecimal(strArray[1]) / 10.0) *
  //                       this.iVT_Value;
  //                     this.AppendLV('B_Voltage', nt2.toString() + ' V');
  //                   }
  //                   if (strArray[2] != 'FFFF' && strArray[2] != 'EEEE') {
  //                     let nt3: decimal =
  //                       (Convert.ToDecimal(strArray[2]) / 10.0) *
  //                       this.iVT_Value;
  //                     this.AppendLV('C_Voltage', nt3.toString() + ' V');
  //                   }
  //                 } else if (
  //                   bArray[10] == 0x33 &&
  //                   bArray[11] == 50 &&
  //                   bArray[12] == 0x35 &&
  //                   bArray[13] == 0x35
  //                 ) {
  //                   let num27: int = 3;
  //                   if (bArray[9] == 0x10) {
  //                     num27 = 4;
  //                   }
  //                   for (index = 0; index < 3; index++) {
  //                     if (num27 == 4) {
  //                       strArray[index] =
  //                         MyGloab.ByteToBCD(bArray[0x11 + index * 4]) +
  //                         MyGloab.ByteToBCD(bArray[0x10 + index * 4]) +
  //                         MyGloab.ByteToBCD(bArray[15 + index * 4]) +
  //                         MyGloab.ByteToBCD(bArray[14 + index * 4]);
  //                     } else {
  //                       strArray[index] =
  //                         MyGloab.ByteToBCD(bArray[0x10 + index * 3]) +
  //                         MyGloab.ByteToBCD(bArray[15 + index * 3]) +
  //                         MyGloab.ByteToBCD(bArray[14 + index * 3]);
  //                     }
  //                   }
  //                   if (
  //                     strArray[0].indexOf('FF') < 0 &&
  //                     strArray[0].indexOf('EE') < 0
  //                   ) {
  //                     let nt1: decimal =
  //                       (Convert.ToDecimal(strArray[0]) / 1000) *
  //                       this.iCT_Value;
  //                     this.AppendLV('A_Current', nt1.toString() + ' A');
  //                   }
  //                   if (
  //                     strArray[1].indexOf('FF') < 0 &&
  //                     strArray[1].indexOf('EE') < 0
  //                   ) {
  //                     let nt2: decimal =
  //                       (Convert.ToDecimal(strArray[1]) / 1000) *
  //                       this.iCT_Value;
  //                     this.AppendLV('B_Current', nt2.toString() + ' A');
  //                   }
  //                   if (
  //                     strArray[2].indexOf('FF') < 0 &&
  //                     strArray[2].indexOf('EE') < 0
  //                   ) {
  //                     let nt3: decimal =
  //                       (Convert.ToDecimal(strArray[2]) / 1000) *
  //                       this.iCT_Value;
  //                     this.AppendLV('C_Current', nt3.toString() + ' A');
  //                   }
  //                 } else {
  //                   let strArray4: string[] = [];
  //                   if (
  //                     bArray[10] >= 0x39 &&
  //                     bArray[10] <= 0x3e &&
  //                     bArray[11] == 0x36 &&
  //                     bArray[12] == 0x33 &&
  //                     bArray[13] == 0x37
  //                   ) {
  //                     let iALen: int = bArray[9] - 4;
  //                     let strName: string = '';
  //                     strArray[0] = '';
  //                     for (index = 0; index < iALen; index++) {
  //                       (strArray4 = strArray)[0] =
  //                         strArray4[0] +
  //                         MyGloab.ByteToBCD(bArray[13 + iALen - index]);
  //                     }
  //                     iALen = Convert.ToInt32(strArray[0]);
  //                     if (bArray[10] == 0x39) {
  //                       strName = 'CT_Value';
  //                       this.iCT_Meter = iALen;
  //                     } else if (bArray[10] == 0x3a) {
  //                       strName = 'VT_Value';
  //                       this.iVT_Meter = iALen;
  //                     } else if (bArray[10] == 0x3b) {
  //                       strName = 'CT_Numerator';
  //                       this.ct_Num = iALen;
  //                     } else if (bArray[10] == 60) {
  //                       strName = 'VT_Numerator';
  //                       this.vt_Num = iALen;
  //                     } else if (bArray[10] == 0x3d) {
  //                       strName = 'CT_Denominator';
  //                       this.ct_Den = iALen;
  //                     } else if (bArray[10] == 0x3e) {
  //                       strName = 'VT_Denominator';
  //                       this.vt_Den = iALen;
  //                     }
  //                     this.AppendLV(strName, iALen.toString());
  //                   } else if (
  //                     bArray[10] == 0x34 &&
  //                     bArray[11] == 0x33 &&
  //                     bArray[12] == 0x34 &&
  //                     bArray[13] == 0x4e
  //                   ) {
  //                     let iALen: int = 3;
  //                     strArray[0] = '';
  //                     for (index = 0; index < iALen; index++) {
  //                       (strArray4 = strArray)[0] =
  //                         strArray4[0] +
  //                         MyGloab.ByteToBCD(bArray[13 + iALen - index]);
  //                     }
  //                     iALen = Convert.ToInt32(strArray[0]);
  //                     this.AppendLV('Tamper Times', iALen.toString());
  //                   }
  //                 }
  //               }
  //             } else if (this.meterType == METERTYPE.DDS26_GELEX) {
  //               let szData: string = '';
  //               if (bArray[11] == 0) {
  //                 for (index = 0; index < 4; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[13 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 this.AppendLV(
  //                   'SG:',
  //                   (Convert.ToDecimal(szData) / 100.0).toFixed(2) + ' kWh',
  //                 );
  //               } else if (bArray[11] == 1) {
  //                 for (index = 0; index < 4; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[13 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 this.AppendLV(
  //                   'BT:',
  //                   (Convert.ToDecimal(szData) / 1000).toFixed(3) + ' kWh',
  //                 );

  //                 szData = '';
  //                 for (index = 0; index < 2; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[0x11 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 this.AppendLV('Tamper:', Convert.ToInt32(szData) + ' Times');
  //               } else if (bArray[11] == 6) {
  //                 for (index = 0; index < 3; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[13 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 this.AppendLV(
  //                   'Voltage:',
  //                   (Convert.ToDecimal(szData) / 100.0).toFixed(2) + ' V',
  //                 );

  //                 szData = '';
  //                 for (index = 0; index < 3; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[0x10 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 this.AppendLV(
  //                   'Current:',
  //                   (Convert.ToDecimal(szData) / 100.0).toFixed(2) + ' A',
  //                 );
  //               }
  //             } else if (this.meterType == METERTYPE.CPC_PWD) {
  //               let input: Buffer = Buffer.alloc(0x10);
  //               let oData: Buffer = Buffer.alloc(0x10);
  //               for (index = 0; index < 0x10; index++) {
  //                 input[index] = bArray[0x1c + index];
  //               }
  //               MyGloab.cpc_decrypt(input, oData);
  //               if (bArray[0x17] == 0xb9) {
  //                 this.AppendLV(
  //                   'KT:',
  //                   (
  //                     Convert.ToDecimal(
  //                       0xffffffff &
  //                         (oData[0] +
  //                           oData[1] * 0x100 +
  //                           oData[2] * 0x100 * 0x100 +
  //                           oData[3] * 0x100 * 0x100 * 0x100),
  //                     ) / 100.0
  //                   ).toFixed(2) + ' kWh',
  //                 );
  //               } else if (bArray[0x17] == 0xbb) {
  //                 this.AppendLV(
  //                   'Current:',
  //                   (
  //                     Convert.ToDecimal(
  //                       0xffffffff &
  //                         (oData[0] +
  //                           oData[1] * 0x100 +
  //                           oData[2] * 0x100 * 0x100 +
  //                           oData[3] * 0x100 * 0x100 * 0x100),
  //                     ) / 1000.0
  //                   ).toFixed(2) + ' A',
  //                 );

  //                 this.AppendLV(
  //                   'Voltage:',
  //                   (
  //                     Convert.ToDecimal(
  //                       0xffffffff &
  //                         (oData[4] +
  //                           oData[5] * 0x100 +
  //                           oData[6] * 0x100 * 0x100 +
  //                           oData[7] * 0x100 * 0x100 * 0x100),
  //                     ) / 100.0
  //                   ).toFixed(2) + ' V',
  //                 );
  //               } else if (bArray[0x17] == 0xc4) {
  //                 let str17: string = Convert.ToString(
  //                   0xffffffff & (oData[0] + oData[1] * 0x100),
  //                 );
  //                 let strVer: string = '';
  //                 for (num8 = 0; num8 < str17.length; num8++) {
  //                   if (num8 == str17.length - 1) {
  //                     strVer = strVer + str17.substring(num8, num8 + 1);
  //                   } else {
  //                     strVer = strVer + str17.substring(num8, num8 + 1) + '.';
  //                   }
  //                 }
  //                 this.AppendLV('Version:', strVer);
  //               }
  //             } else if (
  //               this.meterType == METERTYPE.CPC_DTO1P80 ||
  //               this.meterType == METERTYPE.CPC_DTO3P
  //             ) {
  //               if (bArray[7] == 0xdb) {
  //                 for (index = 0; index < 4; index++) {
  //                   str2 =
  //                     str2 +
  //                     Convert.ToString(bArray[3 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 let szData: string = '';
  //                 for (index = 0; index < 4; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[8 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 this.AppendLV(
  //                   'Active:',
  //                   (Convert.ToDecimal(szData) / 100.0).toFixed(2) + ' kWh',
  //                 );
  //               } else {
  //                 for (index = 0; index < 4; index++) {
  //                   str2 =
  //                     str2 +
  //                     Convert.ToString(bArray[3 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 let szData: string = '';
  //                 let szData1: string = '';
  //                 for (index = 0; index < 4; index++) {
  //                   szData =
  //                     szData +
  //                     Convert.ToString(bArray[8 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }
  //                 for (index = 0; index < 4; index++) {
  //                   szData1 =
  //                     szData1 +
  //                     Convert.ToString(bArray[12 + index], 0x10).padStart(
  //                       2,
  //                       '0',
  //                     );
  //                 }

  //                 this.AppendLV(
  //                   'Forward Active:',
  //                   (Convert.ToDecimal(szData) / 100.0).toFixed(2) + ' kWh',
  //                 );
  //                 this.AppendLV(
  //                   'Reverse Active:',
  //                   (Convert.ToDecimal(szData1) / 100.0).toFixed(2) + ' kWh',
  //                 );
  //               }
  //             } else {
  //               index = 0;
  //               while (index < 4) {
  //                 str2 =
  //                   str2 +
  //                   Convert.ToString(bArray[3 + index], 0x10).padStart(2, '0');
  //                 index++;
  //               }
  //               let str18: string = '';
  //               for (index = 0; index < 4; index++) {
  //                 str18 =
  //                   str18 +
  //                   Convert.ToString(bArray[8 + index], 0x10).padStart(2, '0');
  //               }
  //               iStatus = bArray[12];
  //               dEneregy = Convert.ToDecimal(str18) / 100.0;
  //               if (this.meterType == METERTYPE.CPC_DTO1P) {
  //                 if (bArray[7] == 0xba) {
  //                   this.AppendLV('ReActive:', dEneregy.toString() + ' kVarh');
  //                 } else {
  //                   this.AppendLV('Active:', dEneregy.toString() + ' kWh');
  //                 }
  //               } else if (this.meterType == METERTYPE.LTE66) {
  //                 this.AppendLV('Active:', dEneregy.toString() + ' kWh');
  //               } else {
  //                 if (bArray[7] == 0xba) {
  //                   this.AppendLV('Active:', dEneregy.toString() + ' kWh');
  //                 } else if (bArray[7] == 0xb8) {
  //                   this.AppendLV('Active:', dEneregy.toString() + ' kWh');
  //                 } else if (bArray[7] == 0x22) {
  //                   if ((iStatus & 1) == 1) {
  //                     this.AppendLV('Reverse status:', 'Yes');
  //                   } else {
  //                     this.AppendLV('Reverse status:', 'No');
  //                   }
  //                   if ((iStatus & 2) == 2) {
  //                     this.AppendLV('Unbalance status:', 'Yes');
  //                   } else {
  //                     this.AppendLV('Unbalance status:', 'No');
  //                   }
  //                   this.AppendLV('SG:', dEneregy.toString() + ' kWh');
  //                 } else if (bArray[7] == 0x23) {
  //                   //this.AppendLV("ReActive:", dEneregy.toString() + " kWh");
  //                   this.AppendLV('Active:', dEneregy.toString() + ' kWh');
  //                 } else {
  //                   this.AppendLV('ReActive:', dEneregy.toString() + ' kVarh');
  //                 }
  //               }
  //             }
  //           }
  //           this.Ret = true;
  //         }
  //       }
  //     }
  //   } catch {}
  // }

  //   private async ReadCTVT(): Promise<void> {
  //     this.bIsThreePhase = true;
  //     if (this.szMeterSN.padStart(12, '0').substring(4, 4 + 1) == '3') {
  //       this.bIsThreePhase = true;
  //     } else {
  //       this.bIsThreePhase = false;
  //     }
  //     try {
  //       let flag: bool = false;
  //       if (this.bIsThreePhase) {
  //         if (await this.SampleCTVT(enumDataType.CT_Numerator)) {
  //           flag = await this.SampleCTVT(enumDataType.CT_Denominator);
  //         } else {
  //           return;
  //         }
  //         if (flag) {
  //           this.iCT_Meter = this.ct_Num / this.ct_Den;
  //         } else {
  //           return;
  //         }
  //         if (await this.SampleCTVT(enumDataType.VT_Numerator)) {
  //           flag = await this.SampleCTVT(enumDataType.VT_Denominator);
  //         } else {
  //           return;
  //         }
  //         if (flag) {
  //           this.iVT_Meter = this.vt_Num / this.vt_Den;
  //         } else {
  //           return;
  //         }
  //         this.iVT_Value =
  //           this.iVT_Meter <= 1
  //             ? 1
  //             : 10 *
  //               (0xffffffff &
  //                 Math.pow(10.0, 0xffffffff & Math.log10(this.iVT_Meter)));
  //         this.iCT_Value =
  //           0xffffffff & Math.pow(10.0, 0xffffffff & Math.log10(this.iCT_Meter));
  //         this.iCTVT_Value =
  //           0xffffffff &
  //           Math.pow(
  //             10.0,
  //             0xffffffff & Math.log10(this.iVT_Meter * this.iCT_Meter),
  //           );
  //       } else {
  //         flag = await this.SampleCTVT(enumDataType.CT_Value);
  //         this.iVT_Value = 1;
  //         this.iCT_Value = this.iCT_Meter;
  //         this.iCTVT_Value = this.iCT_Meter;
  //       }
  //     } catch {}
  //   }

  public ReadFatorNum(bData: Buffer) {
    let TampNum: decimal = bData[8] / 100.0;
    this.AppendLV('Power factor', TampNum.toFixed(2));
  }

  public ReadTamperNum(bData: Buffer) {
    let TampNum: int = bData[9] * 0x100 + bData[8];
    this.AppendLV('Phase failure', TampNum.toString() + ' times');
  }

  public static InitMeterRange() {
    let num2: int = 0;
    ReadSTClass.GetMeterTypeRangeInfo();
    let strArray: string[] =
      ReadSTClass.GetNowMeterRangeInfo('MESH').split(',');
    let item: PropsLsRange = {
      MeterType: METERTYPE.MESH_RF,
      bRTC: false,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    let length: int = strArray.length;
    for (num2 = 0; num2 < length; num2++) {
      item.lsMeterAddressRange.push(strArray[num2]);
    }
    MyGloab.lsMeterRange.push(item);
    let strArray2: string[] =
      ReadSTClass.GetNowMeterRangeInfo('PTP').split(',');
    let range2: PropsLsRange = {
      MeterType: METERTYPE.PTP_RF,
      bRTC: false,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    item.bX335_Old = false;
    range2.lsMeterAddressRange = [];
    let num3 = strArray2.length;
    for (num2 = 0; num2 < num3; num2++) {
      range2.lsMeterAddressRange.push(strArray2[num2]);
    }
    MyGloab.lsMeterRange.push(range2);
    let strArray3: string[] =
      ReadSTClass.GetNowMeterRangeInfo('RTC').split(',');
    let range3: PropsLsRange = {
      MeterType: METERTYPE.MESH_RF,
      bRTC: false,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    item.bX335_Old = false;
    range3.bRTC = true;
    range3.lsMeterAddressRange = [];
    let num4 = strArray3.length;
    for (num2 = 0; num2 < num4; num2++) {
      range3.lsMeterAddressRange.push(strArray3[num2]);
    }
    MyGloab.lsMeterRange.push(range3);
    let strArray4: string[] =
      ReadSTClass.GetNowMeterRangeInfo('DTS27-X329').split(',');
    let range4: PropsLsRange = {
      MeterType: METERTYPE.DTS27_X329,
      bRTC: true,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    item.bX335_Old = false;
    range4.lsMeterAddressRange = [];
    let num5: int = strArray4.length;
    for (num2 = 0; num2 < num5; num2++) {
      range4.lsMeterAddressRange.push(strArray4[num2]);
    }
    MyGloab.lsMeterRange.push(range4);
    let strArray5: string[] =
      ReadSTClass.GetNowMeterRangeInfo('DTS27-X335').split(',');
    let range5: PropsLsRange = {
      MeterType: METERTYPE.DTS27_645_07,
      bRTC: false,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    item.bX335_Old = true;
    range5.lsMeterAddressRange = [];
    let num6: int = strArray5.length;
    for (num2 = 0; num2 < num6; num2++) {
      range5.lsMeterAddressRange.push(strArray5[num2]);
    }
    MyGloab.lsMeterRange.push(range5);
    let strArray6: string[] =
      ReadSTClass.GetNowMeterRangeInfo('DTS27-645').split(',');
    let range6: PropsLsRange = {
      MeterType: METERTYPE.DTS27_645,
      bRTC: false,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    let num7: int = strArray6.length;
    for (num2 = 0; num2 < num7; num2++) {
      range6.lsMeterAddressRange.push(strArray6[num2]);
    }
    MyGloab.lsMeterRange.push(range6);
    let strArray7: string[] =
      ReadSTClass.GetNowMeterRangeInfo('MESH_180').split(',');
    let range7: PropsLsRange = {
      MeterType: METERTYPE.MESH_RF_180,
      bRTC: false,
      bX335_Old: false,
      lsMeterAddressRange: [],
    };
    let num8: int = strArray7.length;
    for (num2 = 0; num2 < num8; num2++) {
      range7.lsMeterAddressRange.push(strArray7[num2]);
    }
    MyGloab.lsMeterRange.push(range7);

    try {
      // MyGloab.bSaveLog = Convert.ToBoolean(
      //   MyGloab.GetInfoByName('SaveLog', 'false', 'Info'),
      // );
      //this.UpdateModule();
      //this.SetModuleAddress();
      for (let i = 0; i < 6; i++) {
        MyGloab.sHHu[i] = 0;
      }
      MyGloab.HoldParam = Convert.ToInt32(
        MyGloab.GetInfoByName('Param', '50', 'Info'),
      );
      MyGloab.HoldParam1 = Convert.ToInt32(
        MyGloab.GetInfoByName('Param1', '50', 'Info'),
      );
      MyGloab.HoldVParam = Convert.ToInt32(
        MyGloab.GetInfoByName('VParam', '50', 'Info'),
      );
      MyGloab.HoldVParam1 = Convert.ToInt32(
        MyGloab.GetInfoByName('VParam1', '50', 'Info'),
      );
      let str: string = MyGloab.GetInfoByName('HHuNum', '0', 'Info').padStart(
        12,
        '0',
      );
      if (str != '0' && str != '') {
        MyGloab.sHHu[0] = 0xff && parseInt(str.substring(0, 0 + 2), 16);
        MyGloab.sHHu[1] = 0xff && parseInt(str.substring(2, 2 + 2), 16);
        MyGloab.sHHu[2] = 0xff && parseInt(str.substring(4, 4 + 2), 16);
        MyGloab.sHHu[3] = 0xff && parseInt(str.substring(6, 6 + 2), 16);
        MyGloab.sHHu[4] = 0xff && parseInt(str.substring(8, 8 + 2), 16);
        MyGloab.sHHu[5] = 0xff && parseInt(str.substring(10, 10 + 2), 16);
      }
      if (MyGloab.GetInfoByName('MeterType', 'MESH_RF', 'Info') != 'PTP_RF') {
        MyGloab.SampleSystemType = METERTYPE.MESH_RF;
      } else {
        MyGloab.SampleSystemType = METERTYPE.PTP_RF;
      }
      MyGloab.gbHavePoint = false;
      if (MyGloab.GetInfoByName('Point', '0', 'Info') != '0') {
        MyGloab.gbHavePoint = true;
      }
    } catch {}
    MyGloab.numSet21 =
      0xff &
      (Convert.ToInt16(MyGloab.GetInfoByName('NueNum21', '1', 'Info')) * 2) %
        20;
  }

  // private RtturnBlockValue(
  //   bArray: Buffer,
  //   nStart: int,
  //   nLength: int,
  //   strName: string,
  //   strUnit: string,
  // ): void {
  //   let nvalue: string = '';
  //   let str: string = '';
  //   for (let i = 0; i < nLength; i++) {
  //     str = str + EncodingASCIIGetString(bArray, i + nStart, 1).toString();
  //   }
  //   let index: int = str.indexOf('(');
  //   let num3: int = str.indexOf(')');
  //   let str2: string = str.substring(index + 1, index + 1 + num3 - index - 1);
  //   if (
  //     str2.trim() != '' &&
  //     (strName != 'Date Add Week' || str2.indexOf('00-00') < 0) &&
  //     (strName != 'Time' || str2.indexOf('00:00:00') < 0)
  //   ) {
  //     let num4: int = str2.indexOf('*');
  //     nvalue = '';
  //     if (num4 > -1) {
  //       nvalue = str2.replaceAll('*', ' ');
  //       this.AppendLV(strName, nvalue);
  //     } else {
  //       nvalue = str2;
  //       this.AppendLV(strName, nvalue + ' ' + strUnit);
  //     }
  //   }
  // }

  // private RtturnDemondValue(
  //   bArray: Buffer,
  //   nStart: int,
  //   nLength: int,
  //   strName: string,
  //   strUnit: string,
  // ): void {
  //   let num: int = 0;

  //   let demondV: string[] = [];
  //   let str: string = '';
  //   let strTime: string = '';
  //   for (num = 0; num < nLength; num++) {
  //     str = str + EncodingASCIIGetString(bArray, num + nStart, 1).toString();
  //   }
  //   let index: int = str.indexOf('(');
  //   let num3: int = str.indexOf(')');
  //   let str2: string = str.substring(index + 1, index + 1 + num3 - index - 1);
  //   if (str2.trim() != '') {
  //     demondV = str2.split(' ');
  //     this.AppendLV(strName, demondV[0].replaceAll('*', ' '));
  //     if (demondV.length > 1) {
  //       for (num = 1; num < demondV.length; num++) {
  //         strTime = strTime + demondV[num] + ' ';
  //       }
  //       strTime = strTime.trim();
  //       this.AppendLV('Time', strTime);
  //     }
  //   }
  // }

  // private async SampleCTVT(eDataType: enumDataType): Promise<boolean> {
  //   let buffer: Buffer = Buffer.alloc(6);
  //   let diCtrl: Buffer = Buffer.alloc(4);
  //   let buffer3: Buffer = Buffer.alloc(4);
  //   let str: string = this.szMeterSN.padStart(12, '0');
  //   buffer[0] = Convert.ToByte(str.substring(10, 10 + 2), 0x10);
  //   buffer[1] = Convert.ToByte(str.substring(8, 8 + 2), 0x10);
  //   buffer[2] = Convert.ToByte(str.substring(6, 6 + 2), 0x10);
  //   buffer[3] = Convert.ToByte(str.substring(4, 4 + 2), 0x10);
  //   buffer[4] = Convert.ToByte(str.substring(2, 2 + 2), 0x10);
  //   buffer[5] = Convert.ToByte(str.substring(0, 0 + 2), 0x10);
  //   this.communicationClass.bisNew = true;
  //   for (let i = 1; i <= this.iSampleCount; i++) {
  //     this.Ret = false;
  //     switch (eDataType) {
  //       case enumDataType.CT_Numerator:
  //         diCtrl[0] = 0x3b;
  //         break;

  //       case enumDataType.VT_Numerator:
  //         diCtrl[0] = 60;
  //         break;

  //       case enumDataType.CT_Denominator:
  //         diCtrl[0] = 0x3d;
  //         break;

  //       case enumDataType.VT_Denominator:
  //         diCtrl[0] = 0x3e;
  //         break;

  //       case enumDataType.CT_Value:
  //         diCtrl[0] = 0x39;
  //         break;

  //       case enumDataType.VT_Value:
  //         diCtrl[0] = 0x3a;
  //         break;
  //     }
  //     diCtrl[1] = 0x36;
  //     diCtrl[2] = 0x33;
  //     diCtrl[3] = 0x37;
  //     await this.communicationClass.sp_SendPower_07(buffer, diCtrl, 0);
  //     if (await this.CommOK_Mesh()) {
  //       break;
  //     }
  //   }
  //   this.communicationClass.bisNew = false;
  //   return this.Ret;
  // }

  private async SampleData(enumDType: enumDataType): Promise<boolean> {
    this.communicationClass.bytBaud[0] = 10;
    this.communicationClass.bytBaud[1] =
      0xff & (this.communicationClass.bytBaud[0] * 0x10);

    let num: int = 0;
    let str2: string = '';
    let buffer3: Buffer = Buffer.alloc(0);
    let flag: bool = false;
    let length: int = 0;
    let num5: int = 0;
    let str3: string = '';

    this.Text = this.thisText + ' - ' + this.meterType.toString();

    console.log('meter Type:', ConvertTypeMeterToString(this.meterType));
    console.log('type Data:', ConvertEnumDataTypeToString(enumDType));

    this.communicationClass.stopFlag = false;
    this.Ret = false;
    let addrArray: Buffer = Buffer.from([
      Convert.ToByte(this.szMeterSN.substring(0, 0 + 2), 0x10),
      Convert.ToByte(this.szMeterSN.substring(2, 2 + 2), 0x10),
      Convert.ToByte(this.szMeterSN.substring(4, 4 + 2), 0x10),
      Convert.ToByte(this.szMeterSN.substring(6, 6 + 2), 0x10),
    ]);
    let dataArray: Buffer = Buffer.alloc(3);
    if (enumDType != enumDataType.Set50_70) {
      let num2: byte = 0;
      let ch: char = '';
      if (this.meterType == METERTYPE.LTE66) {
        this.communicationClass.bisNew = false;
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_Send(
            addrArray,
            0xda,
            dataArray,
            0,
            0,
            0,
          );
          if (await this.CommOK1()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.CPC_DTO1P) {
        this.communicationClass.bisNew = false;
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_Send(
            addrArray,
            0xdb,
            dataArray,
            0,
            0,
            0,
          );
          if (await this.CommOK_CPC()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.CPC_DTO1P80) {
        this.communicationClass.bisNew = false;
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_Send(
            addrArray,
            220,
            dataArray,
            0,
            0,
            0,
          );
          if (await this.CommOK_CPC()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.CPC_DTO3P) {
        this.communicationClass.bisNew = false;
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_Send(
            addrArray,
            0xdd,
            dataArray,
            0,
            0,
            0,
          );
          if (await this.CommOK_CPC()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.CPC_PWD) {
        num2 = 0;
        if (enumDType == enumDataType.Energy_DataType) {
          num2 = 0xb9;
        } else if (enumDType == enumDataType.Voltage_DataType) {
          num2 = 0xbb;
        } else if (enumDType == enumDataType.Version_DataType) {
          num2 = 0xc4;
        }
        this.communicationClass.bisNew = false;
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_SendCPC_PWD(addrArray, num2, 0);
          if (await this.CommOK_CPC()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.DTS27_RF) {
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_Send(
            addrArray,
            0xba,
            dataArray,
            0,
            0,
            1,
          );
          if (await this.CommOK1()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.PTP_RF) {
        if (this.szMeterSN.length == 10) {
          let str: string = Convert.ToInt64(this.szMeterSN)
            .toString(16)
            .padStart(8, '0');
          str = str.substring(str.length - 8, str.length - 8 + 8);
          addrArray[0] = Convert.ToByte(str.substring(0, 0 + 2), 0x10);
          addrArray[1] = Convert.ToByte(str.substring(2, 2 + 2), 0x10);
          addrArray[2] = Convert.ToByte(str.substring(4, 4 + 2), 0x10);
          addrArray[3] = Convert.ToByte(str.substring(6, 6 + 2), 0x10);
        }
        this.communicationClass.bisNew = false;
        for (num = 1; num <= this.iSampleCount; num++) {
          this.Ret = false;
          await this.communicationClass.SP_Send(
            addrArray,
            0xba,
            dataArray,
            0,
            0,
            1,
          );
          if (await this.CommOK1()) {
            break;
          }
        }
        return true;
      }
      if (this.meterType == METERTYPE.DDS26_GELEX) {
        console.log(TAG, 'is Glelex meter');

        return false;
      }
      if (this.meterType != METERTYPE.DTS27_X329) {
        let buffer5: Buffer = Buffer.alloc(0);
        if (
          this.meterType == METERTYPE.MESH_RF ||
          this.meterType == METERTYPE.MESH_RF_180 ||
          this.meterType == METERTYPE.DTS27_ELSTER
        ) {
          buffer5 = Buffer.alloc(6);
          //if (this.iTabIndex == 0)
          {
            this.szMeterSN = this.strSERY_CTO; // this.textBox1.Text.trim();
          }
          length = this.szMeterSN.length;
          num5 = 0;
          for (num = 0; num < length; num++) {
            ch = this.szMeterSN[num];
            if (ch.toString() != '0') {
              num5 = num;
              break;
            }
          }
          str3 = this.szMeterSN.substring(num5, num5 + length - num5);
          let bytes: Buffer = Buffer.alloc(str3.length);
          bytes = EncodingDefaultGetBytes(str3);
          let szMeterSN: string = this.szMeterSN;
          let num8: int = szMeterSN.length;
          if (num8 == 8) {
            buffer5[0] = Convert.ToByte(
              this.szMeterSN.substring(6, 6 + 2),
              0x10,
            );
            buffer5[1] = Convert.ToByte(
              this.szMeterSN.substring(4, 4 + 2),
              0x10,
            );
            buffer5[2] = Convert.ToByte(
              this.szMeterSN.substring(2, 2 + 2),
              0x10,
            );
            buffer5[3] = Convert.ToByte(
              this.szMeterSN.substring(0, 0 + 2),
              0x10,
            );
            buffer5[4] = 0;
            buffer5[5] = 0;
          } else if (num8 > 8 && num8 <= 10) {
            szMeterSN = szMeterSN.padStart(10, '0');
            buffer5[0] = Convert.ToByte(szMeterSN.substring(8, 8 + 2), 0x10);
            buffer5[1] = Convert.ToByte(szMeterSN.substring(6, 6 + 2), 0x10);
            buffer5[2] = Convert.ToByte(szMeterSN.substring(4, 4 + 2), 0x10);
            buffer5[3] = Convert.ToByte(szMeterSN.substring(2, 2 + 2), 0x10);
            buffer5[4] = Convert.ToByte(szMeterSN.substring(0, 0 + 2), 0x10);
            buffer5[5] = 0;
          } else {
            //if (this.iTabIndex == 0)
            {
              this.szMeterSN = this.strSERY_CTO.padEnd(12, '0');
            }
            szMeterSN = szMeterSN.padStart(12, '0');
            buffer5[0] = Convert.ToByte(
              this.szMeterSN.substring(10, 10 + 2),
              0x10,
            );
            buffer5[1] = Convert.ToByte(
              this.szMeterSN.substring(8, 8 + 2),
              0x10,
            );
            buffer5[2] = Convert.ToByte(
              this.szMeterSN.substring(6, 6 + 2),
              0x10,
            );
            buffer5[3] = Convert.ToByte(
              this.szMeterSN.substring(4, 4 + 2),
              0x10,
            );
            buffer5[4] = Convert.ToByte(
              this.szMeterSN.substring(2, 2 + 2),
              0x10,
            );
            buffer5[5] = Convert.ToByte(
              this.szMeterSN.substring(0, 0 + 2),
              0x10,
            );
          }
          this.communicationClass.bisNew = true;
          for (num = 1; num <= this.iSampleCount; num++) {
            this.Ret = false;
            this.communicationClass.bflag21 = true;
            this.bReadGroupData = false;
            if (
              enumDType == enumDataType.GroupData_DataType ||
              enumDType == enumDataType.GroupData_DataType_2
            ) {
              let num9: int = 0;
              if (this.meterPhase == METER_PHASE.THREE_PHASE) {
                num9 = 2;
                this.bReadGroupData = true;
                await this.communicationClass.sp_SendPower212Group(
                  buffer5,
                  true,
                  0,
                  bytes,
                  num9,
                  enumDType,
                  true,
                );
              } else {
                num9 = 2;
                this.bReadGroupData = true;
                await this.communicationClass.sp_SendPower212Group(
                  buffer5,
                  true,
                  0,
                  bytes,
                  num9,
                  enumDType,
                  false,
                );
              }
            } else if (this.meterType == METERTYPE.DTS27_ELSTER) {
              //this.sp_Base.sp_SendElster(buffer5, false, 0, bytes, str3.length, 0x52, enumDType, this.textBox2.Text.trim());
            } else {
              await this.communicationClass.sp_SendPower212(
                buffer5,
                false,
                0,
                bytes,
                str3.length,
                enumDType,
              );
            }
            if (
              this.meterType == METERTYPE.MESH_RF ||
              this.meterType == METERTYPE.MESH_RF_180
            ) {
              if (
                enumDType == enumDataType.GroupData_DataType ||
                enumDType == enumDataType.GroupData_DataType_2
              ) {
                if (await this.CommOKElster()) {
                  return true;
                }
              } else if (await this.CommOK_Mesh()) {
                return true;
              }
            } else if (await this.CommOKElster()) {
              return true;
            }
          }
          return false;
        }
        if (this.meterType != METERTYPE.DTS27_VN31) {
          let buffer7: Buffer = Buffer.alloc(0);
          let str6: string = '';
          if (this.meterType != METERTYPE.DTS27_645_07) {
            if (this.meterType == METERTYPE.DTS27_645) {
              buffer5 = Buffer.alloc(6);
              buffer7 = Buffer.alloc(2);
              str6 = this.szMeterSN.padStart(12, '0');
              buffer5[0] = Convert.ToByte(str6.substring(10, 10 + 2), 0x10);
              buffer5[1] = Convert.ToByte(str6.substring(8, 8 + 2), 0x10);
              buffer5[2] = Convert.ToByte(str6.substring(6, 6 + 2), 0x10);
              buffer5[3] = Convert.ToByte(str6.substring(4, 4 + 2), 0x10);
              buffer5[4] = Convert.ToByte(str6.substring(2, 2 + 2), 0x10);
              buffer5[5] = Convert.ToByte(str6.substring(0, 0 + 2), 0x10);
              this.communicationClass.bisNew = true;
              if (enumDType != enumDataType.Energy_DataType) {
                if (enumDType == enumDataType.CT_Value) {
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 0x4f;
                    buffer7[1] = 0xf4;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                } else if (enumDType != enumDataType.Demand_DataType) {
                  num = 1;
                  while (num <= this.iSampleCount) {
                    this.Ret = false;
                    buffer7[0] = 0x44;
                    buffer7[1] = 0xe9;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                    num++;
                  }
                  num = 1;
                  while (num <= this.iSampleCount) {
                    this.Ret = false;
                    buffer7[0] = 0x45;
                    buffer7[1] = 0xe9;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                    num++;
                  }
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 70;
                    buffer7[1] = 0xe9;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 0x54;
                    buffer7[1] = 0xe9;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 0x55;
                    buffer7[1] = 0xe9;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 0x56;
                    buffer7[1] = 0xe9;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                } else {
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 0x43;
                    buffer7[1] = 0xd3;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                  num = 1;
                  while (num <= this.iSampleCount) {
                    this.Ret = false;
                    buffer7[0] = 0x43;
                    buffer7[1] = 0xe3;
                    await this.communicationClass.sp_SendPower(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                    num++;
                  }
                }
              } else {
                for (num = 1; num <= this.iSampleCount; num++) {
                  this.Ret = false;
                  buffer7[0] = 0x43;
                  buffer7[1] = 0xc3;
                  await this.communicationClass.sp_SendPower(
                    buffer5,
                    buffer7,
                    0,
                  );
                  if (await this.CommOK1()) {
                    break;
                  }
                }
                num = 1;
                while (num <= this.iSampleCount) {
                  this.Ret = false;
                  buffer7[0] = 0x43;
                  buffer7[1] = 0xc4;
                  await this.communicationClass.sp_SendPower(
                    buffer5,
                    buffer7,
                    0,
                  );
                  if (await this.CommOK1()) {
                    break;
                  }
                  num++;
                }
              }
              this.communicationClass.bisNew = false;
            }
          } else {
            buffer5 = Buffer.alloc(6);
            buffer7 = Buffer.alloc(4);
            let flag3: bool = false;
            str6 = this.szMeterSN.padStart(12, '0');
            buffer5[0] = Convert.ToByte(str6.substring(10, 10 + 2), 0x10);
            buffer5[1] = Convert.ToByte(str6.substring(8, 8 + 2), 0x10);
            buffer5[2] = Convert.ToByte(str6.substring(6, 6 + 2), 0x10);
            buffer5[3] = Convert.ToByte(str6.substring(4, 4 + 2), 0x10);
            buffer5[4] = Convert.ToByte(str6.substring(2, 2 + 2), 0x10);
            buffer5[5] = Convert.ToByte(str6.substring(0, 0 + 2), 0x10);
            this.communicationClass.bisNew = true;
            if (enumDType != enumDataType.Energy_DataType) {
              if (enumDType != enumDataType.Demand_DataType) {
                if (enumDType != enumDataType.Voltage_DataType) {
                  if (enumDType == enumDataType.Tamper_Times) {
                    for (num = 1; num <= this.iSampleCount; num++) {
                      this.Ret = false;
                      buffer7[0] = 0x34;
                      buffer7[1] = 0x33;
                      buffer7[2] = 0x34;
                      buffer7[3] = 0x4e;
                      await this.communicationClass.sp_SendPower_07(
                        buffer5,
                        buffer7,
                        0,
                      );
                      if (await this.CommOK1()) {
                        break;
                      }
                    }
                  } else {
                    // custom add
                    console.log('not stable command');

                    return false;
                    //
                  }
                } else {
                  for (num = 1; num <= this.iSampleCount; num++) {
                    this.Ret = false;
                    buffer7[0] = 0x33;
                    buffer7[1] = 50;
                    buffer7[2] = 0x34;
                    buffer7[3] = 0x35;
                    await this.communicationClass.sp_SendPower_07(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                  }
                  num = 1;
                  while (num <= this.iSampleCount) {
                    this.Ret = false;
                    buffer7[0] = 0x33;
                    buffer7[1] = 50;
                    buffer7[2] = 0x35;
                    buffer7[3] = 0x35;
                    await this.communicationClass.sp_SendPower_07(
                      buffer5,
                      buffer7,
                      0,
                    );
                    if (await this.CommOK1()) {
                      break;
                    }
                    num++;
                  }
                }
              } else {
                for (num = 1; num <= this.iSampleCount; num++) {
                  this.Ret = false;
                  buffer7[0] = 0x33;
                  buffer7[1] = 50;
                  buffer7[2] = 0x34;
                  buffer7[3] = 0x34;
                  await this.communicationClass.sp_SendPower_07(
                    buffer5,
                    buffer7,
                    0,
                  );
                  if (await this.CommOK1()) {
                    break;
                  }
                }
                flag3 ||= this.Ret;
                for (num = 1; num <= this.iSampleCount; num++) {
                  this.Ret = false;
                  buffer7[0] = 0x33;
                  buffer7[1] = 0x33;
                  buffer7[2] = 0x36;
                  buffer7[3] = 0x34;
                  await this.communicationClass.sp_SendPower_07(
                    buffer5,
                    buffer7,
                    0,
                  );
                  if (await this.CommOK1()) {
                    break;
                  }
                }
                flag3 ||= this.Ret;
                this.Ret = flag3;
              }
            } else {
              for (num = 1; num <= this.iSampleCount; num++) {
                this.Ret = false;
                buffer7[0] = 0x33;
                if (this.meterPhase == METER_PHASE.THREE_PHASE) {
                  buffer7[1] = 50;
                  buffer7[2] = 0x34;
                } else {
                  buffer7[1] = 0x33;
                  buffer7[2] = 0x33;
                }
                buffer7[3] = 0x33;
                await this.communicationClass.sp_SendPower_07(
                  buffer5,
                  buffer7,
                  0,
                );
                if (await this.CommOK1()) {
                  break;
                }
              }
              flag3 ||= this.Ret;
              for (num = 1; num <= this.iSampleCount; num++) {
                this.Ret = false;
                buffer7[0] = 0x33;
                buffer7[1] = 0x33;
                buffer7[2] = 0x36;
                buffer7[3] = 0x33;
                await this.communicationClass.sp_SendPower_07(
                  buffer5,
                  buffer7,
                  0,
                );
                if (await this.CommOK1()) {
                  break;
                }
              }
              flag3 ||= this.Ret;
              this.Ret = flag3;
            }
          }
        } else {
          await this.SampleVN31();
        }
        return true;
      }
      str2 = this.szMeterSN.padStart(12, '0');
      buffer3 = Buffer.from([
        Convert.ToByte(str2.substring(10, 10 + 2), 0x10),
        Convert.ToByte(str2.substring(8, 8 + 2), 0x10),
        Convert.ToByte(str2.substring(6, 6 + 2), 0x10),
        Convert.ToByte(str2.substring(4, 4 + 2), 0x10),
        Convert.ToByte(str2.substring(2, 2 + 2), 0x10),
        Convert.ToByte(str2.substring(0, 0 + 2), 0x10),
      ]);
      flag = false;
      this.communicationClass.bisNew = true;
      length = this.szMeterSN.length;
      num5 = 0;
      for (num = 0; num < length; num++) {
        ch = this.szMeterSN[num];
        if (ch.toString() != '0') {
          num5 = num;
          break;
        }
      }
    } else {
      dataArray[0] = this.GetIndex('ST_70K');
      this.communicationClass.bisNew = false;
      for (num = 1; num <= this.iSampleCount; num++) {
        this.Ret = false;
        await this.communicationClass.SP_Send(
          addrArray,
          0xfc,
          dataArray,
          0,
          0,
          1,
        );
        if (await this.CommOK1()) {
          break;
        }
      }
      return this.Ret;
    }
    str3 = this.szMeterSN.substring(num5, num5 + length - num5);
    for (num = 1; num <= this.iSampleCount; num++) {
      this.Ret = false;
      this.communicationClass.bflag21 = true;
      let s: string = '15.8.0()';
      if (enumDType == enumDataType.Energy_DataType) {
        this.bReadGroupData = false;
        s = '15.8.0()';
      } else if (enumDType == enumDataType.ReactivePower_DataType) {
        this.bReadGroupData = false;
        s = '3.8.0()';
      } else if (enumDType == enumDataType.GroupData_DataType) {
        this.bReadGroupData = true;
        s = '99.1.0()';
      }
      let num6: int = s.length;
      let bOBISData: Buffer = EncodingDefaultGetBytes(s);
      let nlen: int = 1 + num6 - 7;
      nlen = nlen - str2.length + str3.length;
      await this.communicationClass.SendX328_Hand(
        buffer3,
        false,
        3,
        nlen,
        str2,
        bOBISData,
        true,
        str3.length,
      );
      if (await this.CommOK1()) {
        return true;
      }
    }
    return flag;
    Label_150F: return true;
  }

  private SampleElster(iType: int): bool {
    //bool ret = true;
    /*
            if (iType == 0)
            {
                await this.SampleData(enumDataType.Energy_DataType); // stock Energy_DataType
                ret = this.Ret;
            }
            if (ret)
            {
                await this.SampleData(enumDataType.Energy_T1_DataType);
                if (this.listView1.Items.length <= 0)
                {
                    this.Ret = false;
                    return false;
                }
                if (!(this.Ret || !(this.textBox2.Text.trim() != "")))
                {
                    console.log( TAG, "Set Password Fail!");
                    this.Ret = true;
                    return true;
                }
                await this.SampleData(enumDataType.Demand_T1_DataType);
                await this.SampleData(enumDataType.Curerent_DataType);
                await this.SampleData(enumDataType.Voltage_DataType);
                if (this.textBox2.Text.trim() != "")
                {
                    console.log( TAG, "Set Password Success!");
                }
                this.Ret = true;
                return true;
            }
            if (this.textBox2.Text.trim() != "")
            {
                console.log( TAG, "Set Password Fail!");
                this.Ret = true;
                return true;
            }
            */
    return false;
  }

  // private async SampleOneMeter(): Promise<boolean> {
  //   /*
  //           switch (this.cmbMeterType.Text)
  //           {
  //               case "CPC_DTO1P":
  //                   this.meterType=METERTYPE.CPC_DTO1P;
  //                   break;
  //                   case "CPC_DTO1P80":
  //                   this.meterType=METERTYPE.CPC_DTO1P80;
  //                   break;

  //                   case "CPC_DTO3P":
  //                   this.meterType=METERTYPE.CPC_DTO3P;
  //                   break;

  //                   case "CPC_PWD":
  //                   this.meterType=METERTYPE.CPC_PWD;
  //                   break;

  //                   case "DDS26_GELEX":
  //                   this.meterType=METERTYPE.DDS26_GELEX;
  //                   break;

  //                   case "DTS27_645":
  //                   this.meterType=METERTYPE.DTS27_645;
  //                   break;

  //                    case "DTS27_ELSTER":
  //                   this.meterType=METERTYPE.DTS27_ELSTER;
  //                   break;

  //                   case "DTS27_RF":
  //                   this.meterType=METERTYPE.DTS27_RF;
  //                   break;

  //                   case "DTS27_VN31":
  //                   this.meterType=METERTYPE.DTS27_VN31;
  //                   break;

  //                   case "DTS27_X329":
  //                   this.meterType=METERTYPE.DTS27_X329;
  //                   break;

  //                   case "LTE66":
  //                   this.meterType=METERTYPE.LTE66;
  //                   break;

  //                   case "MESH_RF":
  //                   this.meterType=METERTYPE.MESH_RF;
  //                   break;

  //                   case "PTP_RF":
  //                   this.meterType = METERTYPE.PTP_RF;
  //                   break;

  //                   default:
  //                   case "MESH_RF_180":
  //                   this.meterType = METERTYPE.MESH_RF_180;
  //                   break;

  //           }

  //           */

  //   if (
  //     this.meterType != METERTYPE.MESH_RF &&
  //     this.meterType != METERTYPE.MESH_RF_180 &&
  //     this.meterType != METERTYPE.PTP_RF
  //   ) {
  //     let flag4: bool = false;
  //     MyGloab.bFlagVN31 = false;
  //     switch (this.meterType) {
  //       case METERTYPE.LTE66:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         break;

  //       case METERTYPE.DTS27_645:
  //         this.bDemand = false;
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         /*
  //                       flag4 ||= this.Ret;
  //                       if (flag4)
  //                       {
  //                           await this.SampleData(enumDataType.Voltage_DataType);
  //                       }
  //                       flag4 ||= this.Ret;
  //                        */
  //         if (flag4) {
  //           await this.SampleData(enumDataType.Demand_DataType);
  //         }
  //         flag4 ||= this.Ret;

  //         this.Ret = flag4;
  //         break;

  //       case METERTYPE.CPC_DTO1P:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         break;

  //       case METERTYPE.CPC_DTO1P80:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         break;

  //       case METERTYPE.CPC_DTO3P:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         break;

  //       case METERTYPE.DTS27_VN31:
  //         MyGloab.bFlagVN31 = true;
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         break;

  //       case METERTYPE.DTS27_X329:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         if (this.Ret) {
  //           await this.SampleData(enumDataType.ReactivePower_DataType);
  //           //await this.SampleData(enumDataType.GroupData_DataType);
  //         }
  //         break;

  //       case METERTYPE.DTS27_645_07:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType

  //         flag4 ||= this.Ret;

  //         //if (flag4)
  //         //{
  //         //    await this.SampleData(enumDataType.Voltage_DataType);
  //         //}
  //         //flag4 ||= this.Ret;
  //         //if (flag4)
  //         //{
  //         //    await this.SampleData(enumDataType.Tamper_Times);
  //         //}
  //         //flag4 ||= this.Ret;
  //         if (flag4) {
  //           await this.SampleData(enumDataType.Demand_DataType);
  //         }
  //         flag4 ||= this.Ret;

  //         this.Ret = flag4;
  //         break;

  //       case METERTYPE.DTS27_ELSTER:
  //         //this.SampleElster(0);
  //         break;

  //       case METERTYPE.DDS26_GELEX:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         if (this.Ret) {
  //           //await this.SampleData(enumDataType.ReactivePower_DataType);
  //           //await this.SampleData(enumDataType.Voltage_DataType);
  //         }
  //         break;

  //       case METERTYPE.CPC_PWD:
  //         await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //         if (this.Ret) {
  //           //await this.SampleData(enumDataType.Voltage_DataType);
  //           //await this.SampleData(enumDataType.Version_DataType);
  //         }
  //         break;
  //     }
  //   } else {
  //     let flag2: bool = false;
  //     this.Ret = false;
  //     if (
  //       this.meterPhase == METER_PHASE.THREE_PHASE &&
  //       this.meterType != METERTYPE.PTP_RF
  //     ) {
  //       //flag2 = await this.SampleData(enumDataType.GroupData_DataType);
  //       //return await this.SampleData(enumDataType.GroupData_DataType_2);
  //     }
  //     if (this.meterType == METERTYPE.MESH_RF_180) {
  //       flag2 = await this.SampleData(enumDataType.Energy_DataType_180);
  //       let ret: bool = this.Ret;
  //       if (
  //         this.Ret &&
  //         this.meterPhase == METER_PHASE.THREE_PHASE &&
  //         (await this.SampleData(enumDataType.Energy_T1_DataType_180))
  //       ) {
  //         flag2 = await this.SampleData(enumDataType.Energy_T2_DataType_180);
  //         flag2 = await this.SampleData(enumDataType.Energy_T3_DataType_180);
  //       }
  //       this.Ret = ret;
  //     } else {
  //       flag2 = await this.SampleData(enumDataType.Energy_DataType_180); // stock Energy_DataType
  //       // if (!flag2) {
  //       //   console.log('custom call sample data');

  //       //   flag2 = await this.SampleData(enumDataType.Energy_DataType_180);
  //       // }
  //     }

  //     //return flag2;//28/12/2017

  //     if (!this.bReadContinue) {
  //       if (!this.Ret) {
  //         //   continue Label_07A6;
  //         return this.Ret;
  //       }
  //       /*
  //                   if ((this.meterType != METERTYPE.MESH_RF) && (this.meterType != METERTYPE.MESH_RF_180))
  //                   {
  //                       let num2: int = 0;
  //                       if (this.meterType == METERTYPE.DTS27_ELSTER)
  //                       {
  //                           flag2 = this.SampleElster(1);
  //                           return true;
  //                       }
  //                       this.Ret = false;
  //                       this.sp_Base.SP_Send(this.bAddr, 0x22, this.bBoxNo, 0, 0, 1);
  //                       if (this.CommOK())
  //                       {
  //                           this.Ret = false;
  //                           this.sp_Base.SP_Send(this.bAddr, 0x23, this.bBoxNo, 0, 0, 1);
  //                           this.CommOK();
  //                       }
  //                       this.Ret = false;
  //                       this.sp_Base.SP_Send(this.bAddr, 0x9b, this.bBoxNo, 0, 0, 1);
  //                       this.CommOK();
  //                       this.Ret = false;
  //                       this.sp_Base.SP_Send(this.bAddr, 0x9a, this.bBoxNo, 0, 0, 1);
  //                       this.CommOK();
  //                       for (num2 = 0; num2 < this.iSampleCount; num2++)
  //                       {
  //                           this.Ret = false;
  //                           this.x = "A";
  //                           this.volcurIndex = 0;
  //                           this.sp_Base.SP_Send(this.bAddr, 190, this.bBoxNo, 0, 0, 1);
  //                           Sleep(500);
  //                           if (this.CommOK())
  //                           {
  //                               break;
  //                           }
  //                       }
  //                       if (this.Ret)
  //                       {
  //                           for (num2 = 0; num2 < this.iSampleCount; num2++)
  //                           {
  //                               this.Ret = false;
  //                               this.x = "B";
  //                               this.volcurIndex = 1;
  //                               this.sp_Base.SP_Send(this.bAddr, 0x91, this.bBoxNo, 0, 0, 1);
  //                               Sleep(500);
  //                               if (this.CommOK())
  //                               {
  //                                   break;
  //                               }
  //                           }
  //                       }
  //                       else
  //                       {
  //                           console.log( TAG, "No A voltage and current data return!");
  //                           return true;
  //                       }
  //                       if (this.Ret)
  //                       {
  //                           for (num2 = 0; num2 < this.iSampleCount; num2++)
  //                           {
  //                               this.Ret = false;
  //                               this.x = "C";
  //                               this.volcurIndex = 2;
  //                               this.sp_Base.SP_Send(this.bAddr, 0x92, this.bBoxNo, 0, 0, 1);
  //                               Sleep(500);
  //                               if (this.CommOK())
  //                               {
  //                                   break;
  //                               }
  //                           }
  //                       }
  //                       else
  //                       {

  //                                   this.AppendLV("A", this.vol[0], this.cur[0]);

  //                           console.log( TAG, "No B voltage and current data return!");
  //                           return true;
  //                       }
  //                       if (!this.Ret)
  //                       {

  //                                   this.AppendLV("A", this.vol[0], this.cur[0] * 10f);
  //                                   this.AppendLV("B", this.vol[1], this.cur[1] * 10f);

  //                           console.log( TAG, "No C voltage and current data return!");
  //                           return true;
  //                       }
  //                       for (num2 = 0; num2 < this.iSampleCount; num2++)
  //                       {
  //                           this.Ret = false;
  //                           this.x = "C";
  //                           this.sp_Base.SP_Send(this.bAddr, 0xb7, this.bBoxNo, 0, 0, 1);
  //                           Sleep(500);
  //                           if (this.CommOK())
  //                           {
  //                               break;
  //                           }
  //                       }

  //                       this.AppendLV("A", this.vol[0], this.cur[0] * 10f);
  //                       this.AppendLV("B", this.vol[1], this.cur[1] * 10f);
  //                       this.AppendLV("C", this.vol[2], this.cur[2] * 10f);

  //                       return true;
  //                   }
  //                   */

  //       //if (this.listView1.Items.length <= 0)
  //       // if (this.strResult == '') {
  //       //   flag2 = await this.SampleData(enumDataType.Energy_DataType_180);
  //       // }
  //       /*
  //                   let num :int =  0;
  //                   flag2 = false;
  //                   if (this.meterPhase != METER_PHASE.SINGLE_PHASE)
  //                   {
  //                       flag2 = await this.SampleData(enumDataType.Voltage_DataType_A);
  //                       flag2 = await this.SampleData(enumDataType.Voltage_DataType_B);
  //                       flag2 = await this.SampleData(enumDataType.Voltage_DataType_C);
  //                       flag2 = await this.SampleData(enumDataType.Curerent_DataType_A);
  //                       flag2 = await this.SampleData(enumDataType.Curerent_DataType_B);
  //                       flag2 = await this.SampleData(enumDataType.Curerent_DataType_C);
  //                   }
  //                   else
  //                   {
  //                       while (num++ < 2)
  //                       {
  //                           flag2 = await this.SampleData(enumDataType.GroupData_DataType);
  //                           if (flag2)
  //                           {
  //                               break;
  //                           }
  //                       }
  //                       if (!flag2)
  //                       {
  //                           flag2 = await this.SampleData(enumDataType.Voltage_DataType);
  //                           flag2 = await this.SampleData(enumDataType.Curerent_DataType);
  //                       }
  //                   }
  //                   */
  //     }
  //     return true;
  //   }
  //   return this.Ret;
  //   //Label_07A6: return this.Ret;
  // }

  // private async SampleOneMeter70_50(): Promise<boolean> {
  //   this.communicationClass.bytBaud[0] = 10;
  //   this.communicationClass.bytBaud[1] =
  //     0xff & (this.communicationClass.bytBaud[0] * 0x10);

  //   return await this.SampleOneMeter();
  // }

  // private async SamplePrity(): Promise<boolean> {
  //   try {
  //     let meterType: METERTYPE = this.meterType;
  //     this.bReadContinue = false;

  //     if (!(await this.SampleOneMeter70_50()) || this.bReadContinue) {
  //       //----------------------------------

  //       for (let i = 0; i < this.SamplePriority.length; i++) {
  //         if (this.bReadContinue) {
  //           this.meterType = METERTYPE.DTS27_645_07;
  //           if (!(!(await this.SampleOneMeter70_50()) || this.bReadContinue)) {
  //             //MyGloab.SetMeterType(this.szMeterSN, (0xffffffff & this.meterType).toString());
  //             return true;
  //           }
  //           return false;
  //         }
  //         if (this.Stop_Flag) {
  //           return false;
  //         }
  //         if (
  //           this.SamplePriority[i] != meterType &&
  //           (meterType != METERTYPE.MESH_RF_180 ||
  //             this.SamplePriority[i] != METERTYPE.MESH_RF) &&
  //           (meterType != METERTYPE.MESH_RF ||
  //             this.SamplePriority[i] != METERTYPE.MESH_RF_180)
  //         ) {
  //           this.meterType = this.SamplePriority[i];
  //           this.bReadContinue = false;

  //           if (!(!(await this.SampleOneMeter70_50()) || this.bReadContinue)) {
  //             //MyGloab.SetMeterType(this.szMeterSN, (0xffffffff & this.meterType).toString());
  //             return true;
  //           }
  //         }
  //       }

  //       //-----------------------------
  //     } else {
  //       //console.log('6');
  //       return true;
  //     }
  //   } catch (err: any) {
  //     console.log(TAG, 'err: ', err.message);
  //   }
  //   //console.log('7');
  //   return false;
  // }

  private async SampleVN31(): Promise<void> {
    try {
      let num2: int = 0;
      let str: string = this.szMeterSN.padStart(12, '0');
      this.Ret = false;
      let buffer: Buffer = Buffer.alloc(6);
      buffer[5] = Convert.ToByte(str.substring(0, 0 + 2), 0x10);
      buffer[4] = Convert.ToByte(str.substring(2, 2 + 2), 0x10);
      buffer[3] = Convert.ToByte(str.substring(4, 4 + 2), 0x10);
      buffer[2] = Convert.ToByte(str.substring(6, 6 + 2), 0x10);
      buffer[1] = Convert.ToByte(str.substring(8, 8 + 2), 0x10);
      buffer[0] = Convert.ToByte(str.substring(10, 10 + 2), 0x10);
      let buffer2: Buffer = Buffer.alloc(3);
      //this.delayTime = 0;
      let strArray: string[] = [
        '0100010800FF',
        '0100010801FF',
        '0100010802FF',
        '0100010803FF',
        '0100030800FF',
      ];
      let broad: bool = false;
      MyGlobal.varHDLC.bytClientRRR = 1;
      MyGlobal.varHDLC.bytClientSSS = 1;
      this.ItemIndex = 0;
      let strArray2: string[] = new Array<string>(3);

      this.Ret = false;
      //this.rdNUM = 1;
      let itemIndex: int = 0;
      let flag3: bool = false;
      let flag4: bool = false;
      MyGlobal.FNO = 1;
      await this.communicationClass.sp_SendDLMS(
        buffer,
        broad,
        strArray[0],
        '03',
        '0200',
        0xff & MyGlobal.FNO,
        true,
      );
      await this.CommOKVN31();
      if (this.ItemIndex > 0) {
        MyGlobal.FNO += 2;
        flag3 = true;
        for (num2 = itemIndex; num2 < this.ItemIndex; num2++) {
          this.AppendLV(
            this.ItemN[num2],
            this.RetVal[num2].toFixed(2) + ' kWh',
          );
        }
        itemIndex = this.ItemIndex;
        flag4 = true;
      } else if (this.ItemIndex == 0) {
        flag3 = false;
        await this.communicationClass.sp_SendDLMS(
          buffer,
          broad,
          strArray[0],
          '03',
          '0200',
          0xff & MyGlobal.FNO,
          true,
        );
        await this.CommOKVN31();
        MyGlobal.FNO += 2;
        if (this.ItemIndex > 0) {
          flag3 = true;
          for (num2 = itemIndex; num2 < this.ItemIndex; num2++) {
            this.AppendLV(
              this.ItemN[num2],
              this.RetVal[num2].toFixed(2) + ' kWh',
            );
          }
          itemIndex = this.ItemIndex;
          flag4 = true;
        }
      }
      if (flag3) {
        strArray2[0] = strArray[1];
        strArray2[1] = strArray[2];
        strArray2[2] = strArray[3];
        //this.rdNUM = 3;
        this.Ret = false;
        await this.communicationClass.sp_SendDLMSArrLog(
          buffer,
          broad,
          strArray2,
          '03',
          '0200',
          0xff & MyGlobal.FNO,
          false,
        );
        await this.CommOKVN31();
        if (this.ItemIndex > 1) {
          MyGlobal.FNO += 2;
          for (num2 = itemIndex; num2 < this.ItemIndex; num2++) {
            this.AppendLV(
              this.ItemN[num2],
              this.RetVal[num2].toFixed(2) + ' kWh',
            );
          }
          itemIndex = this.ItemIndex;
        } else {
          await this.communicationClass.sp_SendDLMSArrLog(
            buffer,
            broad,
            strArray2,
            '03',
            '0200',
            0xff & MyGlobal.FNO,
            false,
          );
          await this.CommOKVN31();
          MyGlobal.FNO += 2;
          if (this.ItemIndex > 1) {
            for (num2 = itemIndex; num2 < this.ItemIndex; num2++) {
              this.AppendLV(
                this.ItemN[num2],
                this.RetVal[num2].toFixed(2) + ' kWh',
              );
            }
            itemIndex = this.ItemIndex;
          }
        }
        this.Ret = false;
        //this.rdNUM = 1;
        await this.communicationClass.sp_SendDLMS(
          buffer,
          broad,
          strArray[4],
          '03',
          '0200',
          0xff & MyGlobal.FNO,
          false,
        );
        await this.CommOKVN31();
        if (this.ItemIndex > itemIndex) {
          MyGlobal.FNO += 2;
          for (num2 = itemIndex; num2 < this.ItemIndex; num2++) {
            this.AppendLV(
              this.ItemN[num2],
              this.RetVal[num2].toFixed(2) + ' kVarh',
            );
          }
          itemIndex = this.ItemIndex;
        } else {
          await this.communicationClass.sp_SendDLMS(
            buffer,
            broad,
            strArray[4],
            '03',
            '0200',
            0xff & MyGlobal.FNO,
            false,
          );
          await this.CommOKVN31();
          MyGlobal.FNO += 2;
          if (this.ItemIndex > itemIndex) {
            MyGlobal.FNO += 2;
            for (num2 = itemIndex; num2 < this.ItemIndex; num2++) {
              this.AppendLV(
                this.ItemN[num2],
                this.RetVal[num2].toFixed(2) + ' kVarh',
              );
            }
            itemIndex = this.ItemIndex;
          }
        }
      }
      if (flag4) {
        //base.base_menu1.Enabled=(true);
      } else {
        //base.base_menu1.Enabled=(true);
      }
    } catch {}
  }

  public VoltCurrent(bData: Buffer): void {
    let x: string = this.x;
    let num: float = (bData[9] << 8) + bData[8];
    this.vol[this.volcurIndex] = num / 100.0;
    let num3: float = (bData[12] << 0x10) + (bData[11] << 8) + bData[10];
    this.cur[this.volcurIndex] = num3 / 1000.0;
    this.Ret = true;
  }

  // private btnRead_Click(sender: any, e: any) {
  //   //await this.AutoReadRF_ST();
  // }

  // private ReadVoltS_FormClosing(sender: any, e: any) {
  //   this.communicationClass.SPCommClose();
  // }

  ///////////////////GELEX EMIC ////////////////////////////////////////

  // public GELEX_ReadRF(
  //   strSHSX: string,
  //   bCommandID: byte,
  //   bReadEnergy: bool,
  //   bReadOnline: bool,
  //   strRFCode: string,
  //   idate: Date,
  // ): string {
  //   return 'NACK';
  // }
  // //---------------------------------------------------------------------------------------------------
  // public BeginGELEX() {}
  // //---------------------------------------------------------------------------------------------------
  // public EndGELEX() {}

  // public GELEX_Open() {}

  // public GELEX_Close() {}

  // public GELEX_ReadRF_GCS(
  //   strSERY_CTO: string,
  //   strMA_CTO: string,
  //   strLOAI_BCS_CMIS: string,
  //   strRF: string,
  //   iDate: Date,
  // ): string {
  //   return 'NACK';
  // }

  // public GELEX_ReadRF_GCS_Chot0h(
  //   strSERY_CTO: string,
  //   strMA_CTO: string,
  //   strLOAI_BCS_CMIS: string,
  //   strRF: string,
  //   iDate: Date,
  // ): string {
  //   return 'NACK';
  // }
}
