import { Convert } from '../../../aps/util';
import { bool, byte, decimal, int, long } from '../../../define';
import { Aes, KeySize } from './Aes';
import { CommuClass } from './CommuClass';
import { Descartes } from './Descartes';
import { METERTYPE } from './METERTYPE';
import { METER_PHASE } from './METER_PHASE';
import { Buffer } from 'buffer';

const TAG = 'MyGloab: ';

export type PropsLsRange = {
  MeterType: METERTYPE;
  bRTC: bool;
  bX335_Old: bool;
  lsMeterAddressRange: string[];
};

export class MyGloab {
  public static bBroad_PTP_RF: bool = false;
  public static bBroad21: bool = false;
  public static bBroad645: bool = false;
  public static bDisplayParam: bool = true;
  public static beginTimeCount: int = 0;
  public static bFlag21type: bool = false;
  public static bFlagHhu: bool = false;
  public static bFlagVN31: bool = false;
  public static bHaveCPC: bool = false;
  public static bHaveElster: bool = false;
  public static bHaveGELEX: bool = false;
  public static bHaveLTE: bool = false;
  public static bHaveSGPMax: bool = true;
  public static bHaveStar: bool = true;
  public static bHaveTIPMax: bool = true;
  public static bHaveVCPMax: bool = true;
  public static bHaveVoltage: bool = false;
  public static bOnly70K: bool = false;
  public static bOuterMode: bool = true;
  public static bSaveLog: bool = true;
  private static charA: string[] = [
    'a',
    '\x00e1',
    '\x00e0',
    '\x00e3',
    'ạ',
    'ả',
    'ă',
    'ắ',
    'ằ',
    'ẵ',
    'ặ',
    'ẳ',
    '\x00e2',
    'ấ',
    'ầ',
    'ẫ',
    'ậ',
    'ẩ',
  ];
  private static charD: string[] = ['d', 'Đ'];
  private static charE: string[] = [
    'e',
    '\x00e9',
    '\x00e8',
    'ẽ',
    'ẹ',
    'ẻ',
    '\x00ea',
    'ế',
    'ề',
    'ễ',
    'ệ',
    'ể',
  ];
  private static charI: string[] = ['i', '\x00ed', '\x00ec', 'ĩ', 'ị', 'ỉ'];
  private static charO: string[] = [
    'o',
    '\x00f3',
    '\x00f2',
    '\x00f5',
    'ọ',
    'ỏ',
    '\x00f4',
    'ố',
    'ồ',
    'ỗ',
    'ộ',
    'ổ',
    'ơ',
    'ớ',
    'ờ',
    'ỡ',
    'ợ',
    'ở',
  ];
  private static charU: string[] = [
    'u',
    '\x00fa',
    '\x00f9',
    'ũ',
    'ụ',
    'ủ',
    'ư',
    'ứ',
    'ừ',
    'ữ',
    'ự',
    'ử',
  ];
  private static charY: string[] = ['y', '\x00fd', 'ỳ', 'ỹ', 'ỵ', 'ỷ'];
  public static cpc_key: Buffer = Buffer.from([
    0x45, 0x6d, 0x45, 0x43, 0x63, 80, 0x63, 0x72, 0x44, 0x45, 0x4d, 0x65, 0x74,
    0x65, 0x72, 0x73,
  ]);
  public static dbPath: string = '';
  private static filenameLog: string = 'CommLog.txt';
  public static gbHavePoint: bool;
  public static gISTimeOut: bool;
  public static HoldParam: int = 50;
  public static HoldParam1: int = 50;
  public static HoldVParam: int = 50;
  public static HoldVParam1: int = 50;
  public static isOldPtpModule: byte = 0;
  public static lsMeterRange: PropsLsRange[] = [];
  public static numSet21: byte = 0;
  public static objLock: any = {};
  public static SampleSystemType: METERTYPE;
  public static sHHu: Buffer = Buffer.alloc(6);
  //public static spComm: CommuClass = new CommuClass();
  public static strMeterAdd: string = '000000000000';
  public static strTimeout: string = '4.0';
  //public static  xmlDoc : XmlDocument;

  public static ByteToBCD(byt: byte): string {
    let num: byte = 0;
    if (byt < 0x33) {
      num = byt + 0x100 - 0x33;
    } else {
      num = byt - 0x33;
    }
    return num.toString(16).padStart(2, '0');
  }

