import { PropDataMeter, hookProps, store } from './controller';
import { Alert, EventSubscription, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getDistanceValue } from '../../util/location';
import { buildQueryDataPacket } from '../../service/hhu/aps/hhuAps';
import { checkPeripheralConnection, send } from '../../util/ble';
import { parseDate, parseUint16, parseUint32 } from '../../util';
import { changeMeterStatus, checkTabelDBIfExist, getDBConnection, insertMeterData, insertMeterHistoryBatch } from '../../database/repository';
import BleManager from 'react-native-ble-manager';
import axios from 'axios';
import { parseDateBCD } from '../../service/hhu/aps/util';
import { PropsHistoryMeterDataModel, PropsMeterDataModel, TABLE_NAME_METER_DATA, TABLE_NAME_METER_HISTORY } from '../../database/entity';
import { createHhuHandler } from '../../service/hhu/hhuHandler';
import { resetState } from '../../service/hhu/hhuState';
import { addBleListener, removeBleListener } from '../../service/hhu/ble';
let hhuReceiveDataListener: EventSubscription | null = null;
// ✅ Xin quyền vị trí
let watchId: number | null = null;

export const requestLocationPermission = async () => {
  try {
    // ✅ Bật loading trước khi xin quyền
    hookProps.setState((prev) => ({
      ...prev,
      isLoading: true,
      textLoading: 'Đang xin quyền truy cập vị trí...',
    }));

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'Ứng dụng cần truy cập vị trí để hoạt động chính xác.',
          buttonPositive: 'Đồng ý',
          buttonNegative: 'Hủy',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ Quyền truy cập vị trí bị từ chối');
        hookProps.setState((prev) => ({
          ...prev,
          isLoading: false,
          textLoading: 'Bạn đã từ chối quyền vị trí',
          currentLocation: [],
        }));
        clearLocationWatch();
        return;
      }
    }

    // ✅ Được cấp quyền → bắt đầu theo dõi vị trí
    startWatchingPosition();
  } catch (err) {
    console.error('❌ Lỗi xin quyền vị trí:', err);
    hookProps.setState((prev) => ({
      ...prev,
      isLoading: false,
      textLoading: 'Lỗi khi xin quyền vị trí',
    }));
    clearLocationWatch();
  }
};

export const startWatchingPosition = () => {
  clearLocationWatch(); // Clear watch cũ nếu có

  // Lấy vị trí ban đầu
  Geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!isNaN(latitude) && !isNaN(longitude)) {
        hookProps.setState((prev) => ({
          ...prev,
          currentLocation: [longitude, latitude],
          isLoading: false,
          textLoading: '',
        }));
      }
    },
    (err) => {
      console.log('❌ Lỗi lấy vị trí ban đầu:', err);
      hookProps.setState((prev) => ({
        ...prev,
        isLoading: false,
        textLoading:
          'Không lấy được vị trí. Hãy bật GPS hoặc di chuyển ra ngoài trời',
      }));
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );

  // Bắt đầu theo dõi liên tục
  watchId = Geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
  
      if (!isNaN(latitude) && !isNaN(longitude)) {
        hookProps.setState((prev) => ({
          ...prev,
          currentLocation: [longitude, latitude],
        }));
      }
    },
    (err) => console.log('❌ Lỗi cập nhật vị trí:', err),
    {
      enableHighAccuracy: true,
      distanceFilter: 5, // chỉ cập nhật khi di chuyển >= 5m
      interval: 1000, // update mỗi 1s
      fastestInterval: 1000,
      maximumAge: 1000,
    }
  );
  
};

export const clearLocationWatch = () => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
};

export const stopReading = () => {
  shouldStopReading = true;
  hookProps.setState((prev) => ({ ...prev, isAutoReading: false }));
  console.log("🛑 Đã yêu cầu dừng đọc meter");
};

let shouldStopReading = false;
let currentMeterSerialReading: string | null = null;
const handler = createHhuHandler(hookProps);
let initialTimeout: NodeJS.Timeout | null = null;
let initialSendRetryCount = 0;

