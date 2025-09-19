import { hookProps, store } from './controller';
import { Alert, EventSubscription, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getDistanceValue } from '../../util/location';
import { buildQueryDataPacket } from '../../service/hhu/aps/hhuAps';
import { checkPeripheralConnection, send } from '../../util/ble';
import { parseDate, parseUint16, parseUint32 } from '../../util';
import { changeMeterStatus, insertMeterData, insertMeterHistoryBatch } from '../../database/repository';
import BleManager from 'react-native-ble-manager';
import { parseDateBCD } from '../../service/hhu/aps/util';
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

export const stopAutoRead = () => {
  shouldStopReading = true;
  hookProps.setState((prev) => ({ ...prev, isAutoReading: false }));
  console.log("🛑 Đã yêu cầu dừng đọc meter");
};

let shouldStopReading = false;
let currentMeterSerialReading: string | null = null;

export const startAutoRead = async () => {
  if (hookProps.state.isAutoReading) return; // 🔒 tránh gọi lặp

  shouldStopReading = false;
  hookProps.setState(prev => ({ ...prev, isAutoReading: true }));

  while (!shouldStopReading) {
    const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
    if (!isConnected) {
      console.warn("⚠️ Không kết nối, dừng đọc.");
      break;
    }

    const currentLocation = hookProps.state.currentLocation;
    if (!currentLocation) {
      console.warn("⚠️ Không có vị trí hiện tại, dừng đọc.");
      break;
    }

    const distanceLimit = Number(store.state.appSetting.setting.distance);

    const metersToRead = hookProps.state.listMeter
      .filter(meter =>
        meter.COORDINATE &&
        ["0", "2", "6"].includes(meter.STATUS) &&
        getDistanceValue(meter.COORDINATE, currentLocation) <= distanceLimit
      )
      .sort((a, b) =>
        getDistanceValue(a.COORDINATE, currentLocation) -
        getDistanceValue(b.COORDINATE, currentLocation)
      );

    if (metersToRead.length === 0) {
      console.log("✅ Không còn công tơ nào cần đọc, chờ 3s rồi thử lại...");
      await new Promise(res => setTimeout(res, 3000));
      continue; // 🔄 lặp lại để check danh sách mới
    }

    for (const meter of metersToRead) {
      if (shouldStopReading) break;

      console.log(`🔄 Đang đọc meter: ${meter.METER_NO}`);

      // ✅ cập nhật trạng thái meter đang đọc
      hookProps.setState(prev => ({
        ...prev,
        readingStatus: {
          meterNo: meter.METER_NO,
          name: meter.CUSTOMER_NAME,
          status: "reading",
        },
        listMeter: prev.listMeter.map(m =>
          m.METER_NO === meter.METER_NO ? { ...m, STATUS: "6" } : m
        )
      }));
      await changeMeterStatus(meter.METER_NO, "6");

      const dataPacket = buildQueryDataPacket(meter.METER_NO);
      await send(store.state.hhu.idConnected, dataPacket);
      currentMeterSerialReading = meter.METER_NO;

      // ⏳ chờ dữ liệu trả về hoặc timeout
      await new Promise<void>((resolve) => {
        let timeout: NodeJS.Timeout;

        const listener = BleManager.onDidUpdateValueForCharacteristic(async (data: { value: number[] }) => {
          const buf = Buffer.from(data.value);
          if (buf.length < 15) return;

          const serialReceived = buf.slice(4, 14).toString("ascii");
          if (serialReceived !== currentMeterSerialReading) return;

          const payload = Array.from(buf.slice(14, 14 + buf[3]));
          const success = await responeData(payload, serialReceived);

          hookProps.setState(prev => ({
            ...prev,
            readingStatus: {
              meterNo: meter.METER_NO,
              name: meter.CUSTOMER_NAME,
              status: success ? "success" : "fail",
            },
            listMeter: prev.listMeter.map(m =>
              m.METER_NO === meter.METER_NO ? { ...m, STATUS: success ? "1" : "2" } : m
            ),
          }));
          changeMeterStatus(meter.METER_NO, success ? "1" : "2");
          clearTimeout(timeout);
          listener.remove();
          setTimeout(resolve, 1000); // đợi user thấy kết quả
        });

        timeout = setTimeout(() => {
          console.warn(`⏱ Timeout meter ${meter.METER_NO}`);
          hookProps.setState(prev => ({
            ...prev,
            readingStatus: {
              meterNo: meter.METER_NO,
              name: meter.CUSTOMER_NAME,
              status: "fail",
            },
            listMeter: prev.listMeter.map(m =>
              m.METER_NO === meter.METER_NO ? { ...m, STATUS: "2" } : m
            ),
          }));
          changeMeterStatus(meter.METER_NO, "2");
          listener.remove();
          setTimeout(resolve, 1000);
        }, 5000);
      });

      currentMeterSerialReading = null;
      await new Promise(res => setTimeout(res, 200));
    }
  }

  hookProps.setState(prev => ({
    ...prev,
    isAutoReading: false,
    readingStatus: null,
  }));

  console.log("✅ Đã dừng đọc hoặc kết thúc vòng lặp");
};