  public static ByteToBCD_Data(byt: byte): byte {
    if (byt < 0x33) {
      return 0xff & (byt + 0x100 - 0x33);
    }
    return 0xff & (byt - 0x33);
  }

  public static ByteToBCD_H(byt: byte): string {
    let num = 0;
    if (byt < 0x33) {
      num = byt + 0x100 - 0x33;
    } else {
      num = byt - 0x33;
    }
    if (num >= 0x80) {
      let num2 = num - 0x80;
      return '-' + num2.toString(16).padStart(2, '0');
    }
    return num.toString(16).padStart(2, '0');
  }

  // public static SampleResult ChangeDataSet(DataSet ds, SAMPLE_STYLE dsType, string MeterSn, string Loai, decimal energy)
  // {
  //     try
  //     {
  //         DataRow[] rowArray = ds.Tables[0].Select("indexID='" + MeterSn + "' And Loai_bcs='" + Loai + "'");
  //         rowArray[0]["IsUpdate"]= 1;
  //         rowArray[0]["Cs_moi"]= energy;
  //         decimal usedKWH = energy - Convert.ToDecimal(rowArray[0]["Cs_cu"]);
  //         rowArray[0]["Sl_moi"]= usedKWH;
  //         let flag :bool = MyGloab.EnergyIsNormal(usedKWH, Convert.ToDecimal(rowArray[0]["Sl_cu"]));
  //         if (usedKWH < -0.001)
  //         {
  //             return SampleResult.ISNEGATIVE;
  //         }
  //         if (!flag)
  //         {
  //             return SampleResult.NOTNORMAL;
  //         }
  //         return SampleResult.ISNORMAL;
  //     }
  //     catch
  //     {
  //     }
  //     return SampleResult.ISNORMAL;
  // }

  public static ChangeEn2Vietnam(strEn: string): string[] {
    let list2: string[] = [];
    let dimvalue: string[][] = [];
    for (let i = 0; i < strEn.length; i++) {
      list2 = [];
      let item: string = strEn.substring(i, i + 1).toUpperCase();
      list2.push(item);
      switch (item) {
        case 'A':
          list2.push('Ă');
          list2.push('\x00c2');
          break;

        case 'D':
          list2.push('Đ');
          break;

        case 'E':
          list2.push('\x00ea');
          break;

        case 'O':
          list2.push('\x00f4');
          list2.push('Ơ ');
          break;

        case 'U':
          list2.push('Ư ');
          break;
      }
      dimvalue.push(list2);
    }
    list2 = [];
    Descartes.run(dimvalue, list2, 0, '');
    return list2;
  }

  public static Close_SpComm() {
    //spComm.SPCommClose();
  }

  public static ConvertIntDateTime(d: long): Date {
    const time2: Date = new Date(d * 1000);
    return time2;
  }

  public static cpc_decrypt(input: Buffer, output: Buffer): void {
    new Aes(KeySize.Bits128, Buffer.from(MyGloab.cpc_key)).decrypt(
      input,
      output,
    );
  }

  public static DemandValue(arrayD: Buffer, iLen: int): string {
    let str: string = '+';
    try {
      let num: byte = MyGloab.ByteToBCD_Data(arrayD[0]);
      if (num >= 0x80) {
        str = '-';
      }
      if ((num & 15) > 9) {
        let num2: decimal =
          ((num & 6) * 0x10000 +
            MyGloab.ByteToBCD_Data(arrayD[1]) * 0x100 +
            MyGloab.ByteToBCD_Data(arrayD[2])) /
          0x2710;
        return str + num2.toString();
      }
      if (iLen == 4) {
        return (
          MyGloab.ByteToBCD_H(arrayD[0]) +
          MyGloab.ByteToBCD(arrayD[1]) +
          '.' +
          MyGloab.ByteToBCD(arrayD[2]) +
          MyGloab.ByteToBCD(arrayD[3])
        );
      }
      return (
        MyGloab.ByteToBCD_H(arrayD[0]) +
        '.' +
        MyGloab.ByteToBCD(arrayD[1]) +
        MyGloab.ByteToBCD(arrayD[2])
      );
    } catch {
      return '0';
    }
  }