export const readOneMeter = async (meterNo: string): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
    if (!isConnected) return resolve(false);

    console.log("🔄 Bắt đầu đọc meter:", meterNo);

    removeBleListener();
    handler.prepareForRead();

    const meter = hookProps.state.listMeter.find(m => m.METER_NO === meterNo);
    if (!meter) return resolve(false);

    // báo trạng thái "đang đọc"
    hookProps.setState(prev => ({
      ...prev,
      readingStatus: { meterNo: meter.METER_NO, name: meter.CUSTOMER_NAME, status: "reading" as const },
    }));

    let finished = false;
    let initialTimeout: NodeJS.Timeout | null = null;
    let initialSendRetryCount = 0;

    // listener nhận dữ liệu
    addBleListener(async (data) => {
      if (handler._internal.hasFinished() || finished) return;
      await handler.hhuHandleReceiveData(data);

      if (!handler._internal.hasFinished()) return;

      console.log("✅ Đã xử lí xong toàn bộ packet cho", meterNo);
      finished = true;
      removeBleListener();
      if (initialTimeout) clearTimeout(initialTimeout);

      const meterData = handler._internal.getCurrentMeterData();
      const historyRecords = handler._internal.getAccumulatedRecords();

      if (!meterData) {
        handler.cleanup();
        return resolve(false);
      }

      try {
        // insert meter data
        await insertMeterData({
          METER_NO: meterData.serial,
          TIMESTAMP: new Date(),
          IMPORT_DATA: meterData.impData,
          EXPORT_DATA: meterData.expData,
          EVENT: meterData.event,
          BATTERY: meterData.batteryLevel,
          PERIOD: meterData.latchPeriod,
        });

        // insert history
        if (historyRecords && historyRecords.length > 0) {
          const batch = historyRecords.map((r: any) => ({
            METER_NO: meterData.serial,
            TIMESTAMP: r.timestamp,
            DATA_RECORD: r.value,
          }));
          await insertMeterHistoryBatch(batch);
          console.log(`🔁 Insert batch history count=${batch.length}`);
        }

        hookProps.setState(prev => ({
          ...prev,
          readingStatus: { meterNo: meter.METER_NO, name: meter.CUSTOMER_NAME, status: "success" },
          listMeter: prev.listMeter.map(m =>
            m.METER_NO === meter.METER_NO ? { ...m, STATUS: "1" } : m
          ),
        }));
        await changeMeterStatus(meter.METER_NO, "1");

        handler.cleanup();
        return resolve(true);
      } catch (err) {
        console.error("❌ Insert DB error:", err);

        hookProps.setState(prev => ({
          ...prev,
          readingStatus: { meterNo: meter.METER_NO, name: meter.CUSTOMER_NAME, status: "fail" },
          listMeter: prev.listMeter.map(m =>
            m.METER_NO === meter.METER_NO ? { ...m, STATUS: "2" } : m
          ),
        }));
        await changeMeterStatus(meter.METER_NO, "2");

        handler.cleanup();
        return resolve(false);
      }
    });

    // gói đầu tiên
    const requestData = buildQueryDataPacket(meterNo, 1, false);

    // vòng lặp retry
    const initialRetryLoop = async () => {
      if (handler._internal.hasFinished() || handler._internal.hasReceivedAnyPacket()) return;
      initialSendRetryCount++;
      console.warn(`⚠️ Gửi lại gói 1 - lần ${initialSendRetryCount} cho ${meterNo}`);

      try {
        await send(store.state.hhu.idConnected, requestData);
        hookProps.setState(prev => ({
          ...prev,
          readingStatus: { meterNo, name: meter?.CUSTOMER_NAME, status: "reading" },
        }));
      } catch (err) {
        console.error("❌ Lỗi khi gửi gói 1 (retry):", err);
      }

      if (!handler._internal.hasReceivedAnyPacket() && initialSendRetryCount >= handler.getMaxRetry()) {
        console.error("❌ Không nhận được phản hồi sau nhiều lần thử");
        hookProps.setState(prev => ({
          ...prev,
          readingStatus: { meterNo, name: meter?.CUSTOMER_NAME, status: "fail" },
          listMeter: prev.listMeter.map(m =>
            m.METER_NO === meterNo ? { ...m, STATUS: "2" } : m
          ),
        }));
        await changeMeterStatus(meterNo, "2");

        handler.cleanup();
        if (initialTimeout) clearTimeout(initialTimeout);
        return resolve(false);
      }

      if (initialTimeout) clearTimeout(initialTimeout);
      initialTimeout = setTimeout(initialRetryLoop, 1000);
    };

    // gửi gói đầu tiên
    try {
      await send(store.state.hhu.idConnected, requestData);
      console.log("🚀 Gửi gói 1 lần đầu cho", meterNo);
    } catch (err) {
      console.error("❌ Lỗi khi gửi lần đầu:", err);
      handler.cleanup();
      hookProps.setState(prev => ({
        ...prev,
        readingStatus: { meterNo, name: meter?.CUSTOMER_NAME, status: "fail" as const },
      }));
      return resolve(false);
    }

    if (initialTimeout) clearTimeout(initialTimeout);
    initialTimeout = setTimeout(initialRetryLoop, 1000);
  });
};

