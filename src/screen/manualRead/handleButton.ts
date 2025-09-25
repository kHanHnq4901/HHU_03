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

// Biến lưu serial meter đang đọc hiện tại
let currentMeterSerialReading: string | null = null;



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
    .filter(m => m.COORDINATE && ["0","2","6"].includes(m.STATUS) && getDistanceValue(m.COORDINATE, currentLocation) <= distanceLimit)
    .sort((a, b) => getDistanceValue(a.COORDINATE, currentLocation) - getDistanceValue(b.COORDINATE, currentLocation));

  if (metersToRead.length === 0) {
    hookProps.setState(prev => ({ ...prev, isAutoReading: false }));
    return;
  }

  for (const meter of metersToRead) {
    if (shouldStopReading) break;
    console.log(`🔄 Đang đọc meter: ${meter.METER_NO}`);

    await readOneMeter(meter.METER_NO);
    await new Promise(res => setTimeout(res, 200));
  }

  hookProps.setState(prev => ({
    ...prev,
    isAutoReading: false,
    readingStatus: null,
  }));
  console.log("✅ Đọc xong hoặc đã dừng đọc");
};


export const readOneMeter = async (meterNo: string) => {
  const db = await getDBConnection();
  if (!db) return;

  await checkTabelDBIfExist();

  // 🔑 Xóa dữ liệu theo meterNo
  await db.executeSql(
    `DELETE FROM ${TABLE_NAME_METER_DATA} WHERE METER_NO = ?`,
    [meterNo]
  );

  await db.executeSql(
    `DELETE FROM ${TABLE_NAME_METER_HISTORY} WHERE METER_NO = ?`,
    [meterNo]
  );
  shouldStopReading = false;

  const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
  if (!isConnected) return false;

  const meter = hookProps.state.listMeter.find(m => m.METER_NO === meterNo);
  if (!meter) {
    console.warn(`⚠️ Không tìm thấy meter ${meterNo}`);
    return false;
  }

  console.log(`🎯 Đọc meter: ${meter.METER_NO}`);
  hookProps.setState(prev => ({
    ...prev,
    readingStatus: { meterNo: meter.METER_NO, name: meter.CUSTOMER_NAME, status: "reading" },
    listMeter: prev.listMeter.map(m => m.METER_NO === meter.METER_NO ? { ...m, STATUS: "6" } : m)
  }));
  await changeMeterStatus(meter.METER_NO, "6");

  currentMeterSerialReading = meter.METER_NO;

  return new Promise<boolean>((resolve) => {
    let finished = false;
    let timeout: NodeJS.Timeout;

    let receivedPackets = 0;
    let expectedPackets = 0;
    let successOverall = false;

    // Buffer lưu tất cả packet theo indexPacket
    const packetBuffer: Record<number, number[]> = {};

    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      listener.remove();
    };

    const handleResult = async (success: boolean) => {
      const currentMeter = hookProps.state.listMeter.find(m => m.METER_NO === meter.METER_NO);
      const prevStatus = currentMeter?.STATUS;

      // Nếu đã success thì giữ nguyên
      const newStatus = prevStatus === "1" ? "1" : (success ? "1" : "2");
      const newReadingStatus = prevStatus === "1"
        ? { meterNo: meter.METER_NO, name: meter.CUSTOMER_NAME, status: "success" }
        : { meterNo: meter.METER_NO, name: meter.CUSTOMER_NAME, status: success ? "success" : "fail" };

      hookProps.setState(prev => ({
        ...prev,
        readingStatus: newReadingStatus,
        listMeter: prev.listMeter.map(m => m.METER_NO === meter.METER_NO ? { ...m, STATUS: newStatus } : m)
      }));

      await changeMeterStatus(meter.METER_NO, newStatus);
      setTimeout(() => resolve(success), 500);
    };

    const listener = BleManager.onDidUpdateValueForCharacteristic(async (data: { value: number[] }) => {
      if (finished) return;

      const buf = Buffer.from(data.value);
      if (buf.length < 15) return;

      const serialReceived = buf.slice(4, 14).toString("ascii");
      if (serialReceived !== currentMeterSerialReading) return;

      const payload = Array.from(buf.slice(14, 14 + buf[3]));
      const indexPacket = payload[1];

      if (indexPacket === 1) expectedPackets = payload[14]; // gói đầu báo tổng số gói

      packetBuffer[indexPacket] = payload; // lưu payload vào buffer
      receivedPackets++;

      // Khi nhận đủ tất cả packet, xử lý theo thứ tự
      if (receivedPackets >= expectedPackets) {
        cleanup();
        try {
          // Xử lý từng packet theo thứ tự
          const orderedPackets = Object.keys(packetBuffer)
            .map(k => Number(k))
            .sort((a, b) => a - b)
            .map(i => packetBuffer[i]);

          for (const p of orderedPackets) {
            const res = await responeData(p, meter.METER_NO);
            if (res) successOverall = true;
          }

          await handleResult(successOverall);
        } catch (err) {
          console.error("❌ Xử lý packet thất bại:", err);
          await handleResult(false);
        }
      }
    });

    const dataPacket = buildQueryDataPacket(meter.METER_NO);
    send(store.state.hhu.idConnected, dataPacket).catch(err => {
      console.error("❌ Gửi dữ liệu thất bại:", err);
      cleanup();
      handleResult(false);
    });

    timeout = setTimeout(() => {
      if (finished) return;
      cleanup();
      console.warn(`⏱ Timeout meter ${meter.METER_NO}`);
      handleResult(false);
    }, 5000);
  }).finally(async () => {
    currentMeterSerialReading = null;
    await new Promise(res => setTimeout(res, 200));
    hookProps.setState(prev => ({ ...prev, readingStatus: null }));
  });
};