  public static EnergyIsNormal(UsedKWH: decimal, lastUsedKWH: decimal): bool {
    let num: decimal = Math.abs(UsedKWH);
    let num2: decimal = Math.abs(lastUsedKWH);
    if (Math.abs(num - num2) >= 0.001) {
      if (num < 0.001 || num2 < 0.001) {
        return false;
      }
      if (num > num2) {
        if ((0xffffffff & (((num - num2) / num2) * 100)) > MyGloab.HoldParam) {
          return false;
        }
        return true;
      }
      if ((0xffffffff & (((num2 - num) / num2) * 100)) > MyGloab.HoldParam1) {
        return false;
      }
    }
    return true;
  }

  // public static  EnergyIsNormal( UsedKWH :decimal,  lastUsedKWH :decimal,  bytDta :Buffer, ref bool bBigValue) : bool
  // {
  //     decimal num = Math.abs(UsedKWH);
  //     decimal num2 = Math.abs(lastUsedKWH);
  //     if (Math.abs((decimal) (num - num2)) >= 0.001)
  //     {
  //         if ((num < 0.001M) || (num2 < 0.001M))
  //         {
  //             return false;
  //         }
  //         if ((Math.abs((num - num2)) / num2) > 2.0)
  //         {
  //             bBigValue = true;
  //             string logString = "";
  //             for (let i = 0; i < bytDta.length; i++)
  //             {
  //                 logString = logString + bytDta[i].toString(16).padStart(2, '0') + " ";
  //             }
  //             logString = logString + " " + num2.toString() + " " + num.toString();
  //             WriteSystemLog("Big Value", logString);
  //         }
  //         if (num > num2)
  //         {
  //             if ((0xffffffff &  (((num - num2) / num2) * 100M)) > HoldParam)
  //             {
  //                 return false;
  //             }
  //             return true;
  //         }
  //         if ((0xffffffff &  (((num2 - num) / num2) * 100M)) > HoldParam1)
  //         {
  //             return false;
  //         }
  //     }
  //     return true;
  // }

  public static GetInfoByName(
    keyName: string,
    defalutValue: string,
    moduleName: string,
  ): string {
    return defalutValue;
    // try
    // {
    //     if (OpenXmlFile())
    //     {
    //         XmlNode node = xmlDoc.SelectSingleNode("root");
    //         if (node == null)
    //         {
    //             return defalutValue;
    //         }
    //         XmlNode node2 = node.SelectSingleNode(moduleName);
    //         if (node2 == null)
    //         {
    //             return defalutValue;
    //         }
    //         XmlNode node3 = node2.SelectSingleNode(keyName);
    //         if (node3 != null)
    //         {
    //             return node3.InnerText;
    //         }
    //     }
    //     return defalutValue;
    // }
    // catch
    // {
    //     return "";
    // }
  }
  public static GetMeterPhase(meterSn: string, strLocs: string): METER_PHASE {
    let meter_phase: METER_PHASE = METER_PHASE.SINGLE_PHASE;
    try {
      let num2: long = Convert.ToInt64(meterSn);
      if (num2 >= 14999001 && num2 <= 14999165) {
        return METER_PHASE.THREE_PHASE;
      }
      if (num2 >= 1504700001 && num2 <= 1504700250) {
        return METER_PHASE.THREE_PHASE;
      }
      if (meterSn.length <= 8) {
        if (meterSn.substring(0, 1) == '3') {
          meter_phase = METER_PHASE.THREE_PHASE;
        }
        return meter_phase;
      }
      if (meterSn.substring(0, 2) == '00' && meterSn.length == 12) {
        meterSn = meterSn.substring(2); //số no 12 số 001446436252
      }
      let num: int = Convert.ToInt32(meterSn.substring(0, 2));
      if (num < 15) {
        if (strLocs != 'KT') {
          meter_phase = METER_PHASE.THREE_PHASE;
        }
        return meter_phase;
      }
      if (num == 55) {
        meter_phase = METER_PHASE.THREE_PHASE;
      } else if (
        meterSn.substring(2, 2 + 1) == '3' ||
        meterSn.substring(2, 2 + 1) == '4'
      ) {
        meter_phase = METER_PHASE.THREE_PHASE;
      }
    } catch {
      return meter_phase;
    }
    return meter_phase;
  }

