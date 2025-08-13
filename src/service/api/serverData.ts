import axios from 'axios';

import { PropsCommonResponse } from '.';
import { store } from '../../screen/login/controller';
import { PropsInfoMeterEntity } from '../../database/entity';
import { toLocaleDateString } from '../../util';
import { InfoMeterRepository, checkTabelDBIfExist } from '../../database/repository';
import { WriteLog } from '../../shared/file';
import xml2js, { parseString } from 'react-native-xml2js';
import { PropsStorageDLHN } from '../storage/storageDLHN';
import { uniqueId } from 'lodash';
import { isValidDate } from '../hhu/aps/util';

const TAG = 'ServerData:';

export type AXIOS_ERROR_TYPE = {
  message: string;
  name: 'AxiosError';
  stack: string;
  config: {
    data: string;
  };
  code: string;
  status: number;
  response?: {
    data: string;
  };
};

const api = '';
export const dateReleaseApi = '16042021';
export const endPoints = {
  login : '/api/Login',
  getMeterAccount : '/api/GetMeterAccount',
  loginNPC: '/api/GCS/Login',
  getDataNPC: '/api/GCS/GetData_HES',
  pushDataNPC: '/api/GCS/UploadFile_InputMeter',

  loginDLHN: '/auth/mobile/login',
  getDataDLHN: '/bochiso/lichgcs/lich-ghi-chi-so-duoc-phan-cong',
  pushDataDLHN: '/bochiso/chiso/review',

  //https://apistt.evnhanoi.com.vn/HHUService.asmx/GetMaSoGCSOfDoiHHU?MA_DOI=02&MA_DVIQLY=PD0700
  soapLayMaSo: '/HHUService.asmx/GetMaSoGCSOfDoiHHU',
  //DataSet ReadXMLToHHU(int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS, string MA_TO)
  soapGetData: '/HHUService.asmx/ReadXMLToHHU',
  //string WriteXMLFromHHU(Dataset ds, int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS)
  soapPushData: '/HHUService.asmx?op=WriteXMLFromHHU',

  // //https://apistt.evnhanoi.com.vn/HHUService.asmx/GetMaSoGCSOfDoiHHU?MA_DOI=02&MA_DVIQLY=PD0700
  // soapLayMaSoCMIS: '/HHUService.asmx/getSoHHCService', //getSoHHCService GetMaSoGCSOfDoiHHU
  // //DataSet ReadXMLToHHU(int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS, string MA_TO)
  // soapGetDataCMIS: '/HHUService.asmx/ReadHHCServiceDCN', //ReadHHCServiceDCN //ReadXMLToHHU
  // //string WriteXMLFromHHU(Dataset ds, int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS)
  // soapPushDataCMIS: '/HHUService.asmx/WriteHHCServiceDCN', // WriteHHCServiceDCN WriteXMLFromHHU

  //   ServiceInterface-Interface-context-root/resources/serviceInterface/getSoHHCService
  // ServiceInterface-Interface-context-root/resources/serviceInterface/ReadHHCServiceDCN
  // ServiceInterface-Interface-context-root/resources/serviceInterface/WriteHHCServiceDCN
  soapLayMaSoCMIS_Old:
    '/ServiceInterface-Interface-context-root/resources/serviceInterface/getSoHHCService', //getSoHHCService GetMaSoGCSOfDoiHHU
  //
  soapLayMaSoCMIS:
    '/ServiceInterface-Interface-context-root/resources/serviceInterface/GCS_LaySoHHC_ThayDoiNgayGCS', //getSoHHCService GetMaSoGCSOfDoiHHU
  //
  soapGetDataCMIS:
    '/ServiceInterface-Interface-context-root/resources/serviceInterface/ReadHHCServiceDCN', //ReadHHCServiceDCN //ReadXMLToHHU
  //
  soapPushDataCMIS:
    '/ServiceInterface-Interface-context-root/resources/serviceInterface/WriteHHCServiceDCN', // WriteHHCServiceDCN WriteXMLFromHHU
};

function getUrl(endPoint: string): string {
  let url = '';
  const host = store.state.appSetting.server.host.trim();
  const port = store.state.appSetting.server.port.trim();
  if (host.includes('http')) {
  } else {
    url += 'http://';
  }
  url += host;
  if (port.length > 0) {
    url += ':' + port;
  }
  url += api;
  url += endPoint;

  //   const url = `${store?.state.appSetting.server.host}` + api + endPoint;
  //console.log('url:', url);

  return url;
}

type PropsLogin = {
  userName: string;
  password: string;
};
type PropsGetMeterAccount= {
  userID: string;
  token: string;
};
/// NPC

export type PropsLoginServerNPCReturn = {
  RESULT: boolean;
  BUSSINESSID: string;
  CAM: number;
  MIN: number;
  MAX: number;
  Key: string;
  REASON: null | string;
};

export const loginNPC = async (
  props: PropsLogin,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getUrl(endPoints.loginNPC);
    const dataPush = {
      USERNAME: props.userName,
      PASSWORD: props.password,
      IMEI: props.imei,
      sTypeUserName: 'CS',
      NGAYPHATHANH: dateReleaseApi,
    };
    const { data }: { data: string } = await axios.post(url, dataPush);
    console.log('url:', url);
    console.log('dataPush:', dataPush);

    const retLogin = data as unknown as PropsLoginServerNPCReturn[];
    if (retLogin.length > 0) {
      const infoUser = retLogin[0];
      console.log('infoUser:', infoUser);

      ret.obj = infoUser as PropsLoginServerNPCReturn;

      ret.bSucceed = true;
    }
    console.log('retLogin:', retLogin);
  } catch (err: any) {
    ret.strMessage = err.message;
    console.log('err:', err);
  }

  return ret;
};

export async function getDataFromServerNPC(): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getUrl(endPoints.getDataNPC);
    const { data }: { data: string } = await axios.post(url, {
      USERNAME: store.state.NPCUser.moreInfoUser.userName,
      PASSWORD: store.state.NPCUser.moreInfoUser.passWord,
      IMEI: store.state.NPCUser.moreInfoUser.imeiDevice,
      sTypeUserName: 'CS',
      Key: store.state.NPCUser.user.Key,
    });
    // console.log('data........:', data);

    if (data === 'Không có dữ liệu') {
      ret.obj = false;
      ret.strMessage = 'Không có dữ liệu';
      return ret;
    }

    const retGetData = JSON.parse(
      data,
    ) as unknown as PropsDataServerNPCReturn[];
    ret.obj = retGetData;

    // for (let i in retGetData[0]) {
    //   console.log('i:', i);
    // }

    // console.log('data:', retGetData[0]);
    console.log('type data:', retGetData.length);

    ret.bSucceed = true;
  } catch (err: any) {
    ret.strMessage = err.message;
  }

  return ret;
}