export let hhuHandleReceiveData = async (data: { value: number[] }) => {
  const buf = Buffer.from(data.value);
  if (buf.length < 15 || buf[0] !== 0x02 || buf[1] !== 0x08) return;

  const commandType = buf[2];
  const lenPayload = buf[3];
  const meterSerial = buf.slice(4, 14).toString("ascii");

  // Chỉ xử lý meter đang đọc
  if (meterSerial !== currentMeterSerialReading) return;

  const payload = Array.from(buf.slice(14, 14 + lenPayload));

  if (commandType === 0x01) {
    await responeData(payload, meterSerial);
  } else {
    console.log("⚠️ Unknown commandType:", commandType);
  }
};

// Biến toàn cục
let globalLatchPeriodMinutes = 0;
let globalOldestTime: Date | null = null;

export async function responeData(payload: number[], meterSerial: string): Promise<boolean> {
  if (payload.length < 3) return false;

  const u8CommandCode = payload[0];
  const indexPacket = payload[1];
  const recordCount = payload[2];
  const bytePerRecord = u8CommandCode === 1 ? 4 : 2;
  let offset = 3;

  let currentDate: Date | null = null;
  let impData = 0, expData = 0;
  let event = "", batteryLevel = "";
  let totalPacket = 0;

  // Lưu mốc thời gian của bản ghi mới nhất
  let lastRecordTime: Date | null = null;

  // Gói đầu tiên
  if (indexPacket === 1) {
    const currentTimeBytes = payload.slice(offset, offset + 6);
    currentDate = parseDateBCD(currentTimeBytes);
    offset += 6;

    impData = parseUint32(payload.slice(offset, offset + 4));
    offset += 4;
    expData = parseUint32(payload.slice(offset, offset + 4));
    offset += 4;

    event = payload[offset].toString(16).padStart(2, "0");
    offset += 1;

    const voltage = payload[offset] / 10;
    batteryLevel = `${Math.min(100, Math.max(0, (voltage / 3.6) * 100)).toFixed(0)}%`;
    offset += 1;

    globalLatchPeriodMinutes = (payload[offset] & 0xff) | ((payload[offset + 1] & 0xff) << 8);
    offset += 2;

    totalPacket = payload[offset];
    offset += 1;

    // Mốc thời gian cũ nhất là currentDate
    globalOldestTime = currentDate ? new Date(currentDate) : new Date();

    // Lưu dữ liệu meter chính
    await insertMeterData({
      METER_NO: meterSerial,
      TIMESTAMP: new Date(),
      IMPORT_DATA: impData.toString(),
      EXPORT_DATA: expData.toString(),
      EVENT: event,
      BATTERY: batteryLevel,
      PERIOD: globalLatchPeriodMinutes.toString(),
    });
  }

  const historyBatch: { METER_NO: string; TIMESTAMP: Date; DATA_RECORD: string }[] = [];

  // Tạo record history
  for (let i = 0; i < recordCount; i++) {
    const start = offset + i * bytePerRecord;
    const value = u8CommandCode === 1
      ? parseUint32(payload.slice(start, start + bytePerRecord))
      : parseUint16(payload.slice(start, start + bytePerRecord));

    let recordTime: Date;

    if (indexPacket === 1 && currentDate) {
      // Gói đầu tiên: tính từ currentDate lùi theo thứ tự cũ → mới
      // i=0 là record cũ nhất, i=recordCount-1 là mới nhất
      recordTime = new Date(currentDate.getTime() - (recordCount - 1 - i) * globalLatchPeriodMinutes * 60_000);
    } else if (lastRecordTime) {
      // Gói tiếp theo: lùi từ bản ghi mới nhất trước đó
      recordTime = new Date(lastRecordTime.getTime() - globalLatchPeriodMinutes * 60_000);
    } else if (globalOldestTime) {
      // Trường hợp đặc biệt nếu không có lastRecordTime
      recordTime = new Date(globalOldestTime.getTime() - globalLatchPeriodMinutes * 60_000);
    } else {
      recordTime = new Date();
    }

    // Cập nhật lastRecordTime
    lastRecordTime = recordTime;

    // Cập nhật globalOldestTime nếu cần
    if (!globalOldestTime || recordTime.getTime() < globalOldestTime.getTime()) {
      globalOldestTime = recordTime;
    }

    historyBatch.push({
      METER_NO: meterSerial,
      TIMESTAMP: recordTime,
      DATA_RECORD: value.toString(),
    });
  }

  // Lưu batch vào DB
  if (historyBatch.length > 0) {
    await insertMeterHistoryBatch(historyBatch);
  }

  // Cập nhật state
  hookProps.setState((prev) => {
    const prevRecords = prev.meterData?.dataRecords || [];
    const mergedRecords = [...prevRecords, ...historyBatch.map(h => ({ timestamp: h.TIMESTAMP, value: Number(h.DATA_RECORD) }))].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    return {
      ...prev,
      meterData: {
        serial: meterSerial,
        currentTime: currentDate ?? new Date(),
        impData,
        expData,
        event,
        batteryLevel,
        latchPeriod: globalLatchPeriodMinutes.toString(),
        totalPacket,
        dataRecords: mergedRecords,
      },
    };
  });

  console.log(`📥 Đã nhận gói ${indexPacket}/${totalPacket}`);
  return true;
}






const API_KEY = "f4a6c08959b47211756357354b1b73ac74"; // 👈 key của bạn

export const getDirections = async (
  origin: string,       // "lat,lng"
  destination: string,  // "lat,lng"
  mode: "driving" | "walking" | "motorcycling" | "truck" 
) => {
  try {
    // 🔄 Hàm đổi "lat,lng" -> "lng,lat"
    const formatCoords = (coord: string) => {
      const [lat, lng] = coord.split(",").map(Number);
      return `${lng},${lat}`;
    };


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