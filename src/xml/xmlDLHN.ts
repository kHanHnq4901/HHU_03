import { PropsXmlReturnFromFile } from '.';
import { KHCMISRepository } from '../database/repository';
import { SOAP_DANH_SACH_BIEU_DLHN_TYPE } from '../service/api/serverData';
import xml2js, { parseString } from 'react-native-xml2js';

const startHeadXml = `<DataSet>
<xs:schema id="NewDataSet" xmlns="" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
    <xs:element name="NewDataSet" msdata:IsDataSet="true" msdata:UseCurrentLocale="true">
        <xs:complexType>
            <xs:choice minOccurs="0" maxOccurs="unbounded">
                <xs:element name="Table1">
                    <xs:complexType>
                        <xs:sequence>
                            <xs:element name="ID" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_NVGCS" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_KHANG" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_DDO" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_DVIQLY" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_GC" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_QUYEN" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_TRAM" type="xs:string" minOccurs="0" />
                            <xs:element name="BOCSO_ID" type="xs:string" minOccurs="0" />
                            <xs:element name="LOAI_BCS" type="xs:string" minOccurs="0" />
                            <xs:element name="LOAI_CS" type="xs:string" minOccurs="0" />
                            <xs:element name="TEN_KHANG" type="xs:string" minOccurs="0" />
                            <xs:element name="DIA_CHI" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_NN" type="xs:string" minOccurs="0" />
                            <xs:element name="SO_HO" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_CTO" type="xs:string" minOccurs="0" />
                            <xs:element name="SERY_CTO" type="xs:string" minOccurs="0" />
                            <xs:element name="HSN" type="xs:string" minOccurs="0" />
                            <xs:element name="CS_CU" type="xs:string" minOccurs="0" />
                            <xs:element name="TTR_CU" type="xs:string" minOccurs="0" />
                            <xs:element name="SL_CU" type="xs:string" minOccurs="0" />
                            <xs:element name="SL_TTIEP" type="xs:string" minOccurs="0" />
                            <xs:element name="NGAY_CU" type="xs:string" minOccurs="0" />
                            <xs:element name="CS_MOI" type="xs:string" minOccurs="0" />
                            <xs:element name="TTR_MOI" type="xs:string" minOccurs="0" />
                            <xs:element name="SL_MOI" type="xs:string" minOccurs="0" />
                            <xs:element name="CHUOI_GIA" type="xs:string" minOccurs="0" />
                            <xs:element name="KY" type="xs:string" minOccurs="0" />
                            <xs:element name="THANG" type="xs:string" minOccurs="0" />
                            <xs:element name="NAM" type="xs:string" minOccurs="0" />
                            <xs:element name="NGAY_MOI" type="xs:string" minOccurs="0" />
                            <xs:element name="NGUOI_GCS" type="xs:string" minOccurs="0" />
                            <xs:element name="SL_THAO" type="xs:string" minOccurs="0" />
                            <xs:element name="KIMUA_CSPK" type="xs:string" minOccurs="0" />
                            <xs:element name="MA_COT" type="xs:string" minOccurs="0" />
                            <xs:element name="SLUONG_1" type="xs:string" minOccurs="0" />
                            <xs:element name="SLUONG_2" type="xs:string" minOccurs="0" />
                            <xs:element name="SLUONG_3" type="xs:string" minOccurs="0" />
                            <xs:element name="SO_HOM" type="xs:string" minOccurs="0" />
                            <xs:element name="PMAX" type="xs:string" minOccurs="0" />
                            <xs:element name="NGAY_PMAX" type="xs:string" minOccurs="0" />
                            <xs:element name="GHICHU" type="xs:string" minOccurs="0" />
                            <xs:element name="TT_KHAC" type="xs:string" minOccurs="0" />
                            <xs:element name="CGPVTHD" type="xs:string" minOccurs="0" />
                            <xs:element name="HTHUC_TBAO_DK" type="xs:string" minOccurs="0" />
                            <xs:element name="DTHOAI_SMS" type="xs:string" minOccurs="0" />
                            <xs:element name="EMAIL" type="xs:string" minOccurs="0" />
                            <xs:element name="THOI_GIAN" type="xs:string" minOccurs="0" />
                            <xs:element name="X" type="xs:string" minOccurs="0" />
                            <xs:element name="Y" type="xs:string" minOccurs="0" />
                            <xs:element name="SO_TIEN" type="xs:string" minOccurs="0" />
                            <xs:element name="HTHUC_TBAO_TH" type="xs:string" minOccurs="0" />
                            <xs:element name="TENKHANG_RUTGON" type="xs:string" minOccurs="0" />
                            <xs:element name="TTHAI_DBO" type="xs:string" minOccurs="0" />
                            <xs:element name="DU_PHONG" type="xs:string" minOccurs="0" />
                            <xs:element name="TEN_FILE" type="xs:string" minOccurs="0" />
                            <xs:element name="STR_CHECK_DSOAT" type="xs:string" minOccurs="0" />
                            <xs:element name="SUM_MA_DDO" type="xs:string" minOccurs="0" />
                        </xs:sequence>
                    </xs:complexType>
                </xs:element>
            </xs:choice>
        </xs:complexType>
    </xs:element>
</xs:schema>
<diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1"><NewDataSet xmlns="">`;

const endHeadXml = `
        </NewDataSet>
	</diffgr:diffgram>
</DataSet>`;
export type PropsXmlModelDLHN = SOAP_DANH_SACH_BIEU_DLHN_TYPE;