export type PropsDataServerNPCReturn = {
  MA_DVIQLY: string;
  ID_CHISO: number;
  BOCSO_ID: number;
  MA_DDO: string;
  LOAI_BCS: string;
  HSN: number;
  MA_CTO: string;
  SERY_CTO: string;
  KY: number;
  THANG: number;
  NAM: number;
  CS_CU: number;
  CS_MOI: number;
  SL_MOI: number;
  SL_THAO: number;
  SL_TTIEP: number;
  LOAI_CS: string;
  TTR_MOI: null;
  NGAY_DKY: string;
  NGAY_CKY: string;
  SLUONG_1: number;
  SLUONG_2: number;
  SLUONG_3: number;
  MA_KHANG: string;
  NGAY_TAO: string;
  NGUOI_TAO: string;
  NGAY_SUA: string;
  NGUOI_SUA: string;
  MA_CNANG: string;
  MA_NVIEN: string;
  MA_SOGCS: string;
  TRANGTHAI: string;
  ISUP: string;
  TT_TREO_THAO: null;
  CHUOI_GIA: string;
  GHICHU: string;
  ISCHECK: string;
  IMEI: null;
  TEN_KHANG: string;
  DIA_CHI: string;
  MA_GC: string;
  MA_TRAM: string;
  KIMUA_CSPK: number;
  MA_COT: string;
  NGUOI_GCS: string;
  SO_HOM: string;
  SO_HO: number;
  TENFILE: string;
  MA_NN: null;
  ISXOA: null;
  TIENTAMTINH: number;
  THUEVAT: number;
  SL_CU: null;
  KINHDO: number;
  VIDO: number;
  IS_IN: string;
  PMAX: number;
  NGAY_PMAX: null | string;
  MA_TRAM_BK: null;
  DOISOAT: null;
  DATKHONGDAT: null;
  NGAYDOISOAT: null;
  CHISOTAM: number;
  SANLUONGTAM: number;
  ISDOXA: number;
  TINHTRANGDOXA: null;
  MA_QUYEN: string;
  STTBCS: string;
  NGAY_MOI: string;
  NGAY_CU: string;
  NGAY_CKY1: string;
  T_CHECK: string;
  NGAY_TTHANG: string;
  NGAY_DKY_GCS: string;
  TLE_THUE: string;
  TEN_DVIQLY: string;
  DIEN_THOAI: string;
  T_APGIA: string;
  NGUOI_GCS1: string;
  MA_QLY_CHA: string;
  QHE_PK: number;
  NOI_THU: null;
  NGAY_THUTIEN: null;
  IS_DUP: number;
  MA_NGIA_CU: null;
  TEN_LYDO: null;
  PMAX1: number;
};

type PropsPushDataServerNPCReturn = {
  STATUS: boolean;
  REASON: null | string;
};
type PropsPushDataServerDLHNReturn = {
  data: boolean;
  message: string;
  statusCode: number;
};

export async function pushDataToServerNPC(
  props: PropsInfoMeterEntity,
): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };
  console.log('seri:', props.SERY_CTO);
  console.log('props.ngayPmax:', props.NGAY_PMAX);
  console.log('item:', props);

  let datePmax: Date | null = new Date(props.NGAY_PMAX);
  if (isValidDate(datePmax) === false) {
    datePmax = null;
  }

  const datePmaxStr =
    datePmax === null
      ? null
      : props.NGAY_PMAX === '1970-01-01T00:00:00' ||
        props.NGAY_PMAX?.includes('NaN')
      ? null
      : toLocaleDateString(datePmax);

  let messageLog: string = '';

  try {
    const url = getUrl(endPoints.pushDataNPC);

    console.log('url:', url);

    const dataPush = {
      ManageUnitID: store.state.NPCUser.user.BUSSINESSID, // MÃ ĐƠN VỊ
      Month: props.THANG,
      Year: props.NAM,
      Period: props.KY, //KỲ
      IndicatorSetType: props.LOAI_BCS, //LOẠI BỘ CHỈ SỐ
      BookSetID: props.BOCSO_ID, //BocSO_id
      MeasuringPointID: props.MA_DDO, //MÃ ĐIỂM ĐO
      NewIndex: props.CS_MOI, //CS_MOI
      NoteLeft: 'GELEX', //GHICHU: IFC, HƯUHONG…
      NewConsumption: props.SL_MOI, //SL_MOI
      MeterHangingStatus: '0', //TT_TREO_THAO
      Latitude: props.latitude === 'undefined' ? '0' : props.latitude, // DẠNG SỐ
      Longitude: props.longtitude === 'undefined' ? '0' : props.longtitude, // DẠNG SỐ
      PMAX: props.PMAX, // DẠNG SỐ
      NGAY_PMAX: datePmaxStr, // DẠNG NGÀY
      sTypeUserName: 'CS',
      Key: store.state.NPCUser.user.Key,
    };

    try {
      const dataLog = { ...dataPush };
      //@ts-expect-error
      dataLog.Key = undefined;
      //@ts-expect-error
      dataLog.sTypeUserName = undefined;
      //@ts-expect-error
      dataLog.NoteLeft = undefined;

      try {
        messageLog += '\r\n' + JSON.stringify(dataLog);
      } catch {}
    } catch (err: any) {
      console.log(TAG, 'err: ', err.message);
    }

    // '\r\n'

    const { data }: { data: string } = await axios.post(url, dataPush);

    const retPushDatas = data as unknown as PropsPushDataServerNPCReturn[];

    const retPushData = retPushDatas[0];

    console.log('data:', dataPush);

    // for (let i in retGetData[0]) {
    //   console.log('i:', i);
    // }

    console.log('retPushData:', retPushData);

    try {
      messageLog += '\r\n' + JSON.stringify(retPushData);
    } catch (err: any) {
      console.log(TAG, 'err: ', err.message);
    }

    if (retPushData.STATUS === true) {
      ret.bSucceed = true;
    } else {
      ret.strMessage = retPushData.REASON ?? '';
    }
  } catch (err: any) {
    ret.strMessage = err.message ?? '';
    try {
      messageLog += '\r\n' + ret.strMessage;
    } catch {}
  }

  try {
    await WriteLog('Push Data NPC', messageLog);
  } catch (err: any) {
    console.log(TAG, 'err: ', err.message);
  }

  return ret;
}

// ĐL Hà Nội