export let hhuHandleReceiveData = (data: { value: number[] }) => {
  const buf = Buffer.from(data.value);

  if (buf.length >= 15 && buf[0] === 0x02 && buf[1] === 0x08) {
    const commandType = buf[2];
    const lenPayload = buf[3];
    const meterSerial = buf.slice(4, 14).toString("ascii");

    // Chỉ xử lý meter đang đọc
    if (meterSerial !== currentMeterSerialReading) return;

    const payload = Array.from(buf.slice(14, 14 + lenPayload));

    switch (commandType) {
      case 0x01:
        responeData(payload, meterSerial);
        break;
      default:
        console.log("⚠️ Unknown commandType:", commandType);
    }
  }
};

// 🔑 Biến toàn cục giữ latchPeriod và timestamp cũ nhất
let globalLatchPeriodMinutes = 0;
let globalOldestTime: Date | null = null;

export async function responeData(payload: number[], meterSerial: string): Promise<boolean> {
  if (payload.length < 3) {
    console.warn("⚠️ Payload quá ngắn:", payload);
    return false;
  }

  const u8CommandCode = payload[0];
  const indexPacket = payload[1];
  const recordCount = payload[2];
  const bytePerRecord = u8CommandCode === 1 ? 4 : 2;
  let offset = 3;

  let currentDate: Date | null = null;
  let impData = 0;
  let expData = 0;
  let event = "";
  let batteryLevel = "";
  let latchPeriodMinutes = globalLatchPeriodMinutes;
  let totalPacket = 0;

  // 🥇 Gói đầu tiên (index = 1)
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

    latchPeriodMinutes = (payload[offset] & 0xff) | ((payload[offset + 1] & 0xff) << 8);
    globalLatchPeriodMinutes = latchPeriodMinutes;
    offset += 2;

    totalPacket = payload[offset];
    offset += 1;

    console.log("📌 totalPacket:", totalPacket);

    // set mốc oldest = currentDate
    globalOldestTime = currentDate ? new Date(currentDate) : new Date();
  }

  // 🚀 Build record list
  const records: { timestamp: Date; value: number }[] = [];
  const historyBatch: { METER_NO: string; TIMESTAMP: Date; DATA_RECORD: string }[] = [];
  let insertedCount = 0;

  for (let i = 0; i < recordCount; i++) {
    const start = offset + i * bytePerRecord;
    const valueBytes = payload.slice(start, start + bytePerRecord);
    const value = u8CommandCode === 1 ? parseUint32(valueBytes) : parseUint16(valueBytes);

    let recordTime: Date;

    if (indexPacket === 1 && currentDate) {
      // gói đầu → lùi dần từ currentDate
      recordTime = new Date(currentDate.getTime() - i * latchPeriodMinutes * 60_000);
    } else if (globalOldestTime) {
      // gói sau → nối tiếp, lùi thêm
      recordTime = new Date(globalOldestTime.getTime() - (i + 1) * latchPeriodMinutes * 60_000);
    } else {
      recordTime = new Date(); // fallback
    }

    // cập nhật globalOldestTime luôn = nhỏ nhất
    if (!globalOldestTime || recordTime.getTime() < globalOldestTime.getTime()) {
      globalOldestTime = recordTime;
    }

    records.push({ timestamp: recordTime, value });
    historyBatch.push({
      METER_NO: meterSerial,
      TIMESTAMP: recordTime,
      DATA_RECORD: value.toString(),
    });
  }

  // ✅ Insert meterData (gói đầu)
  if (indexPacket === 1 && currentDate) {
    const ok = await insertMeterData({
      METER_NO: meterSerial,
      TIMESTAMP: new Date(), // thời điểm ghi DB = now
      IMPORT_DATA: impData.toString(),
      EXPORT_DATA: expData.toString(),
      EVENT: event,
      BATTERY: batteryLevel,
      PERIOD: latchPeriodMinutes.toString(),
    });
    if (ok) insertedCount++;
  }

  // ✅ Insert batch history
  if (historyBatch.length > 0) {
    await insertMeterHistoryBatch(historyBatch);
  }

  // ✅ Update state
  if (records.length > 0) {
    hookProps.setState((prev) => {
      const prevMeterData = prev.meterData;
      const mergedRecords = [...(prevMeterData?.dataRecords || []), ...records].sort(
        (a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0)
      );

      if (indexPacket === 1 || !prevMeterData || prevMeterData.serial !== meterSerial) {
        return {
          ...prev,
          meterData: {
            serial: meterSerial,
            currentTime: currentDate ?? new Date(),
            impData,
            expData,
            event,
            batteryLevel,
            latchPeriod: latchPeriodMinutes.toString(),
            totalPacket,
            dataRecords: mergedRecords,
          },
        };
      }

      return {
        ...prev,
        meterData: {
          ...prevMeterData,
          dataRecords: mergedRecords,
        },
      };
    });
  }

  return insertedCount > 0;
}


