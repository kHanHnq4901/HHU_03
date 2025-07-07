export const startHeadXml = `<?xml version="1.0" encoding="UTF-8"?><NewDataSet>
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

export const endHeadXml = `
</NewDataSet>`;
export type PropsXmlModel = {
  MA_NVGCS: string;
  MA_KHANG: string;
  MA_DDO: string;
  MA_DVIQLY: string;
  MA_GC: string;
  MA_QUYEN: string;
  MA_TRAM: string;
  BOCSO_ID: string;
  LOAI_BCS: string;
  LOAI_CS: string;
  TEN_KHANG: string;
  DIA_CHI: string;
  MA_NN: string;
  SO_HO: string;
  MA_CTO: string;
  SERY_CTO: string;
  HSN: string;
  CS_CU: string;
  TTR_CU: string;
  SL_CU: string;
  SL_TTIEP: string;
  NGAY_CU: string;
  CS_MOI: string;
  TTR_MOI: string;
  SL_MOI: string;
  CHUOI_GIA: string;
  KY: string;
  THANG: string;
  NAM: string;
  NGAY_MOI: string;
  NGUOI_GCS: string;
  SL_THAO: string;
  KIMUA_CSPK: string;
  MA_COT: string;
  SLUONG_1: string;
  SLUONG_2: string;
  SLUONG_3: string;
  SO_HOM: string;
  PMAX: string;
  NGAY_PMAX: string;
  X: string;
  Y: string;
  Z: string;
  ID?: string;
};

export const dummyXML: PropsXmlModel = {
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
  X: '',
  Y: '',
  Z: '',
};

export type PropsXmlReturnFromFile = {
  Table1: Partial<PropsXmlModel>[];
};

export type PropsCreateXML = {
  Table1: Partial<PropsXmlModel>;
};