export type PropsLoginServerDLHNReturn = {
  data: string;
  message: null | string;
  statusCode: number;
};
export type PropsLoginReturn = {
  data: string;
  message: null | string;
  statusCode: number;
};
export const loginDLHN = async (
  props: PropsLogin,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  try {
    const url = getUrl(endPoints.loginDLHN);

    const dataPush = {
      userName: props.userName,
      password: props.password,
      deviceId: props.imei,
      firebaseRegistrationKey: '',
      timezoneOffset: -420,
    };

    const { data }: { data: string } = await axios.post(url, dataPush);
    console.log('url:', url);
    console.log('dataPush:', dataPush);
    //console.log('data:', data);
    const retLogin = data as unknown as PropsLoginServerDLHNReturn;
    ret.bSucceed = true;
    ret.obj = retLogin;
  } catch (err: any) {
    if (err.message) {
      const strErr = err.message as string;
      if (strErr.includes('status code 400')) {
        ret.strMessage = 'Thông tin đăng nhập không chính xác: code 400';
      } else {
        ret.strMessage = err.message;
      }
    }
  }

  return ret;
};
export const login = async (
  props: PropsLogin,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  console.log("✅ Đã vào hàm login");

  try {
    const url = getUrl(endPoints.login); // VD: http://14.225.244.63:8088/api/Login
    console.log('🌐 URL:', url);

    const params = {
      UserAccount: props.userName,
      Password: props.password,
    };

    const { data } = await axios.get(url, { params });
    store.setState(state => {
      state.DLHNUser.moreInfoUser.token = data.TOKEN;
      state.DLHNUser.moreInfoUser.userId = data.USER_ID;
      return { ...state };
    });
    console.log('📥 Response data:', data);

    // Kiểm tra mã phản hồi từ server
    if (data.CODE === "1") {
      ret.bSucceed = true;
      ret.obj = data; // Hoặc ép kiểu nếu cần: data as PropsLoginServerDLHNReturn
    } else {
      ret.strMessage = data.MESSAGE || 'Đăng nhập không thành công';
    }
  } catch (err: any) {
    console.log('❌ Error:', err);
    if (err.message) {
      const strErr = err.message as string;
      if (strErr.includes('status code 400')) {
        ret.strMessage = 'Thông tin đăng nhập không chính xác (400)';
      } else {
        ret.strMessage = err.message;
      }
    } else {
      ret.strMessage = 'Đã xảy ra lỗi khi kết nối tới server';
    }
  }

  return ret;
};
export const GetMeterAccount = async (
  props: PropsGetMeterAccount,
): Promise<PropsCommonResponse> => {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };


  try {
    const url = getUrl(endPoints.getMeterAccount);
    console.log('🌐 URL:', url);

    const params = {
      UserID: props.userID,
      Token: props.token,
    };

    const { data } = await axios.get(url, { params });
    console.log('📥 Response data get Meter:', url, params);
    console.log('📥 Response data get Meter:', data);
    
    // Đảm bảo table đã tồn tại
    await checkTabelDBIfExist();
    
    // Lưu từng phần tử vào DB
    if (Array.isArray(data)) {
      for (const item of data) {
        // Bổ sung ID nếu cần (ví dụ dùng METER_NO làm id)
        const itemWithId = {
          ...item,
          id: item.METER_NO ?? item.MODULE_NO ?? Date.now().toString(),
        };
    
        const success = await InfoMeterRepository.save(itemWithId);
        if (!success) {
          console.log('❌ Lưu thất bại cho item:', itemWithId);
        }
      }
    } else {
      console.log('❌ Dữ liệu không đúng định dạng mảng:', data);
    }
    
    console.log (checkTabelDBIfExist())
  } catch (err: any) {
    console.log('❌ Error:', err);
  
  }

  return ret;
};

