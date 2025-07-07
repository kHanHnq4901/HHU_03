import { uniqueId } from 'lodash';
import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import xml2js, { parseString } from 'react-native-xml2js';
import { PropDataBookDLHN } from '../component/bookServer';
import { PropsKHCMISEntity, dumyEntity } from '../database/entity';
import { KHCMISRepository, deleteDataDB } from '../database/repository';
import { PropsDataServerNPCReturn } from '../service/api/serverData';
import {
  TYPE_READ_RF,
  getLabelAndIsManyPriceByCodeMeter,
  getTypeMeterBySerial,
} from '../service/hhu/defineEM';
import { LoginModeType,  savePathImport } from '../service/storage/index';
import { showAlert, showSnack, showToast } from '../util';
import {
  PropsCreateXML,
  PropsXmlModel,
  PropsXmlReturnFromFile,
  dummyXML,
  endHeadXml,
  startHeadXml,
} from './index';
import { UpdateVersionToCurrentDb } from '../database/service/matchSeriVersionService';
import { writeXmlFile } from '../shared/file';
import { PATH_EXPORT_XML } from '../shared/path';
import { CMISKHServices } from '../database/service';

const TAG = 'UTIL_XML';

export function convertXmlTabelToRowCmis(
  tabel: Partial<PropsXmlModel>,
  index: number,
  mode: LoginModeType,
  idFile: string
): PropsKHCMISEntity {
  const row = {} as PropsKHCMISEntity;
  try {
  for (let i in dumyEntity) {
    //@ts-expect-error
    row[i] = tabel[i];
    if (i === 'MA_TRAM' || i === 'MA_QUYEN' || i === 'MA_COT') {
      if (row[i]?.length === 0) {
        row[i] = ' ';
      }
    }
  }

  //index++;
  row.TT = index;

  // const labelAndManyPrice = getLabelAndIsManyPriceByCodeMeter(
  //   row.MA_CTO,
  //   row.SERY_CTO,
  // );
  // console.log ('labelAndManyPrice' + labelAndManyPrice)
  const verMeter = getTypeMeterBySerial(row.SERY_CTO );
  row.RF = verMeter;

  row.id = tabel.ID ?? row.SERY_CTO + row.LOAI_BCS + row.RF;
  row.GhiChu = '';
  row.LoaiDoc = TYPE_READ_RF.HAVE_NOT_READ;
  row.loginMode = mode;
  row.isSent = '0';
  row.image = '';
  row.hasImage = '0';
  row.idFile = idFile;
}catch(err : any){
  console.log(err) ;
}
  return row;
}
type PropsResponseUpdateByXml = {
  succeed: boolean;
  totalSucceed: number;
};
export const updateDbByXml = async (
  strXml: string,
  writeAll: boolean,
  idFile: string
): Promise<PropsResponseUpdateByXml> => {
  const ret: PropsResponseUpdateByXml = {
    succeed: false,
    totalSucceed: 0,
  };
  try {
    let xmlFromString: PropsXmlReturnFromFile | null = await new Promise(
      (resolve, reject) => {
        parseString(
          strXml,
          {
            explicitArray: true,
            explicitRoot: false,
          },
          function (err: any, result: any) {
            //console.log(JSON.stringify(result.Table1));

            if (!err) {
              //console.log('result:', result);
              resolve(result);
            } else {
              //console.log('err:', err);
              resolve(null);
            }
          },
        );
      },
    );
    if (xmlFromString === null) {
      return ret;
    }
    let acceptAll = writeAll;
    // console.log('xmlFromString.Table1:', xmlFromString.Table1);

    showSnack('Đang cập nhật dữ liệu ...');
    let index = 0;
    let ok = false;
    for (let tabel of xmlFromString.Table1) {
      if (acceptAll === true) {
        ok = true;
      } else {
        if (Number(tabel.CS_MOI) === 0) {
          ok = true;
        } else {
          ok = false;
        }
      }

      if (ok) {
        index++;
        const row = convertXmlTabelToRowCmis(tabel, index, 'KH Lẻ', idFile);
        // console.warn('test here');
        // if (tabel.CS_MOI && tabel.CS_MOI !== '0') {
        //   row.LoaiDoc = TYPE_READ_RF.READ_SUCCEED;
        // }
        const succeed = await KHCMISRepository.save(row);
        if (succeed === false) {
          await new Promise(resolve => {
            Alert.alert('Lỗi', 'Nhập file lỗi', [
              {
                text: 'OK',
                onPress: () => resolve(true),
              },
            ]);
          });
          ret.succeed = false;
          return ret;
        }
      }
      //console.log(TAG, 'succeed save:', succeed);
    }

    ret.succeed = true;
    ret.totalSucceed = xmlFromString?.Table1.length ?? 0;

    return ret;
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  return ret;
};

export const exportDB2Xml = async (idFile?: string): Promise<string | null> => {
  // var obj = { name: 'Super', Surname: 'Man', age: 23 };

  // var bd = new xml2js.Builder();
  // var xml = bd.buildObject(obj);

  // //console.log('xml:', xml);

  const listTabel: PropsXmlReturnFromFile = {
    Table1: [],
  };

  const dataDB = await KHCMISRepository.findAll();
  if (dataDB.length === 0) {
    return null;
  }
  for (let row of dataDB) {

  
    if(idFile && row.idFile !== idFile)
    {
      continue;
    }

    const modelXml = {} as PropsXmlModel;
    for (let i in dummyXML) {
      let dataRow;
      //console.log('i:', i);

      if (i === 'NGAY_CU' || i === 'NGAY_MOI' || i === 'NGAY_PMAX') {
        if (row[i] && row[i].length >= 19) {
          dataRow = row[i].replace(' ', 'T');
          //console.log('dataRow:', dataRow);
        } else {
          dataRow = row[i];
        }
      } else if (i === 'MA_TRAM' || i === 'MA_QUYEN' || i === 'MA_COT') {
        if (row[i] && row[i] === ' ') {
          dataRow = '';
          //console.log('dataRow:', dataRow);
        } else {
          dataRow = row[i];
        }
      } else {
        //@ts-expect-error
        dataRow = row[i];
      }
      //@ts-expect-error
      modelXml[i] = dataRow;
    }
    // if (modelXml.SERY_CTO === '17306890' && modelXml.LOAI_BCS === 'SG') {
    //   console.log('test here 1 :', modelXml);

    //   // console.log('isGetOnlyInteger:', isGetOnlyInteger);
    //   // console.log('isGetOnlyInteger:', isGetOnlyInteger);
    // }
    listTabel.Table1.push(modelXml);

  }
  let builder = new xml2js.Builder();
  let strXML = startHeadXml;
  for (let tabel of listTabel.Table1) {
    const tb = {} as PropsCreateXML;
    tb.Table1 = tabel;
    let str: string = builder.buildObject(tb);
    str = str.replace(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '',
    );
    strXML += str;
  }
  strXML += endHeadXml;

  return strXML;
};

export const importXmlFromPath = async (paths: string[], startBusyFunc?:()=>void, endBusyFunc?:()=>void) => {
  const ok = await new Promise(resolve => {
    Alert.alert(
      'Xóa dữ liệu cũ và Nhập mới',
      'Dữ liệu cũ sẽ bị xóa ? \r\n\nBạn có thể xuất dữ liệu xml trước khi thực hiện thao tác này',
      [
        {
          text: 'Hủy',
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: 'OK',

          onPress: async () => {
            await deleteDataDB();
            resolve(true);
          },
        },
      ],
    );
  });

  if (ok) {
    try {
      showSnack('Đang chuẩn bị dữ liệu ...');
      let updateOk = true;
      let url: string = '';
      let fileName: string = '';
      let index = 0;
      //const objPath : PropsObjPathImport = {};

      const writeALl: boolean = await new Promise(resolve => {
        Alert.alert(
          'Ghi toàn bộ XML ?',
          'Bạn có muốn ghi cả dữ liệu đã được ghi thành công không ?',
          [
            {
              text: 'Ghi toàn bộ',
              style: 'default',
              onPress: () => {
                resolve(true);
              },
            },
            {
              text: 'Ghi điểm thiếu',
              style: 'default',
              onPress: () => {
                resolve(false);
              },
            },
          ],
        );
      });

      let totalSucceed = 0;

      try{

        if(startBusyFunc)
          {
            startBusyFunc();
          }

        for (let path of paths) {
          index++;
          const lastIndexSlash = path.lastIndexOf('/') + 1;
          if (url == '') {
            url = path.substring(0, lastIndexSlash);
          }
          let stockName = path.substring(lastIndexSlash);
          console.log('url: ' + url);
          console.log('stockName: ' + stockName);
          
          fileName += stockName;
  
          fileName = fileName.replace('.xml', index === paths.length ? '' : '_');
  
          const xmlText = await RNFS.readFile(path);
  
          const uid = stockName;
  
          const rest = await updateDbByXml(xmlText, writeALl, uid);
  
          if (rest.succeed === true) {
            totalSucceed += rest.totalSucceed;
            
            // objPath[uid] = {
            //   id: uid,
            //   path: path,
            // };
          } else {
            updateOk = false;
          }
        }

      }catch(err : any){
        showAlert("Error: " + String(err.message));
      }
      finally{
        if(endBusyFunc)
          {
            endBusyFunc();
          }
      }

     
      if (updateOk) {
        
      
        const finalPath = url + fileName;
        // console.log('objPath:', objPath);
        // await saveObjPathImport(objPath);
        await savePathImport(finalPath);
        showAlert('Nhập thành công ' + totalSucceed + ' BCS');
        //await UpdateVersionToCurrentDb();
      } else {
        showAlert('Lỗi');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', 'Nhập dữ liệu thất bại: ' + err.message);
    }
  }
};
export const importDbFromServer = async () => {};

export function convertDataServerToDataTabelNPC(
  data: PropsDataServerNPCReturn[],
): Partial<PropsXmlModel>[] {
  const ret: Partial<PropsXmlModel>[] = [];

  for (let item of data) {
    const itm: PropsXmlModel = {
      MA_NVGCS: item.MA_NVIEN,
      MA_KHANG: item.MA_KHANG,
      MA_DDO: item.MA_DDO,
      MA_DVIQLY: item.MA_DVIQLY,
      MA_GC: item.MA_GC,
      MA_QUYEN: item.MA_QUYEN,
      MA_TRAM: item.MA_TRAM,
      BOCSO_ID: item.BOCSO_ID?.toString() || '',
      LOAI_BCS: item.LOAI_BCS,
      LOAI_CS: item.LOAI_CS,
      TEN_KHANG: item.TEN_KHANG,
      DIA_CHI: item.DIA_CHI,
      MA_NN: item.MA_NN ?? '',
      SO_HO: item.SO_HO?.toString() || '',
      MA_CTO: item.MA_CTO,
      SERY_CTO: item.SERY_CTO,
      HSN: item.HSN?.toString() || '',
      CS_CU: item.CS_CU?.toString() || '',
      TTR_CU: item.TTR_MOI ?? '',
      SL_CU: item.SL_CU ?? '0',
      SL_TTIEP: item.SL_TTIEP?.toString() || '',
      NGAY_CU: item.NGAY_CU,
      CS_MOI: item.CS_MOI?.toString() || '',
      TTR_MOI: item.TTR_MOI ?? '',
      SL_MOI: item.SL_MOI?.toString() || '',
      CHUOI_GIA: item.CHUOI_GIA,
      KY: item.KY?.toString() || '',
      THANG: item.THANG?.toString() || '',
      NAM: item.NAM?.toString() || '',
      NGAY_MOI: item.NGAY_MOI,
      NGUOI_GCS: item.NGUOI_GCS,
      SL_THAO: item.SL_THAO?.toString() || '',
      KIMUA_CSPK: item.KIMUA_CSPK?.toString() || '',
      MA_COT: item.MA_COT,
      SLUONG_1: item.SLUONG_1?.toString() || '',
      SLUONG_2: item.SLUONG_2?.toString() || '',
      SLUONG_3: item.SLUONG_3?.toString() || '',
      SO_HOM: item.SO_HOM,
      PMAX: item.PMAX?.toString() || '',
      NGAY_PMAX: item.NGAY_PMAX ?? '1970-01-01T00:00:00',
      X: '',
      Y: '',
      Z: '',
    };
    ret.push(itm);
  }

  return ret;
}


export function convertDataServerToDataTabelDLHN(
  books: PropDataBookDLHN[],
): Partial<PropsXmlModel>[] {
  const ret: Partial<PropsXmlModel>[] = [];

  for (let book of books) {
    if (book.checked) {
      for (let diemDo of book.data.danhSachBieu) {
        const itm: PropsXmlModel = {
          MA_NVGCS: diemDo.MA_NVGCS,
          MA_KHANG: diemDo.MA_KHANG,
          MA_DDO: diemDo.MA_DDO,
          MA_DVIQLY: diemDo.MA_DVIQLY,
          MA_GC: diemDo.MA_GC,
          MA_QUYEN: diemDo.MA_QUYEN,
          MA_TRAM: diemDo.MA_TRAM,
          BOCSO_ID: diemDo.BOCSO_ID,
          LOAI_BCS: diemDo.LOAI_BCS,
          LOAI_CS: diemDo.LOAI_CS,
          TEN_KHANG: diemDo.TEN_KHANG,
          DIA_CHI: diemDo.DIA_CHI,
          MA_NN: diemDo.MA_NN,
          SO_HO: diemDo.SO_HO,
          MA_CTO: diemDo.MA_CTO,
          SERY_CTO: diemDo.SERY_CTO,
          HSN: diemDo.HSN,
          CS_CU: diemDo.CS_CU,
          TTR_CU: diemDo.TTR_CU,
          SL_CU: diemDo.SL_CU,
          SL_TTIEP: diemDo.SL_TTIEP,
          NGAY_CU: diemDo.NGAY_CU,
          CS_MOI: diemDo.CS_MOI,
          TTR_MOI: diemDo.TTR_MOI,
          SL_MOI: diemDo.SL_MOI,
          CHUOI_GIA: diemDo.CHUOI_GIA,
          KY: diemDo.KY,
          THANG: diemDo.THANG,
          NAM: diemDo.NAM,
          NGAY_MOI: diemDo.NGAY_MOI,
          NGUOI_GCS: diemDo.NGUOI_GCS,
          SL_THAO: diemDo.SL_THAO,
          KIMUA_CSPK: diemDo.KIMUA_CSPK,
          MA_COT: diemDo.MA_COT,
          SLUONG_1: diemDo.SLUONG_1,
          SLUONG_2: diemDo.SLUONG_2,
          SLUONG_3: diemDo.SLUONG_3,
          SO_HOM: diemDo.SO_HOM,
          PMAX: diemDo.PMAX,
          NGAY_PMAX: diemDo.NGAY_PMAX,
          X: diemDo.X,
          Y: diemDo.Y,
          Z: '',
          ID: diemDo.ID,
        };
        // if (diemDo.hienThiMTB !== true) {
        //   continue;
        // }
        // const itm: PropsXmlModel = {
        //   MA_NVGCS: '',
        //   MA_KHANG: diemDo.maKhachHang,
        //   MA_DDO: diemDo.maDiemDo,
        //   MA_DVIQLY: '',
        //   MA_GC: '',
        //   MA_QUYEN: ' ',
        //   MA_TRAM: diemDo.maTram,
        //   BOCSO_ID: '',
        //   LOAI_BCS: diemDo.loaiBCS,
        //   LOAI_CS: '',
        //   TEN_KHANG: diemDo.tenKhachHang,
        //   DIA_CHI: diemDo.diaChi,
        //   MA_NN: '',
        //   SO_HO: '',
        //   MA_CTO: diemDo.maCongTo,
        //   SERY_CTO: diemDo.seriCongTo,
        //   HSN: diemDo.heSoNhan.toString(),
        //   CS_CU: diemDo.chiSoCu.toString(),
        //   TTR_CU: '',
        //   SL_CU: diemDo.soLuongCu.toString() ?? '0',
        //   SL_TTIEP: diemDo.sanLuongTrucTiep.toString(),
        //   NGAY_CU: diemDo.ngayCu,
        //   CS_MOI: diemDo.chiSoMoi ? diemDo.chiSoMoi.toString() : '0',
        //   TTR_MOI: '',
        //   SL_MOI: diemDo.soLuongMoi ? diemDo.soLuongMoi.toString() : '',
        //   CHUOI_GIA: diemDo.chuoiGia,
        //   KY: diemDo.ky.toString(),
        //   THANG: diemDo.thang.toString(),
        //   NAM: diemDo.nam.toString(),
        //   NGAY_MOI: diemDo.ngayMoi,
        //   NGUOI_GCS: '',
        //   SL_THAO: diemDo.sanLuongThao.toString(),
        //   KIMUA_CSPK: '',
        //   MA_COT: diemDo.maCot ?? '',
        //   SLUONG_1: diemDo.sanLuong1.toString(),
        //   SLUONG_2: '0',
        //   SLUONG_3: '0',
        //   SO_HOM: '',
        //   PMAX: diemDo.pmax.toString(),
        //   NGAY_PMAX: diemDo.ngayPmax,
        //   X: '',
        //   Y: '',
        //   Z: '',
        //   id: diemDo.id,
        // };
        ret.push(itm);
      }
    }
  }

  return ret;
}


export const createXmlFile = async () : Promise<number> => {


    const listIdFile = await CMISKHServices.findUniqueValuesInColumn(
    {
      idColumn: 'idFile',
    }
   );

   console.log('list ID FILE:',listIdFile );
  
  let numFileCreateSuccess = 0;

  
  for(let fileName of listIdFile)
  {
    const idFile = fileName;
    const path = PATH_EXPORT_XML + '/' + fileName
    const strXML = await exportDB2Xml(idFile);
    if (strXML) {
      
      const result = await writeXmlFile( path, strXML);
      if (result) {
        numFileCreateSuccess ++;
        console.log('crete xml succeed');
      } else {
        console.log('crete xml failed');
      }
    }

  }

console.log('numFileCreateSuccess:', numFileCreateSuccess);

  return numFileCreateSuccess;

  
  //console.log('strXML:', strXML);
};