const dummyXML: PropsXmlModelDLHN = {
  ID: '',
  MA_NVGCS: '',
  MA_KHANG: '',
  MA_DDO: '',
  MA_DVIQLY: '',
  MA_GC: '',
  MA_QUYEN: '',
  MA_TRAM: '',
  BOCSO_ID: '',
  LOAI_BCS: '',
  LOAI_CS: '',
  TEN_KHANG: '',
  DIA_CHI: '',
  MA_NN: '',
  SO_HO: '',
  MA_CTO: '',
  SERY_CTO: '',
  HSN: '',
  CS_CU: '',
  TTR_CU: '',
  SL_CU: '',
  SL_TTIEP: '',
  NGAY_CU: '',
  CS_MOI: '',
  TTR_MOI: '',
  SL_MOI: '',
  CHUOI_GIA: '',
  KY: '',
  THANG: '',
  NAM: '',
  NGAY_MOI: '',
  NGUOI_GCS: '',
  SL_THAO: '',
  KIMUA_CSPK: '',
  MA_COT: '',
  SLUONG_1: '',
  SLUONG_2: '',
  SLUONG_3: '',
  SO_HOM: '',
  PMAX: '',
  NGAY_PMAX: '',
  GHICHU: '',
  TT_KHAC: '',
  CGPVTHD: '',
  HTHUC_TBAO_DK: '',
  DTHOAI_SMS: '',
  EMAIL: '',
  THOI_GIAN: '',
  X: '',
  Y: '',
  SO_TIEN: '',
  HTHUC_TBAO_TH: '',
  TENKHANG_RUTGON: '',
  TTHAI_DBO: '',
  DU_PHONG: '',
  TEN_FILE: '',
  STR_CHECK_DSOAT: '',
  SUM_MA_DDO: '',
};

export type PropsXmlReturnFromFileDLHN = {
  Table1: Partial<PropsXmlModelDLHN>[];
};

export type PropsCreateXMLDLHN = {
  Table1: Partial<PropsXmlModelDLHN>;
};

export type PropExportDb2DLHN = {
  maSo: string;
  ky: string;
  thang: string;
  nam: string;
};

export const exportDB2XmlDLHN = async (
  props: PropExportDb2DLHN,
): Promise<string | null> => {
  const listTabel: PropsXmlReturnFromFile = {
    Table1: [],
  };

  const dataDB = await KHCMISRepository.findAll();
  if (dataDB.length === 0) {
    return null;
  }
  for (let row of dataDB) {
    //console.warn('tét hêr');

    if (row.loginMode !== 'ĐL Hà Nội') {
      continue;
    }
    if (
      row.MA_QUYEN !== props.maSo ||
      row.KY !== props.ky ||
      row.THANG !== props.thang ||
      row.NAM !== props.nam
    ) {
      continue;
    }
    const modelXml: PropsXmlModelDLHN = {
      ID: '',
      MA_NVGCS: '',
      MA_KHANG: '',
      MA_DDO: '',
      MA_DVIQLY: '',
      MA_GC: '',
      MA_QUYEN: '',
      MA_TRAM: '',
      BOCSO_ID: '',
      LOAI_BCS: '',
      LOAI_CS: '',
      TEN_KHANG: '',
      DIA_CHI: '',
      MA_NN: '',
      SO_HO: '',
      MA_CTO: '',
      SERY_CTO: '',
      HSN: '',
      CS_CU: '',
      TTR_CU: '',
      SL_CU: '',
      SL_TTIEP: '',
      NGAY_CU: '',
      CS_MOI: '',
      TTR_MOI: '',
      SL_MOI: '',
      CHUOI_GIA: '',
      KY: '',
      THANG: '',
      NAM: '',
      NGAY_MOI: '',
      NGUOI_GCS: '',
      SL_THAO: '',
      KIMUA_CSPK: '',
      MA_COT: '',
      SLUONG_1: '',
      SLUONG_2: '',
      SLUONG_3: '',
      SO_HOM: '',
      PMAX: '',
      NGAY_PMAX: '',
      GHICHU: '',
      TT_KHAC: '',
      CGPVTHD: '',
      HTHUC_TBAO_DK: '',
      DTHOAI_SMS: '',
      EMAIL: '',
      THOI_GIAN: '',
      X: '',
      Y: '',
      SO_TIEN: '',
      HTHUC_TBAO_TH: '',
      TENKHANG_RUTGON: '',
      TTHAI_DBO: '',
      DU_PHONG: '',
      TEN_FILE: '',
      STR_CHECK_DSOAT: '',
      SUM_MA_DDO: '',
    };
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
      } else if (i === 'ID') {
        dataRow = row.id;
      } else if (i === 'GHICHU') {
        dataRow = row.GhiChu;
      } else {
        //@ts-expect-error
        dataRow = row[i];
      }

      dataRow = dataRow === undefined ? '' : dataRow;
      //@ts-expect-error
      modelXml[i] = String(dataRow);

      // if (row.SERY_CTO === '1632063993' && row.LOAI_BCS === 'SG') {
      //   console.log('xml test:', modelXml);
      // }
    }
    listTabel.Table1.push(modelXml);
    // console.warn('test break here');
    // break;
  }
  let builder = new xml2js.Builder();
  let strXML = startHeadXml;
  for (let tabel of listTabel.Table1) {
    const tb = {} as PropsCreateXMLDLHN;
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