export async function pushDataToServerDLHN(
  props: PropsInfoMeterEntity,
): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };
  console.log('props.ngayPmax:', props.NGAY_PMAX);
  console.log('props.hasImage:', props.hasImage);

  const ngayGio = toLocaleDateString(new Date(props.NGAY_MOI));
  const ngayPmax = toLocaleDateString(new Date(props.NGAY_PMAX));

  let image: string | null = null;
  if (props.hasImage === '1') {
    image = await InfoMeterRepository.getImage(props.SERY_CTO, props.LOAI_BCS);
  }

  let messageLog: string = '';

  const dataPush = {
    id: props.id,
    trangThaiMoi: null, //props.THANG,
    chiSoMoi: Number(props.CS_MOI),
    chuoiGia: props.CHUOI_GIA,
    maCongTo: props.MA_CTO,
    maDiemDo: props.MA_DDO,
    ngayGio: ngayGio,
    anhGCS: image ?? null,
    pmax: Number(props.PMAX),
    sanLuongMoi: Number(props.SL_MOI),
    ngayPmax: ngayPmax,
    x: props.latitude !== '' ? props.latitude : null,
    y: props.longtitude !== '' ? props.longtitude : null,
  };

  try {
    const dataLog = { ...dataPush };
    //@ts-expect-error
    dataLog.anhGCS = undefined;
    messageLog += '\r\n' + JSON.stringify(dataLog);
  } catch (err: any) {
    console.log(TAG, 'err: ', err.message);
  }
  // console.log('dataPush:', dataPush);

  console.log('messageLog:', messageLog);

  try {
    const url = getUrl(endPoints.pushDataDLHN);
    console.log('url:', url);
    // console.log(
    //   'store.state.DLHNUser.moreInfoUser.token:',
    //   store.state.DLHNUser.moreInfoUser.token,
    // );

    const { data }: { data: string } = await axios.post(url, dataPush, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${store.state.DLHNUser.moreInfoUser.token}`,
      },
    });

    const retPushData = data as unknown as PropsPushDataServerDLHNReturn;

    try {
      messageLog += '\r\n' + JSON.stringify(retPushData);
    } catch (err: any) {
      console.log(TAG, 'err: ', err.message);
    }

    if (retPushData.data === true) {
      ret.bSucceed = true;
    } else {
      ret.strMessage = retPushData.message ?? '';
      messageLog += '\r\n' + ret.strMessage;
    }
  } catch (err: any) {
    ret.strMessage = err.message ?? '';
    messageLog += '\r\n' + ret.strMessage;
    console.error('err response data:', err.response.data);
    // console.log('err:', JSON.stringify(err));
  }

  try {
    await WriteLog('push Data DLHN', messageLog);
  } catch (err: any) {
    console.log(TAG, 'err: ', err.message);
  }

  return ret;
}

export type PropsDSBieuDLHNServerReturn = {
  id: string;
  maCot?: string;
  maTram: string;
  maCongTo: string;
  seriCongTo: string;
  loaiCongTo: string;
  maDiemDo: string;
  maGhiChu: string;
  chuoiGia: string;
  soCuaSo: number;
  soPha: number;
  ky: number;
  thang: number;
  nam: number;
  ngayCu: string;
  ngayMoi: string;
  maKhachHang: string;
  tenKhachHang: string;
  diaChi: string;
  chiSoCu: number;
  chiSoMoi?: number;
  soLuongCu: number;
  soLuongMoi?: number;
  sanLuongThao: number;
  sanLuongTrucTiep: number;
  heSoNhan: number;
  pmax: number;
  ngayPmax: string;
  sanLuong1: number;
  loaiBCS: string;
  anhGCS?: string; // link http:??
  x?: number;
  y?: number;
  hienThiMTB: boolean;
};

export type PropsBookDetailDLHNServerReturn = {
  stt: number;
  id: string;
  donViId: string;
  toDoiId: string;
  maSoGCS: string;
  tenSoGCS: string;
  ky: number;
  thang: number;
  nam: number;
  ngayGhi: string;
  thangNam: string;
  hinhThuc: string;
  status: string;
  ngayCuoiKy: string;
  doXa: number;
  slkh: number;
  danhSachBieu: PropsDSBieuDLHNServerReturn[];
  totalRows: 0;
};

export type PropsGetBookListDLHNServerReturn = {
  data: PropsBookDetailDLHNServerReturn[];
  paging: {
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
  };
  statusCode: number;
};

type PropsGetDataDLHN = {
  pageSize: number;
  pageIndex: number;
};

const dummyGetBookList: PropsGetBookListDLHNServerReturn = {
  data: [
    {
      stt: 0,
      id: '54817435-6236-49c5-8e93-de31112e1a36',
      donViId: '9c670ccf-0bf6-4ed0-8df9-648a3b75e1d0',
      toDoiId: '7f2122c7-f302-44dd-936e-e9c3c05cd6d5',
      maSoGCS: 'PD2101811',
      tenSoGCS: 'TBA TĐC Vân Xa',
      ky: 1,
      thang: 9,
      nam: 2023,
      ngayGhi: '20',
      thangNam: '20 - 9 - 2023',
      hinhThuc: 'MDMS',
      status: 'UNCHECK',
      ngayCuoiKy: '2023-09-20T00:00:00',
      doXa: 189,
      slkh: 0,
      danhSachBieu: [
        {
          id: '35b18dec-8956-4c6e-a894-094453394111',
          maCot: 'Cột 3 Lộ A13',
          maTram: 'PD2180181',
          maCongTo: '1032021210110085722',
          seriCongTo: '210110085722',
          loaiCongTo: 'OVE-A002 10(80)A,230V',
          maDiemDo: 'PD21007859162001',
          maGhiChu: '543',
          chuoiGia: 'KT: 100%*SHBT-A',
          soCuaSo: 8,
          soPha: 1,
          ky: 1,
          thang: 9,
          nam: 2023,
          ngayCu: '2023-09-13T00:00:00',
          ngayMoi: '2023-09-20T00:00:00',
          maKhachHang: 'PD21007859162',
          tenKhachHang: 'Phương Tiến Dũng',
          diaChi:
            'Cột 3 Lộ A13 TBA TĐC Vân Xa, Thôn La Thiện, Xã Tản Hồng, Huyện BV, TPHN',
          chiSoCu: 0,
          soLuongCu: 0,
          sanLuongThao: 0,
          sanLuongTrucTiep: 0,
          heSoNhan: 1,
          pmax: 0,
          ngayPmax: '1900-01-01T00:00:00',
          sanLuong1: 0,
          loaiBCS: 'KT',
          hienThiMTB: true,
        },
      ],
      totalRows: 0,
    },
  ],
  paging: {
    totalCount: 5,
    pageIndex: 1,
    pageSize: 999,
    totalPages: 1,
  },
  statusCode: 200,
};

export async function getDataFromServerDLHN(
  props: PropsGetDataDLHN,
): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  try {
    const url = getUrl(endPoints.getDataDLHN);
    const { data }: { data: string } = await axios.get(url, {
      params: {
        PageSize: props.pageSize,
        PageIndex: props.pageIndex,
      },
      headers: {
        Authorization: `Bearer ${store.state.DLHNUser.moreInfoUser.token}`,
      },
    });
    console.log('url........:', url);
    console.log('url........:', {
      PageSize: props.pageSize,
      PageIndex: props.pageIndex,
    });

    const objServerReturn = data as unknown as PropsGetBookListDLHNServerReturn;

    console.log('objServerGetListBookReturn:', objServerReturn);

    ret.bSucceed = true;
    ret.obj = objServerReturn;
    // console.warn('test heser');
    // ret.obj = dummyGetBookList;

    //ret.bSucceed = true;
  } catch (err: any) {
    ret.strMessage = err.message;
  }

  return ret;
}

// soap DLHN

type PropsSoapGetMaSoFromServerDLHN = {
  maDoi: string;
  maDonviQuanly: string;
};

export type PropsGetMaSoReturn = {
  MA_SOGCS: string;
  KY: string;
  THANG: string;
  NAM: string;
};

type XMLJsonGetMaSoReturn = {
  $: {
    xmlns: 'http://tempuri.org/';
  };
  'xs:schema': [
    {
      $: {
        id: 'NewDataSet';
        xmlns: '';
        'xmlns:xs': 'http://www.w3.org/2001/XMLSchema';
        'xmlns:msdata': 'urn:schemas-microsoft-com:xml-msdata';
      };
      'xs:element': [
        {
          $: {
            name: 'NewDataSet';
            'msdata:IsDataSet': 'true';
            'msdata:UseCurrentLocale': 'true';
          };
          'xs:complexType': [
            {
              'xs:choice': [
                {
                  $: {
                    minOccurs: '0';
                    maxOccurs: 'unbounded';
                  };
                  'xs:element': [
                    {
                      $: {
                        name: 'Table';
                      };
                      'xs:complexType': [
                        {
                          'xs:sequence': [
                            {
                              'xs:element': [
                                {
                                  $: {
                                    name: 'MA_SOGCS';
                                    type: 'xs:string';
                                    minOccurs: '0';
                                  };
                                },
                                {
                                  $: {
                                    name: 'KY';
                                    type: 'xs:string';
                                    minOccurs: '0';
                                  };
                                },
                                {
                                  $: {
                                    name: 'THANG';
                                    type: 'xs:string';
                                    minOccurs: '0';
                                  };
                                },
                                {
                                  $: {
                                    name: 'NAM';
                                    type: 'xs:string';
                                    minOccurs: '0';
                                  };
                                },
                              ];
                            },
                          ];
                        },
                      ];
                    },
                  ];
                },
              ];
            },
          ];
        },
      ];
    },
  ];
  'diffgr:diffgram': [
    {
      $: {
        'xmlns:msdata': 'urn:schemas-microsoft-com:xml-msdata';
        'xmlns:diffgr': 'urn:schemas-microsoft-com:xml-diffgram-v1';
      };
      NewDataSet: [
        {
          $: {
            xmlns: '';
          };
          Table: {
            $: {
              'diffgr:id': string;
              'msdata:rowOrder': string;
              'diffgr:hasChanges': 'inserted';
            };
            MA_SOGCS: [string];
            KY: [string];
            THANG: [string];
            NAM: [string];
          }[];
        },
      ];
    },
  ];
};

export async function soapGetMaSoFromServerDLHN(
  props: PropsSoapGetMaSoFromServerDLHN,
): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  try {
    ////https://apistt.evnhanoi.com.vn/HHUService.asmx/GetMaSoGCSOfDoiHHU?MA_DOI=02&MA_DVIQLY=PD0700
    let url: string = '';

    url = getUrl(endPoints.soapLayMaSo);

    const dataPush = {
      MA_DOI: props.maDoi,
      MA_DVIQLY: props.maDonviQuanly,
    };

    console.log('url........:', url);
    console.log('dataPush........:', dataPush);

    const { data }: { data: string } = await axios.get(url, {
      params: dataPush,
    });

    const objServerReturn = data as unknown as string;
    // console.log('objServerReturn.bSucceed:', objServerReturn);

    if (true) {
      const strXml = objServerReturn;
      try {
        let xmlJSONFromString: XMLJsonGetMaSoReturn | null = await new Promise(
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
        // console.log('xmlFromString:', JSON.stringify(xmlJSONFromString));
        if (xmlJSONFromString === null) {
          // return ret;
        } else {
          const arrSo =
            xmlJSONFromString['diffgr:diffgram'][0].NewDataSet[0].Table;
          const objReturn: PropsGetMaSoReturn[] = [];
          if (arrSo) {
            for (let item of arrSo) {
              objReturn.push({
                MA_SOGCS: item.MA_SOGCS[0],
                KY: item.KY[0],
                THANG: item.THANG[0],
                NAM: item.NAM[0],
              });
            }
          } else {
            //ret.strMessage = 'Không có dữ liệu';
            try {
              messageLog += '\r\n' + '\n' + 'Không có dữ liệu';
            } catch {}
          }
          ret.obj = objReturn;
          ret.bSucceed = true;
        }
      } catch (err: any) {
        console.log(TAG, err.message);
        try {
          messageLog += '\r\n' + err.message;
        } catch {}
      }
    }
  } catch (err: any) {
    ret.strMessage = err.message;
    try {
      messageLog += '\r\n' + err.message;
    } catch {}
  }

  await WriteLog('Get ma so SOAP DLHN:', messageLog);

  return ret;
}

type XMLJSONGetData = {
  $: any;
  'xs:schema': any;
  'diffgr:diffgram': [
    {
      $: any;
      NewDataSet: [
        {
          $: {
            xmlns: '';
          };
          Table1: {
            $: {
              'diffgr:id': 'Table11';
              'msdata:rowOrder': '0';
            };
            ID: [string];
            MA_NVGCS: [string];
            MA_KHANG: [string];
            MA_DDO: [string];
            MA_DVIQLY: [string];
            MA_GC: [string];
            MA_QUYEN: [string];
            MA_TRAM: [string];
            BOCSO_ID: [string];
            LOAI_BCS: [string];
            LOAI_CS: [string];
            TEN_KHANG: [string];
            DIA_CHI: [string];
            MA_NN: [string];
            SO_HO: [string];
            MA_CTO: [string];
            SERY_CTO: [string];
            HSN: [string];
            CS_CU: [string];
            TTR_CU: [string];
            SL_CU: [string];
            SL_TTIEP: [string];
            NGAY_CU: [string];
            CS_MOI: [string];
            TTR_MOI: [string];
            SL_MOI: [string];
            CHUOI_GIA: [string];
            KY: [string];
            THANG: [string];
            NAM: [string];
            NGAY_MOI: [string];
            NGUOI_GCS: [string];
            SL_THAO: [string];
            KIMUA_CSPK: [string];
            MA_COT: [string];
            SLUONG_1: [string];
            SLUONG_2: [string];
            SLUONG_3: [string];
            SO_HOM: [string];
            PMAX: [string];
            NGAY_PMAX: [string];
            GHICHU: [string];
            TT_KHAC: [string];
            CGPVTHD: [string];
            HTHUC_TBAO_DK: [string];
            DTHOAI_SMS: [string];
            EMAIL: [string];
            THOI_GIAN: [string];
            X: [string];
            Y: [string];
            SO_TIEN: [string];
            HTHUC_TBAO_TH: [string];
            TENKHANG_RUTGON: [string];
            TTHAI_DBO: [string];
            DU_PHONG: [string];
            TEN_FILE: [string];
            STR_CHECK_DSOAT: [string];
            SUM_MA_DDO: [string];
          }[];
        },
      ];
    },
  ];
};

type XMLJSONGetDataCMIS = {
  'xs:schema': [
    {
      $: any;
      'xs:element': any;
    },
  ];
  Table1: {
    MA_NVGCS: [string];
    MA_KHANG: [string];
    MA_DDO: [string];
    MA_DVIQLY: [string];
    MA_GC: [string];
    MA_QUYEN: [string];
    MA_TRAM: [string];
    BOCSO_ID: [string];
    LOAI_BCS: [string];
    LOAI_CS: [string];
    TEN_KHANG: [string];
    DIA_CHI: [string];
    MA_NN: [string];
    SO_HO: [string];
    MA_CTO: [string];
    SERY_CTO: [string];
    HSN: [string];
    CS_CU: [string];
    TTR_CU: [string];
    SL_CU: [string];
    SL_TTIEP: [string];
    NGAY_CU: [string];
    CS_MOI: [string];
    TTR_MOI: [string];
    SL_MOI: [string];
    CHUOI_GIA: [string];
    KY: [string];
    THANG: [string];
    NAM: [string];
    NGAY_MOI: [string];
    NGUOI_GCS: [string];
    SL_THAO: [string];
    KIMUA_CSPK: [string];
    MA_COT: [string];
    SLUONG_1: [string];
    SLUONG_2: [string];
    SLUONG_3: [string];
    SO_HOM: [string];
    GIA_TRI_1: [string];
    GIA_TRI_2: [string];
    GIA_TRI_3: [string];
    PMAX: [string];
    NGAY_PMAX: [string];
    X: [string];
    Y: [string];
    Z: [string];
  }[];
};

export type SOAP_DANH_SACH_BIEU_DLHN_TYPE = {
  ID: string;
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
  GHICHU: string;
  TT_KHAC: string;
  CGPVTHD: string;
  HTHUC_TBAO_DK: string;
  DTHOAI_SMS: string;
  EMAIL: string;
  THOI_GIAN: string;
  X: string;
  Y: string;
  SO_TIEN: string;
  HTHUC_TBAO_TH: string;
  TENKHANG_RUTGON: string;
  TTHAI_DBO: string;
  DU_PHONG: string;
  TEN_FILE: string;
  STR_CHECK_DSOAT: string;
  SUM_MA_DDO: string;
};

export async function soapGetDataFromServerDLHN(props: {
  ky: string;
  thang: string;
  nam: string;
  maSoGCS: string;
  maDonviQuanly: string;
  maDoi: string;
}): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  try {
    //DataSet ReadXMLToHHU(int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS, string MA_TO)
    let url: string = '';
    // if (store.state.appSetting.isCMISDLHN) {
    //   url = getUrl(endPoints.soapGetDataCMIS);
    // } else {
    //   url = getUrl(endPoints.soapGetData);
    // }

    url = getUrl(endPoints.soapGetData);

    const dataPush = {
      KY: props.ky,
      THANG: props.thang,
      NAM: props.nam,
      MA_DVIQLY: props.maDonviQuanly,
      MA_SOGCS: props.maSoGCS,
      MA_TO: props.maDoi,
    };
    const { data }: { data: string } = await axios.get(url, {
      params: dataPush,
    });
    console.log('url........:', url);
    console.log('dataPush........:', dataPush);

    const objServerReturn = data as unknown as string;
    // console.log('objServerReturn.bSucceed:', objServerReturn);

    if (true) {
      const strXml = objServerReturn;

      try {
        let xmlJSONFromString: XMLJSONGetData | null = await new Promise(
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

        //console.log('xmlFromString:', JSON.stringify(xmlJSONFromString));
        if (xmlJSONFromString === null) {
          // return ret;
        } else {
          const arrSo =
            xmlJSONFromString['diffgr:diffgram'][0].NewDataSet[0].Table1;
          const objReturn: SOAP_DANH_SACH_BIEU_DLHN_TYPE[] = [];
          for (let item of arrSo) {
            objReturn.push({
              ID: item.ID[0],
              MA_NVGCS: item.MA_NVGCS[0],
              MA_KHANG: item.MA_KHANG[0],
              MA_DDO: item.MA_DDO[0],
              MA_DVIQLY: item.MA_DVIQLY[0],
              MA_GC: item.MA_GC[0],
              MA_QUYEN: item.MA_QUYEN[0],
              MA_TRAM: item.MA_TRAM[0],
              BOCSO_ID: item.BOCSO_ID[0],
              LOAI_BCS: item.LOAI_BCS[0],
              LOAI_CS: item.LOAI_CS[0],
              TEN_KHANG: item.TEN_KHANG[0],
              DIA_CHI: item.DIA_CHI[0],
              MA_NN: item.MA_NN[0],
              SO_HO: item.SO_HO[0],
              MA_CTO: item.MA_CTO[0],
              SERY_CTO: item.SERY_CTO[0],
              HSN: item.HSN[0],
              CS_CU: item.CS_CU[0],
              TTR_CU: item.TTR_CU[0],
              SL_CU: item.SL_CU[0],
              SL_TTIEP: item.SL_TTIEP[0],
              NGAY_CU: item.NGAY_CU[0],
              CS_MOI: item.CS_MOI[0],
              TTR_MOI: item.TTR_MOI[0],
              SL_MOI: item.SL_MOI[0],
              CHUOI_GIA: item.CHUOI_GIA[0],
              KY: item.KY[0],
              THANG: item.THANG[0],
              NAM: item.NAM[0],
              NGAY_MOI: item.NGAY_MOI[0],
              NGUOI_GCS: item.NGUOI_GCS[0],
              SL_THAO: item.SL_THAO[0],
              KIMUA_CSPK: item.KIMUA_CSPK[0],
              MA_COT: item.MA_COT[0],
              SLUONG_1: item.SLUONG_1[0],
              SLUONG_2: item.SLUONG_2[0],
              SLUONG_3: item.SLUONG_3[0],
              SO_HOM: item.SO_HOM[0],
              PMAX: item.PMAX[0],
              NGAY_PMAX: item.NGAY_PMAX[0],
              GHICHU: item.GHICHU[0],
              TT_KHAC: item.TT_KHAC[0],
              CGPVTHD: item.CGPVTHD[0],
              HTHUC_TBAO_DK: item.HTHUC_TBAO_DK[0],
              DTHOAI_SMS: item.DTHOAI_SMS[0],
              EMAIL: item.EMAIL[0],
              THOI_GIAN: item.THOI_GIAN[0],
              X: item.X[0],
              Y: item.Y[0],
              SO_TIEN: item.SO_TIEN[0],
              HTHUC_TBAO_TH: item.HTHUC_TBAO_TH[0],
              TENKHANG_RUTGON: item.TENKHANG_RUTGON[0],
              TTHAI_DBO: item.TTHAI_DBO[0],
              DU_PHONG: item.DU_PHONG[0],
              TEN_FILE: item.TEN_FILE[0],
              STR_CHECK_DSOAT: item.STR_CHECK_DSOAT[0],
              SUM_MA_DDO: item.SUM_MA_DDO[0],
            });
          }
          ret.obj = objReturn;
          ret.bSucceed = true;

          try {
            messageLog += '\r\n' + 'so diem do: ' + objReturn.length;
          } catch {}
        }
      } catch (err: any) {
        console.log(TAG, err.message);
        try {
          messageLog += '\r\n' + err.message;
        } catch {}
      }
    }
  } catch (err: any) {
    ret.strMessage = err.message;
    try {
      messageLog += '\r\n' + err.message;
    } catch {}
  }

  await WriteLog('Get Data SOAP DLHN:', messageLog);

  return ret;
}

export type PropsSoapGetMaSoAndDataDLHNReturn = {
  soGCS: PropsGetMaSoReturn;
  danhSachBieu: SOAP_DANH_SACH_BIEU_DLHN_TYPE[];
};

export async function SoapGetMaSoAndDataFromDLHN(props: {
  maDonvi: string;
  maDoi: string;
}): Promise<PropsCommonResponse> {
  let rest = await soapGetMaSoFromServerDLHN({
    maDoi: props.maDoi,
    maDonviQuanly: props.maDonvi,
  });

  if (rest.bSucceed) {
    const listMaso = rest.obj as PropsGetMaSoReturn[];

    console.log('listMaso:', listMaso);

    const objReturn: PropsSoapGetMaSoAndDataDLHNReturn[] = [];

    for (let maSoObj of listMaso) {
      const obj: PropsSoapGetMaSoAndDataDLHNReturn = {
        soGCS: maSoObj,
        danhSachBieu: [],
      };
      rest = await soapGetDataFromServerDLHN({
        ky: maSoObj.KY,
        thang: maSoObj.THANG,
        nam: maSoObj.NAM,
        maSoGCS: maSoObj.MA_SOGCS,
        maDonviQuanly: props.maDonvi,
        maDoi: props.maDoi,
      });
      if (rest.bSucceed) {
        const danhSachBieu = rest.obj as SOAP_DANH_SACH_BIEU_DLHN_TYPE[];
        obj.danhSachBieu = danhSachBieu;
      } else {
        rest.strMessage = 'Có lỗi khi lây danh sách biểu ' + rest.strMessage;
        return rest;
      }
      objReturn.push(obj);
    }
    rest.bSucceed = true;
    rest.obj = objReturn;
  } else {
    return rest;
  }
  return rest;
}

export async function SoapPushDataFromDLHN(props: {
  xml: string;
  storageDLHN: PropsStorageDLHN;
}): Promise<PropsCommonResponse> {
  let messageError = '';
  //string WriteXMLFromHHU(Dataset ds, int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS)

  const rest: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  let url: string = '';

  url = getUrl(endPoints.soapPushData);

  console.log('url........:', url);
  console.log('storageDLHN........:', props.storageDLHN);

  try {
    messageLog += '\r\n' + JSON.stringify(props.storageDLHN);
  } catch {}

  const finalXML = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <soap:Body>
          <WriteXMLFromHHU xmlns="http://tempuri.org/">
            ${props.xml} 
            <KY>${props.storageDLHN.ky}</KY>
            <THANG>${props.storageDLHN.thang}</THANG>
            <NAM>${props.storageDLHN.nam}</NAM>
            <MA_DVIQLY>${props.storageDLHN.maDonvi}</MA_DVIQLY>
            <MA_SOGCS>${props.storageDLHN.maSoGCS}</MA_SOGCS>
        </WriteXMLFromHHU>
    </soap:Body>
</soap:Envelope>
  `;

  // strXML += endHeadXml;

  // console.log('finalXMl:', finalXML);
  // console.log('props.xml:', props.xml);

  try {
    const { data }: { data: string } = await axios.post(url, finalXML, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });

    try {
      messageLog += '\r\n' + JSON.stringify(data);
    } catch {}

    if (data.includes('Thành công')) {
      rest.bSucceed = true;
    } else {
      const searchString = '<WriteXMLFromHHUResult>';

      if (data.includes(searchString)) {
        const strError: string = data;
        const startIndex = strError.indexOf(searchString);
        const endIndex = strError.indexOf('</WriteXMLFromHHUResult>');
        const strMessage = strError.substring(
          startIndex + searchString.length,
          endIndex,
        );
        messageError += strMessage;
      } else {
        console.log('dataReturn........:', data);
        messageError += data;
      }
      rest.strMessage += messageError;
    }
  } catch (err: any) {
    const error: AXIOS_ERROR_TYPE = err;

    messageError += error.message + '\r\n';

    // console.log('err:' , JSON.stringify(error));
    if (error.response) {
      const strError: string = error.response.data;

      if (strError.includes('<faultstring>')) {
        const startIndex = strError.indexOf('<faultstring>');
        const endIndex = strError.indexOf('</faultstring>');
        const strMessage = strError.substring(startIndex, endIndex);

        messageError += strMessage;
      }
      rest.strMessage += messageError;
    }

    try {
      messageLog += '\r\n' + messageError;
    } catch {}
  }

  await WriteLog('Push Data SOAP DLHN:', messageLog);

  return rest;
}
//////////////////////////////////////////////////// CMIS