  public static GetMeterTypeOfAddress(
    sMeter: string,
    refBHave: { bHave: bool },
  ): METERTYPE {
    let meterType: METERTYPE = METERTYPE.MESH_RF;
    let str: string = sMeter;
    refBHave.bHave = false;
    let count = MyGloab.lsMeterRange.length;

    //console.log('MyGloab.lsMeterRange:', MyGloab.lsMeterRange);

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        let range: PropsLsRange = MyGloab.lsMeterRange[i];
        let num3: int = range.lsMeterAddressRange.length;
        if (num3 > 0) {
          for (let j: int = 0; j < num3; j++) {
            let strArray: string[] = range.lsMeterAddressRange[j].split('-');
            if (str.length == strArray[0].length) {
              let num5: long = Convert.ToInt64(str);
              let num6: long = Convert.ToInt64(strArray[0]);
              let num7: long = Convert.ToInt64(strArray[1]);
              if (num5 >= num6 && num5 <= num7) {
                meterType = range.MeterType;
                refBHave.bHave = true;
                return meterType;
              }
            }
          }
        }
      }
    }
    if (str.length == 8) {
      if (str.substring(0, 1) == '3') {
        return METERTYPE.PTP_RF;
      }
      let num8: long = Convert.ToInt64('14319869');
      if (Convert.ToInt64(str) >= num8) {
        return METERTYPE.MESH_RF;
      }
    }

    return meterType;
  }

  public static GetParam() {
    try {
      MyGloab.bHaveStar = Convert.ToBoolean(
        MyGloab.GetInfoByName('HaveStar', 'true', 'Info'),
      );
    } catch {
      MyGloab.bHaveStar = true;
    }
    //MyGloab.bHaveCPC = Convert.ToBoolean(MyGloab.GetInfoByName("HaveCPC", "false", "Info"));
    //MyGloab.bHaveLTE = Convert.ToBoolean(MyGloab.GetInfoByName("HaveLTE", "false", "Info"));
    //MyGloab.bHaveGELEX = Convert.ToBoolean(MyGloab.GetInfoByName("HaveGELEX", "false", "Info"));
    //MyGloab.bHaveElster = Convert.ToBoolean(MyGloab.GetInfoByName("HaveElster", "false", "Info")); // nuoc ngoai
    //MyGloab.bHaveSGPMax = Convert.ToBoolean(MyGloab.GetInfoByName("HaveSGPMax", "true", "Info")); // max 180
    //MyGloab.bHaveVCPMax = Convert.ToBoolean(MyGloab.GetInfoByName("HaveVCPMax", "true", "Info")); // max 380
    //MyGloab.bHaveTIPMax = Convert.ToBoolean(MyGloab.GetInfoByName("HaveTIPMax", "true", "Info")); //
    //MyGloab.strTimeout = MyGloab.GetInfoByName("Timeout", "4.0", "Info");
    //MyGloab.bHaveVoltage = Convert.ToBoolean(MyGloab.GetInfoByName("HaveVoltage", "false", "Info")); // read U
    //MyGloab.bOuterMode = Convert.ToBoolean(MyGloab.GetInfoByName("OuterMode", "True", "Info")); // read
    //MyGloab.bOnly70K = Convert.ToBoolean(MyGloab.GetInfoByName("Only70K", "false", "Info")); //
    //MyGloab.bDisplayParam = Convert.ToBoolean(MyGloab.GetInfoByName("DisplayParam", "True", "Info")); // true
  }

  public static GetQueryStr(strText: string): string {
    let str5: string = '';
    if (strText == '') {
      return '';
    }
    let num: int = 1;
    let num2: int = 0;
    let str: string = '';
    let str3: string = '';
    for (let i = 0; i < strText.length; i++) {
      let strVietChar: string = strText.substring(i, i + 1).toUpperCase();
      switch (strVietChar) {
        case 'A':
        case 'E':
        case 'I':
        case 'O':
        case 'U':
        case 'D':
        case 'Y':
          if (num2 > 0) {
            str5 = str3;
            str3 =
              str5 +
              ' SUBSTRING(Ten_khang,' +
              num.toString() +
              ',' +
              num2.toString() +
              ") ='" +
              str +
              "' And ";
            num2 = 0;
            str = '';
          }
          if (i == strText.length - 1) {
            str3 = str3 + MyGloab.GetVietString(i + 1, strVietChar);
          } else {
            str3 = str3 + MyGloab.GetVietString(i + 1, strVietChar) + ' And ';
          }
          num = i + 2;
          break;

        default:
          num2++;
          str = str + strVietChar;
          break;
      }
    }
    if (num2 > 0) {
      str5 = str3;
      str3 =
        str5 +
        ' SUBSTRING(Ten_khang,' +
        num.toString() +
        ',' +
        num2.toString() +
        ") ='" +
        str +
        "' ";
    }
    return str3;
  }

  private static GetVietString(iPos: int, strVietChar: string): string {
    let num: int = 0;
    let str: string = ' (';
    let str2: string = ' SUBSTRING(Ten_khang,' + iPos.toString() + ",1) ='";
    str = str + str2;
    if (strVietChar == 'A') {
      for (num = 0; num < MyGloab.charA.length; num++) {
        if (num == MyGloab.charA.length - 1) {
          str = str + MyGloab.charA[num] + "') ";
        } else {
          str = str + MyGloab.charA[num] + "' Or" + str2;
        }
      }
      return str;
    }
    if (strVietChar == 'E') {
      for (num = 0; num < MyGloab.charE.length; num++) {
        if (num == MyGloab.charE.length - 1) {
          str = str + MyGloab.charE[num] + "') ";
        } else {
          str = str + MyGloab.charE[num] + "' Or" + str2;
        }
      }
      return str;
    }
    if (strVietChar == 'I') {
      for (num = 0; num < MyGloab.charI.length; num++) {
        if (num == MyGloab.charI.length - 1) {
          str = str + MyGloab.charI[num] + "') ";
        } else {
          str = str + MyGloab.charI[num] + "' Or" + str2;
        }
      }
      return str;
    }
    if (strVietChar == 'O') {
      for (num = 0; num < MyGloab.charO.length; num++) {
        if (num == MyGloab.charO.length - 1) {
          str = str + MyGloab.charO[num] + "') ";
        } else {
          str = str + MyGloab.charO[num] + "' Or" + str2;
        }
      }
      return str;
    }
    if (strVietChar == 'U') {
      for (num = 0; num < MyGloab.charU.length; num++) {
        if (num == MyGloab.charU.length - 1) {
          str = str + MyGloab.charU[num] + "') ";
        } else {
          str = str + MyGloab.charU[num] + "' Or" + str2;
        }
      }
      return str;
    }
    if (strVietChar == 'D') {
      for (num = 0; num < MyGloab.charD.length; num++) {
        if (num == MyGloab.charD.length - 1) {
          str = str + MyGloab.charD[num] + "') ";
        } else {
          str = str + MyGloab.charD[num] + "' Or" + str2;
        }
      }
      return str;
    }
    if (strVietChar == 'Y') {
      for (num = 0; num < MyGloab.charY.length; num++) {
        if (num == MyGloab.charY.length - 1) {
          str = str + MyGloab.charY[num] + "') ";
        } else {
          str = str + MyGloab.charY[num] + "' Or" + str2;
        }
      }
    }
    return str;
  }

  public static setFileName(s: string): void {
    MyGloab.filenameLog = s;
  }

  public static InPutLog(LogString: string): void {
    // string path = dbPath + @"\" + filenameLog;
    // try
    // {
    //     if (!File.Exists(path))
    //     {
    //         File.Create(path).Close();
    //     }
    //     FileInfo info = new FileInfo(path);
    //     if (info.length > 0x493e0L)
    //     {
    //         File.Delete(path);
    //     }
    //     string[] strContent = [ LogString };
    //     iniFileUse.WriteArray(path, strContent);
    // }
    // catch
    // {
    // }
    console.log(TAG, LogString);
  }

  public static IsCTMeter(meterSn: string, mType: METERTYPE): bool {
    let flag: bool = false;
    try {
      if (mType != METERTYPE.DTS27_645_07) {
        return false;
      }
      let str: string = meterSn;
      if (meterSn.substring(0, 2) == '00' && meterSn.length == 12) {
        str = meterSn.substring(2);
      }
      if (
        Convert.ToInt32(str.substring(0, 2)) >= 15 &&
        str.length == 10 &&
        (str.substring(2, 2 + 1) == '2' || str.substring(2, 2 + 1) == '4')
      ) {
        flag = true;
      }
    } catch {
      flag = false;
    }
    return flag;
  }

  public static MaxDemandTime(biosString: string): string {
    try {
      let index: int = biosString.indexOf('(');
      let num2: int = biosString.indexOf(')');
      let str: string = biosString.substring(
        index + 1,
        index + 1 + num2 - index - 1,
      );
      if (str.substring(2, 2 + 2) == '00') {
        str = '2015-01-01';
      }
      biosString = biosString.substring(num2 + 1);
      index = biosString.indexOf('(');
      num2 = biosString.indexOf(')');
      let str2: string = biosString.substring(
        index + 1,
        index + 1 + num2 - index - 1,
      );
      return str + ' ' + str2;
    } catch {
      return '2015-01-01 00:00';
    }
  }

  public static ModifyInfoByName(
    Section: string,
    Key: string,
    Value: string,
  ): void {
    /*
        try
        {
            XmlNode node = xmlDoc.DocumentElement();
            xmlDoc.SelectSingleNode(node.Name()).SelectSingleNode(Section).SelectSingleNode(Key).InnerText(Value);
            xmlDoc.Save(dbPath + @"\xmlFile.xml");
        }
        catch
        {
        }
        */
  }

  public static GetMeterType(
    meterSn: string,
    bOpenDB: bool,
    refFindInRange: { bFindInRange: bool },
  ): METERTYPE {
    refFindInRange.bFindInRange = false;
    try {
      Convert.ToInt64(meterSn);
    } catch {
      return METERTYPE.CPC_DTO1P;
    }
    let bHave: bool = false;
    const objRef: any = {};
    let meterTypeOfAddress: METERTYPE = MyGloab.GetMeterTypeOfAddress(
      meterSn,
      objRef,
    );
    bHave = objRef.bHave;

    console.log('bHave in Range:', bHave);

    if (!bHave) {
      if (meterSn.length >= 10) {
        let meterNo: string = meterSn;
        if (meterSn.substring(0, 2) == '00' && meterSn.length == 12) {
          meterNo = meterSn.substring(2);
        }
        if (Convert.ToInt32(meterNo.substring(0, 2)) < 15) {
          return METERTYPE.DTS27_645;
        }

        return MyGloab.NewRuleMeterType(meterNo);
      }
      if (meterSn.length <= 8) {
        let num: int = Convert.ToInt32(meterSn.substring(0, 4), 0x10);
        if (num >= 0x1431 && num < 0x2999) {
          return METERTYPE.MESH_RF;
        }
      }
      return METERTYPE.PTP_RF;
    }

    refFindInRange.bFindInRange = true;
    return meterTypeOfAddress;
  }

  public static NewRuleMeterType(meterNo: string): METERTYPE {
    let metertype: METERTYPE = METERTYPE.DTS27_645_07;
    switch (meterNo.substring(3, 3 + 1)) {
      case '0':
        return METERTYPE.PTP_RF;

      case '1':
        return METERTYPE.DTS27_645;

      case '2':
        if (!(meterNo.substring(2, 2 + 1) == '3')) {
          if (Convert.ToInt32(meterNo.substring(0, 2)) < 0x11) {
            return METERTYPE.MESH_RF;
          }
          return METERTYPE.MESH_RF_180;
        }
        return METERTYPE.DTS27_645_07;

      case '3':
        if (!(meterNo.substring(2, 2 + 1) == '3')) {
          if (Convert.ToInt32(meterNo.substring(0, 2)) < 0x11) {
            return METERTYPE.MESH_RF;
          }
          return METERTYPE.MESH_RF_180;
        }
        if (Convert.ToInt32(meterNo.substring(0, 2)) >= 0x11) {
          return METERTYPE.MESH_RF_180;
        }
        return METERTYPE.DTS27_X329;

      case '4':
        return METERTYPE.DTS27_VN31;

      case '5':
        return METERTYPE.DTS27_645_07;

      case '6':
        return METERTYPE.MESH_RF_180;
    }
    return metertype;
  }

  public static Open_SpComm() {
    //spComm.SPCommOpen();
  }

  public static Reverse2String(sValue: string): string {
    let str: string = '';
    let num: int = sValue.length / 2 - 1;
    for (let i = num; i >= 0; i--) {
      str = str + sValue.substring(i * 2, i * 2 + 2);
    }
    return str;
  }

  public static strCS_Moi(str: string): string {
    if (MyGloab.gbHavePoint) {
      return str;
    }
    let num: int = Convert.ToDecimal(str) + 0.001;
    return num.toString();
  }

  public static VietNamCondition(strField: string, strValue: string): string {
    let str: string = '';
    let list: string[] = MyGloab.ChangeEn2Vietnam(strValue);
    for (let i = 0; i < list.length; i++) {
      if (i == list.length - 1) {
        str = str + strField + " Like '%" + list[i] + "%'";
      } else {
        str = str + strField + " Like '%" + list[i] + "%' Or ";
      }
    }
    return str;
  }

  private static WriteSystemLog(itemName: string, logString: string) {
    MyGloab.InPutLog(itemName + ' ' + logString);
  }
}