export const readMetersOnce = async () => {
  shouldStopReading = false;

  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return;

  hookProps.setState(prev => ({ ...prev, isAutoReading: true }));

  const currentLocation = hookProps.state.currentLocation;
  if (!currentLocation) {
    hookProps.setState(prev => ({ ...prev, isAutoReading: false }));
    return;
  }

  const distanceLimit = Number(store.state.appSetting.setting.distance);
  const metersToRead = hookProps.state.listMeter
    .filter(m => m.COORDINATE && ["0","2","6"].includes(m.STATUS) &&
      getDistanceValue(m.COORDINATE, currentLocation) <= distanceLimit)
    .sort((a, b) =>
      getDistanceValue(a.COORDINATE, currentLocation) -
      getDistanceValue(b.COORDINATE, currentLocation)
    );

  if (metersToRead.length === 0) {
    hookProps.setState(prev => ({ ...prev, isAutoReading: false }));
    return;
  }

  for (const meter of metersToRead) {
    if (shouldStopReading) break;

    console.log(`🔄 Đang đọc meter: ${meter.METER_NO}`);
    const ok = await readOneMeter(meter.METER_NO); // chờ đọc xong mới tiếp
    console.log(`📊 Kết quả meter ${meter.METER_NO}:`, ok ? "success" : "fail");

    await new Promise(res => setTimeout(res, 300)); // delay nhỏ
  }

  hookProps.setState(prev => ({
    ...prev,
    isAutoReading: false,
    readingStatus: null,
  }));
  console.log("✅ Đọc xong hoặc đã dừng đọc");
};



export const stopReadData = () => {
  shouldStopReading = true;
  handler.cleanup();
};


const API_KEY = "f4a6c08959b47211756357354b1b73ac74"; // 👈 key của bạn

export const getDirections = async (
  origin: string,       // "lat,lng"
  destination: string,  // "lat,lng"
  mode: "driving" | "walking" | "motorcycling" | "truck" 
) => {
  try {
    console.log(`🔎 Đang tìm đường đi từ ${origin} đến ${destination}`);

    const url = "https://maps.track-asia.com/route/v2/directions/json";

    const response = await axios.get(url, {
      params: {
        new_admin: true,
        origin: origin,
        destination: destination,
        mode,
        key: API_KEY,
      },
    });

    if (response.data && response.data.routes) {
      console.log("✅ Nhận dữ liệu route thành công:", response.data);
      return response.data;
    } else {
      console.warn("⚠️ API không trả về routes hợp lệ:", response.data);
      return null;
    }
  } catch (error) {
    console.error("❌ Lỗi khi gọi Directions API:", error);
    return null;
  }
};
export const fetchData = async (meterNo: string, hookProps: any) => {
  try {
    hookProps.setState((prev: any) => ({
      ...prev,
      isLoading: true,
      textLoading: "Đang tải dữ liệu...",
    }));

    const db = await getDBConnection();
    if (!db) return;

    await checkTabelDBIfExist();

    // 🔥 Query METER_DATA (1 bản ghi mới nhất)
    const dataResults = await db.executeSql(
      `SELECT * FROM ${TABLE_NAME_METER_DATA} WHERE METER_NO = ? ORDER BY TIMESTAMP DESC LIMIT 1`,
      [meterNo]
    );

    // 🔥 Query HISTORY
    const historyResults = await db.executeSql(
      `SELECT * FROM ${TABLE_NAME_METER_HISTORY} WHERE METER_NO = ? ORDER BY TIMESTAMP DESC`,
      [meterNo]
    );

    const dataRaw = dataResults[0].rows.raw();
    const historyRaw = historyResults[0].rows.raw();

    let meterData: PropDataMeter | null = null;

    if (dataRaw.length > 0) {
      const d = dataRaw[0];

      meterData = {
        serial: d.METER_NO,
        currentTime: d.TIMESTAMP ? new Date(d.TIMESTAMP) : null,
        impData: d.IMPORT_DATA ?? 0,
        expData: d.EXPORT_DATA ?? 0,
        event: d.EVENT ?? "",
        batteryLevel: d.BATTERY ?? "",
        latchPeriod: d.PERIOD ?? "",
        dataRecords: historyRaw.map((h: any) => ({
          timestamp: h.TIMESTAMP ? new Date(h.TIMESTAMP) : new Date(),
          value: h.DATA_RECORD ?? 0,
        })),
      };
    }

    hookProps.setState((prev: any) => ({
      ...prev,
      meterData,
      historyData: historyRaw, // vẫn giữ historyRaw nếu cần riêng
      isLoading: false,
      textLoading: "",
    }));
  } catch (error) {
    console.error("❌ Lỗi khi load dữ liệu:", error);
    Alert.alert("Lỗi", "Không thể tải dữ liệu từ database.");
    hookProps.setState((prev: any) => ({
      ...prev,
      isLoading: false,
      textLoading: "",
    }));
  }
};
export const onClose = () => {
  hookProps.setState((prev: any) => ({
    ...prev,
    isShowDataModal: false,
    meterData: null,
    historyData: null,
  }));
};