type PropsGetMaSoFromServerDLHNCMIS = {
  MA_DVIQLY: string;
  KY: string;
  THANG: string;
  NAM: string;
};

export async function soapGetMaSoFromServerDLHNCMIS(
  props: PropsGetMaSoFromServerDLHNCMIS,
): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  try {
    ////https://apistt.evnhanoi.com.vn/HHUService.asmx/GetMaSoGCSOfDoiHHU?MA_DOI=02&MA_DVIQLY=PD0700
    let url: string = '';
    let messageError = '';

    // url = getUrl(endPoints.soapLayMaSoCMIS);

    //url = 'http://10.9.195.39:6089/GCS_LaySoHHC_ThayDoiNgayGCS';

    //url = 'http://apikd.evnhanoi.vn/GCS_LaySoHHC_ThayDoiNgayGCS'; //for test 19/01/2024

    //url = 'http://10.9.195.105:6089/GCS_LaySoHHC_ThayDoiNgayGCS'; //for test 19/01/2024

    const host = store.state.appSetting.server.hostLayQuyenCMIS.trim();

    if (host.includes('http')) {
    } else {
      url += 'http://';
    }
    url += host;

    url += '/GCS_LaySoHHC_ThayDoiNgayGCS';

    const dataPush: PropsGetMaSoFromServerDLHNCMIS = props;

    console.log('url........:', url);
    console.log('dataPush........:', dataPush);

    // const { data }: { data: string } = await axios.post(url, dataPush);
    const { data }: { data: string } = await axios.post(url, dataPush, {
      auth: {
        username: 'EVNHANOI',
        password: 'Evnhanoi@123',
      },
    });

    try {
      messageLog += '\r\n' + JSON.stringify(data);
    } catch {}

    const objServerReturn = data as unknown as {
      MESSAGE: string | 'NODATA';
      TYPE: string | 'NODATA';
    };
    console.log('objServerReturn:', objServerReturn);

    if (objServerReturn.MESSAGE) {
      messageError += objServerReturn.MESSAGE + ':' + objServerReturn.TYPE;
      ret.strMessage = messageError;
      return ret;
    }

    const arrSo = data as unknown as {
      suc: boolean;
      msg: string;
      data: string | null;
    };

    if (arrSo.suc) {
      // console.log('xmlFromString:', JSON.stringify(xmlJSONFromString));
      const objReturn: PropsGetMaSoReturn[] = [];

      if (arrSo.data) {
        const dataSo:
          | {
              MA_SOGCS: string;
            }[]
          | undefined = JSON.parse(arrSo.data);

        if (dataSo && dataSo.length) {
          for (let item of dataSo) {
            objReturn.push({
              MA_SOGCS: item.MA_SOGCS,
              KY: props.KY,
              THANG: props.THANG,
              NAM: props.NAM,
            });
          }
        }
      }
      try {
        messageLog += 'objReturn: \r\n' + JSON.stringify(objReturn);
      } catch {}

      ret.obj = objReturn;
      ret.bSucceed = true;
    } else {
      ret.strMessage = arrSo.msg;
      try {
        messageLog += '\r\n' + arrSo.msg;
      } catch {}
    }
  } catch (err: any) {
    ret.strMessage = err.message;
    try {
      messageLog += '\r\n' + err.message;
    } catch {}
  }

  await WriteLog('Get Ma So CMIS:', messageLog);

  return ret;
}
// 1
// MA_DVIQLY
// String
// Mã đơn vị quản lý
// 2
// MA_SOGCS
// String
// Mã sổ ghi chỉ số
// 3
// KY
// String
// Kỳ dữ liệu
// 4
// THANG
// String
// Tháng dữ liệu
// 5
// NAM
// String
// Năm dữ liệu
// 6
// LOAI_CSO
// String
type PropsGetDataFromServerDLHNCMIS = {
  MA_DVIQLY: string;
  MA_SOGCS: string;
  KY: string;
  THANG: string;
  NAM: string;
  LOAI_CSO: LOAI_CSO_CMIS;
};

