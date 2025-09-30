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
      .filter(m =>
        m.COORDINATE &&
        ["0", "2", "6"].includes(m.STATUS) &&
        getDistanceValue(m.COORDINATE, currentLocation) <= distanceLimit
      )
      .sort((a, b) =>
        getDistanceValue(a.COORDINATE, currentLocation) -
        getDistanceValue(b.COORDINATE, currentLocation)
      );

    if (metersToRead.length === 0) {
      console.log("✅ Không còn đồng hồ nào cần đọc, chờ 3s rồi thử lại...");
      await new Promise(res => setTimeout(res, 3000));
      continue;
    }

    for (const meter of metersToRead) {
      if (shouldStopReading) break;

      console.log(`🔄 Đang đọc meter: ${meter.METER_NO}`);

      currentMeterSerialReading = meter.METER_NO;

      // ✅ Listener trước khi gửi dữ liệu
      await new Promise<void>((resolve) => {
        let finished = false;
        let timeout: NodeJS.Timeout;

        const cleanup = () => {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          listener.remove();
        };

        const handleResult = async (success: boolean) => {
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
          await changeMeterStatus(meter.METER_NO, success ? "1" : "2");
          setTimeout(resolve, 1000); // đợi user thấy kết quả
        };

        const listener = BleManager.onDidUpdateValueForCharacteristic(async (data: { value: number[] }) => {
          if (finished) return;
          const buf = Buffer.from(data.value);
          if (buf.length < 15) return;

          const serialReceived = buf.slice(4, 14).toString("ascii");
          if (serialReceived !== currentMeterSerialReading) return;

          const payload = Array.from(buf.slice(14, 14 + buf[3]));
          const success = await responeData(payload, serialReceived);

          cleanup();
          await handleResult(success);
        });

        // ✅ Gửi gói dữ liệu SAU khi listener đã đăng ký
        hookProps.setState(prev => ({
          ...prev,
          readingStatus: {
            meterNo: meter.METER_NO,
            name: meter.CUSTOMER_NAME,
            status: "reading",
          },
          listMeter: prev.listMeter.map(m =>
            m.METER_NO === meter.METER_NO ? { ...m, STATUS: "6" } : m
          ),
        }));
        changeMeterStatus(meter.METER_NO, "6");

        const dataPacket = buildQueryDataPacket(meter.METER_NO,1);
        send(store.state.hhu.idConnected, dataPacket).catch(err => {
          console.error("❌ Gửi dữ liệu thất bại:", err);
          cleanup();
          handleResult(false);
        });

        // Timeout 5s nếu không nhận dữ liệu
        timeout = setTimeout(() => {
          if (finished) return;
          cleanup();
          console.warn(`⏱ Timeout meter ${meter.METER_NO}`);
          handleResult(false);
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


