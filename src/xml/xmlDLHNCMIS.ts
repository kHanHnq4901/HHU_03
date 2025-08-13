import { SOAP_DANH_SACH_BIEU_DLHN_TYPE_CMIS } from './../service/api/serverData';
import { PropsXmlReturnFromFile } from '.';
import { InfoMeterRepository } from '../database/repository';
import xml2js, { parseString } from 'react-native-xml2js';
import { PropExportDb2DLHN } from './xmlDLHN';

const startHeadXml = `<?xml version="1.0" encoding="UTF-8"?>
<NewDataSet>
    <xs:schema xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:xs="http://www.w3.org/2001/XMLSchema" id="NewDataSet">
        <xs:element msdata:IsDataSet="true" msdata:UseCurrentLocale="true" name="NewDataSet">
            <xs:complexType>
                <xs:choice maxOccurs="unbounded" minOccurs="0">
                    <xs:element name="Table1">
                        <xs:complexType>
                            <xs:sequence>
                                <xs:element minOccurs="0" name="MA_NVGCS" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_KHANG" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_DDO" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_DVIQLY" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_GC" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_QUYEN" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_TRAM" type="xs:string"/>
                                <xs:element minOccurs="0" name="BOCSO_ID" type="xs:long"/>
                                <xs:element minOccurs="0" name="LOAI_BCS" type="xs:string"/>
                                <xs:element minOccurs="0" name="LOAI_CS" type="xs:string"/>
                                <xs:element minOccurs="0" name="TEN_KHANG" type="xs:string"/>
                                <xs:element minOccurs="0" name="DIA_CHI" type="xs:string"/>
                                <xs:element minOccurs="0" name="MA_NN" type="xs:string"/>
                                <xs:element minOccurs="0" name="SO_HO" type="xs:decimal"/>
                                <xs:element minOccurs="0" name="MA_CTO" type="xs:string"/>
                                <xs:element minOccurs="0" name="SERY_CTO" type="xs:string"/>
                                <xs:element minOccurs="0" name="HSN" type="xs:decimal"/>
                                <xs:element minOccurs="0" name="CS_CU" type="xs:decimal"/>
                                <xs:element minOccurs="0" name="TTR_CU" type="xs:string"/>
                                <xs:element minOccurs="0" name="SL_CU" type="xs:long"/>
                                <xs:element minOccurs="0" name="SL_TTIEP" type="xs:int"/>
                                <xs:element minOccurs="0" msdata:DateTimeMode="Unspecified" name="NGAY_CU" type="xs:dateTime"/>
                                <xs:element minOccurs="0" name="CS_MOI" type="xs:decimal"/>
                                <xs:element minOccurs="0" name="TTR_MOI" type="xs:string"/>
                                <xs:element minOccurs="0" name="SL_MOI" type="xs:decimal"/>
                                <xs:element minOccurs="0" name="CHUOI_GIA" type="xs:string"/>
                                <xs:element minOccurs="0" name="KY" type="xs:int"/>
                                <xs:element minOccurs="0" name="THANG" type="xs:int"/>
                                <xs:element minOccurs="0" name="NAM" type="xs:int"/>
                                <xs:element minOccurs="0" msdata:DateTimeMode="Unspecified" name="NGAY_MOI" type="xs:dateTime"/>
                                <xs:element minOccurs="0" name="NGUOI_GCS" type="xs:string"/>
                                <xs:element minOccurs="0" name="SL_THAO" type="xs:decimal"/>
                                <xs:element minOccurs="0" name="KIMUA_CSPK" type="xs:short"/>
                                <xs:element minOccurs="0" name="MA_COT" type="xs:string"/>
                                <xs:element minOccurs="0" name="SLUONG_1" type="xs:long"/>
                                <xs:element minOccurs="0" name="SLUONG_2" type="xs:long"/>
                                <xs:element minOccurs="0" name="SLUONG_3" type="xs:long"/>
                                <xs:element minOccurs="0" name="SO_HOM" type="xs:string"/>
                                <xs:element minOccurs="0" name="PMAX" type="xs:decimal"/>
                                <xs:element minOccurs="0" msdata:DateTimeMode="Unspecified" name="NGAY_PMAX" type="xs:dateTime"/>
                                <xs:element minOccurs="0" name="X" type="xs:string"/>
                                <xs:element minOccurs="0" name="Y" type="xs:string"/>
                                <xs:element minOccurs="0" name="Z" type="xs:string"/>
                            </xs:sequence>
                        </xs:complexType>
                    </xs:element>
                </xs:choice>
            </xs:complexType>
        </xs:element>
    </xs:schema>`;

const endHeadXml = `
</NewDataSet>`;
export type PropsXmlModelDLHN = SOAP_DANH_SACH_BIEU_DLHN_TYPE_CMIS;

const dummyXML: PropsXmlModelDLHN = {
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
  GIA_TRI_1: '',
  GIA_TRI_2: '',
  GIA_TRI_3: '',
  PMAX: '',
  NGAY_PMAX: '',
  X: '',
  Y: '',
  Z: '',
};

export type PropsXmlReturnFromFileDLHN = {
  Table1: Partial<PropsXmlModelDLHN>[];
};

export type PropsCreateXMLDLHN = {
  Table1: Partial<PropsXmlModelDLHN>;
};

export const exportDB2XmlDLHNCMIS = async (
  props: PropExportDb2DLHN,
): Promise<string | null> => {
  const listTabel: PropsXmlReturnFromFile = {
    Table1: [],
  };

  const dataDB = await InfoMeterRepository.findAll();
  if (dataDB.length === 0) {
    return null;
  }
  for (let row of dataDB) {
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
      GIA_TRI_1: '',
      GIA_TRI_2: '',
      GIA_TRI_3: '',
      PMAX: '',
      NGAY_PMAX: '',
      X: '',
      Y: '',
      Z: '',
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
      } else {
        //@ts-expect-error
        dataRow = row[i];
      }
      dataRow = dataRow === undefined ? '' : dataRow;
      //@ts-expect-error
      modelXml[i] = String(dataRow);
    }
    listTabel.Table1.push(modelXml);

    // console.warn('test here');
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