export type SOAP_DANH_SACH_BIEU_DLHN_TYPE_CMIS = {
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
  GIA_TRI_1: string;
  GIA_TRI_2: string;
  GIA_TRI_3: string;
  PMAX: string;
  NGAY_PMAX: string;
  X: string;
  Y: string;
  Z: string;
};

export async function soapGetDataFromServerDLHNCMIS(
  props: PropsGetDataFromServerDLHNCMIS,
): Promise<PropsCommonResponse> {
  const ret: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  try {
    let url: string = '';
    url = getUrl(endPoints.soapGetDataCMIS);

    const dataPush = props;

    console.log('url........:', url);
    console.log('dataPush........:', dataPush);

    try {
      messageLog += 'dataPush:\r\n' + JSON.stringify(dataPush);
    } catch {}

    const { data }: { data: string } = await axios.post(url, dataPush);

    const objServerReturn = data as unknown as string;
    // console.log('objServerReturn.bSucceed:', objServerReturn);

    if (true) {
      const strXml = objServerReturn;

      // try {
      //   messageLog += '\r\n' + 'objServerReturn: ' + objServerReturn;
      // } catch {}

      try {
        let xmlJSONFromString: XMLJSONGetDataCMIS | null = await new Promise(
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
        // const log = JSON.stringify(xmlJSONFromString);
        // console.log('xmlFromString:', log.substring(0, log.length / 2));
        if (xmlJSONFromString === null) {
          // return ret;
        } else {
          const arrSo = xmlJSONFromString.Table1;
          const objReturn: SOAP_DANH_SACH_BIEU_DLHN_TYPE[] = [];
          for (let item of arrSo) {
            objReturn.push({
              ID: uniqueId(),
              MA_NVGCS: item.MA_NVGCS[0],
              MA_KHANG: item.MA_KHANG[0],
              MA_DDO: item.MA_DDO[0],
              MA_DVIQLY: item.MA_DVIQLY[0],
              MA_GC: item.MA_GC[0],
              MA_QUYEN: item.MA_QUYEN[0],
              MA_TRAM: item.MA_TRAM[0],
              BOCSO_ID: item.BOCSO_ID[0],
              LOAI_BCS: item.LOAI_BCS[0],
              LOAI_CS: item.LOAI_CS[0],
              TEN_KHANG: item.TEN_KHANG[0],
              DIA_CHI: item.DIA_CHI[0],
              MA_NN: item.MA_NN[0],
              SO_HO: item.SO_HO[0],
              MA_CTO: item.MA_CTO[0],
              SERY_CTO: item.SERY_CTO[0],
              HSN: item.HSN[0],
              CS_CU: item.CS_CU[0],
              TTR_CU: item.TTR_CU[0],
              SL_CU: item.SL_CU[0],
              SL_TTIEP: item.SL_TTIEP[0],
              NGAY_CU: item.NGAY_CU[0],
              CS_MOI: item.CS_MOI[0],
              TTR_MOI: item.TTR_MOI[0],
              SL_MOI: item.SL_MOI[0],
              CHUOI_GIA: item.CHUOI_GIA[0],
              KY: item.KY[0],
              THANG: item.THANG[0],
              NAM: item.NAM[0],
              NGAY_MOI: item.NGAY_MOI[0],
              NGUOI_GCS: item.NGUOI_GCS[0],
              SL_THAO: item.SL_THAO[0],
              KIMUA_CSPK: item.KIMUA_CSPK[0],
              MA_COT: item.MA_COT[0],
              SLUONG_1: item.SLUONG_1[0],
              SLUONG_2: item.SLUONG_2[0],
              SLUONG_3: item.SLUONG_3[0],
              SO_HOM: item.SO_HOM[0],
              PMAX: item.PMAX[0],
              NGAY_PMAX: item.NGAY_PMAX[0],
              GHICHU: '',
              TT_KHAC: '',
              CGPVTHD: '',
              HTHUC_TBAO_DK: '',
              DTHOAI_SMS: '',
              EMAIL: '',
              THOI_GIAN: '',
              X: item.X[0],
              Y: item.Y[0],
              SO_TIEN: '',
              HTHUC_TBAO_TH: '',
              TENKHANG_RUTGON: '',
              TTHAI_DBO: '',
              DU_PHONG: '',
              TEN_FILE: '',
              STR_CHECK_DSOAT: '',
              SUM_MA_DDO: '',
            });
          }
          ret.obj = objReturn;
          ret.bSucceed = true;

          try {
            messageLog += '\r\n' + 'get succeed: length: ' + objReturn.length;
          } catch {}
        }
      } catch (err: any) {
        console.log(TAG, err.message);
        try {
          messageLog += '\r\n' + 'get error: : ' + err.message;
        } catch {}
      }
    }
  } catch (err: any) {
    ret.strMessage = err.message;
    try {
      messageLog += '\r\n' + 'get error: ' + err.message;
    } catch {}
  }

  await WriteLog('Get Data CMIS:', messageLog);

  return ret;
}

// 1
// MA_DVIQLY
// String
// Mã đơn vị quản lý
// 2
// MA_SOGCS
// String
// Mã sổ ghi chỉ số
// 3
// KY
// String
// Kỳ dữ liệu
// 4
// THANG
// String
// Tháng dữ liệu
// 5
// NAM
// String
// Năm dữ liệu
// 6
// LOAI_CSO
// String
// Loại chỉ số cần lấy file
// 7
// XML_HHC
// String
// XM

export type LOAI_CSO_CMIS = 'DDK' | 'CSC';

type PropsPushDataToDLHNCMIS = {
  MA_DVIQLY: string;
  MA_SOGCS: string;
  KY: string;
  THANG: string;
  NAM: string;
  LOAI_CSO: LOAI_CSO_CMIS;
  XML_HHC: string;
};

export async function SoapPushDataFromDLHNCMIS(props: {
  xml: string;
  storageDLHN: PropsStorageDLHN;
}): Promise<PropsCommonResponse> {
  let messageError = '';
  //string WriteXMLFromHHU(Dataset ds, int KY, int THANG, int NAM, string MA_DVIQLY, string MA_SOGCS)

  const rest: PropsCommonResponse = {
    bSucceed: false,
    obj: undefined,
    strMessage: '',
  };

  let messageLog: string = '';

  let url: string = '';

  url = getUrl(endPoints.soapPushDataCMIS);

  console.log('url........:', url);
  console.log('storageDLHN........:', props.storageDLHN);

  try {
    messageLog += '\r\n' + JSON.stringify(props.storageDLHN);
  } catch {}

  const dataPush: PropsPushDataToDLHNCMIS = {
    MA_DVIQLY: props.storageDLHN.maDonvi,
    MA_SOGCS: props.storageDLHN.maSoGCS,
    KY: props.storageDLHN.ky,
    THANG: props.storageDLHN.thang,
    NAM: props.storageDLHN.nam,
    LOAI_CSO: 'CSC',
    XML_HHC: props.xml,
  };

  try {
    const { data }: { data: string } = await axios.post(url, dataPush);

    console.log('data Push CMIS:', data);

    try {
      messageLog += '\r\n' + JSON.stringify(data);
    } catch {}

    if (data.includes('CAP NHAT THANH CONG')) {
      rest.bSucceed = true;
    } else {
      messageError += data;
      rest.strMessage += messageError;
    }
  } catch (err: any) {
    const error: AXIOS_ERROR_TYPE = err;

    messageError += error.message + '\r\n';

    // console.log('err:' , JSON.stringify(error));
    if (error.response) {
      const strError: string = error.response.data;

      if (strError.includes('<faultstring>')) {
        const startIndex = strError.indexOf('<faultstring>');
        const endIndex = strError.indexOf('</faultstring>');
        const strMessage = strError.substring(startIndex, endIndex);

        messageError += strMessage;
      }
      rest.strMessage += messageError;
    }

    try {
      messageLog += '\r\n' + messageError;
    } catch {}
  }

  await WriteLog('Push Data CMIS:', messageLog);

  return rest;
}

export async function GetMaSoAndDataFromDLHNCMIS(props: {
  maDonvi: string;
  ky: string;
  thang: string;
  nam: string;
  loaiCS: LOAI_CSO_CMIS;
}): Promise<PropsCommonResponse> {
  // console.log('abc');

  let rest = await soapGetMaSoFromServerDLHNCMIS({
    MA_DVIQLY: props.maDonvi,
    KY: props.ky,
    THANG: props.thang,
    NAM: props.nam,
  });

  if (rest.bSucceed) {
    const listMaso = rest.obj as PropsGetMaSoReturn[];
    // console.log('listMaso:', listMaso);
    const objReturn: PropsSoapGetMaSoAndDataDLHNReturn[] = [];
    for (let maSoObj of listMaso) {
      const obj: PropsSoapGetMaSoAndDataDLHNReturn = {
        soGCS: maSoObj,
        danhSachBieu: [],
      };
      rest = await soapGetDataFromServerDLHNCMIS({
        MA_DVIQLY: props.maDonvi,
        MA_SOGCS: maSoObj.MA_SOGCS,
        KY: maSoObj.KY,
        THANG: maSoObj.THANG,
        NAM: maSoObj.NAM,
        LOAI_CSO: 'CSC',
      });
      if (rest.bSucceed) {
        const danhSachBieu = rest.obj as SOAP_DANH_SACH_BIEU_DLHN_TYPE[];
        obj.danhSachBieu = danhSachBieu;
      } else {
        rest.strMessage = 'Có lỗi khi lây danh sách biểu ' + rest.strMessage;
        console.log('rest.strMessage:', rest.strMessage);

        obj.danhSachBieu = [];
        //return rest;
      }
      objReturn.push(obj);
    }
    rest.bSucceed = true;
    rest.obj = objReturn;
  } else {
    return rest;
  }
  return rest;
}
