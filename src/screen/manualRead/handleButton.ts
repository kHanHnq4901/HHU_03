import { hookProps, store } from './controller';
import { Alert, EventSubscription, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getDistanceValue } from '../../util/location';
import { buildQueryDataPacket } from '../../service/hhu/aps/hhuAps';
import { checkPeripheralConnection, send } from '../../util/ble';
import { parseDate, parseUint16, parseUint32 } from '../../util';
import { changeMeterStatus, insertMeterData, insertMeterHistoryBatch } from '../../database/repository';
import BleManager from 'react-native-ble-manager';
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
    .filter(meter => meter.COORDINATE && ["0","2","6"].includes(meter.STATUS) && getDistanceValue(meter.COORDINATE, currentLocation) <= distanceLimit)
    .sort((a, b) => getDistanceValue(a.COORDINATE, currentLocation) - getDistanceValue(b.COORDINATE, currentLocation));

  if (metersToRead.length === 0) {
    hookProps.setState(prev => ({ ...prev, isAutoReading: false }));
    return;
  }

  for (const meter of metersToRead) {
    if (shouldStopReading) break;

    console.log(`🔄 Đang đọc meter: ${meter.METER_NO}`);

    // ✅ Cập nhật readingStatus: "reading"
    hookProps.setState(prev => ({
      ...prev,
      readingStatus: {
        meterNo: meter.METER_NO,
        name: meter.CUSTOMER_NAME,
        status: "reading",
      },
      listMeter: prev.listMeter.map(m => m.METER_NO === meter.METER_NO ? { ...m, STATUS: "6" } : m)
    }));
    await changeMeterStatus(meter.METER_NO, "6");

    // Build gói dữ liệu và gửi
    const dataPacket = buildQueryDataPacket(meter.METER_NO);
    await send(store.state.hhu.idConnected, dataPacket);

    currentMeterSerialReading = meter.METER_NO;

    // Promise chờ dữ liệu từ meter đúng serial
    await new Promise<void>((resolve) => {
      let timeout: NodeJS.Timeout;

      const listener = BleManager.onDidUpdateValueForCharacteristic(async (data: { value: number[] }) => {
        const buf = Buffer.from(data.value);
        if (buf.length < 15) return;

        const meterSerialBytes = buf.slice(4, 14);
        const serialReceived = meterSerialBytes.toString("ascii");
        if (serialReceived !== currentMeterSerialReading) return;

        // Nhận đúng meter → xử lý dữ liệu
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

        // ⏳ Đợi 1s cho người dùng nhìn thấy trạng thái thành công/thất bại
        setTimeout(resolve, 1000);
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

  hookProps.setState(prev => ({
    ...prev,
    isAutoReading: false,
    readingStatus: null, // ✅ ẩn thanh khi xong
  }));

  console.log("✅ Đọc xong hoặc đã dừng đọc");
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

export async function responeData(payload: number[], meterSerial: string): Promise<boolean> {
  if (payload.length < 3) {
    console.warn("⚠️ Payload quá ngắn:", payload);
    return false;
  }

  const u8CommandCode = payload[0];
  const indexPacket = payload[1];
  const recordCount = payload[2];
  console.log(`📥 Nhận gói index=${indexPacket}, recordCount=${recordCount}, cmd=${u8CommandCode}`);

  const bytePerRecord = u8CommandCode === 1 ? 4 : 2;
  let offset = 3;

  let currentTime = "";
  let impData = 0;
  let expData = 0;
  let event = "";
  let batteryLevel = "";
  let latchPeriodMinutes = 0;

  if (indexPacket === 1) {
    currentTime = parseDate(payload.slice(offset, offset + 6));
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
    offset += 2;
  }

  // ✅ Xác định baseTime
  let baseTime: Date;
  if (indexPacket === 1) {
    baseTime = new Date(currentTime);
    if (isNaN(baseTime.getTime())) baseTime = new Date();
  } else {
    baseTime = new Date();
  }

  const records: { timestamp: string; value: number }[] = [];
  const historyBatch: { METER_NO: string; TIMESTAMP: string; DATA_RECORD: string }[] = [];
  let insertedCount = 0;

  for (let i = 0; i < recordCount; i++) {
    const start = offset + i * bytePerRecord;
    const valueBytes = payload.slice(start, start + bytePerRecord);
    const value = u8CommandCode === 1 ? parseUint32(valueBytes) : parseUint16(valueBytes);

    const recordTime = new Date(baseTime);
    recordTime.setMinutes(recordTime.getMinutes() - i * latchPeriodMinutes);

    if (isNaN(recordTime.getTime()) || recordTime.getFullYear() < 2000 || recordTime.getFullYear() > 2100) {
      console.warn(`⛔ recordTime không hợp lệ, bỏ qua`, recordTime);
      continue;
    }

    const timestamp = recordTime.toISOString();
    console.log(`📊 [Gói ${indexPacket}] Record ${i + 1}/${recordCount} → ${timestamp} (Value=${value})`);

    records.push({ timestamp, value });

    // ✅ Gom dữ liệu vào batch history
    historyBatch.push({
      METER_NO: meterSerial,
      TIMESTAMP: timestamp,
      DATA_RECORD: value.toString(),
    });

    // ✅ Chỉ insert vào bảng METER_DATA với bản ghi đầu tiên (bản mới nhất)
    if (i === 0) {
      const ok = await insertMeterData({
        METER_NO: meterSerial,
        TIMESTAMP: timestamp,
        IMPORT_DATA: u8CommandCode === 1 ? value.toString() : "0",
        EXPORT_DATA: "0",
        EVENT: event,
        BATTERY: batteryLevel,
        PERIOD: latchPeriodMinutes.toString(),
      });

      if (ok) insertedCount++;
    }
  }

  // ✅ Batch insert vào bảng lịch sử (Nhanh hơn gọi từng lần)
  if (historyBatch.length > 0) {
    await insertMeterHistoryBatch(historyBatch);
  }

  // ✅ Update state
  if (records.length > 0) {
    hookProps.setState((prev) => {
      const prevMeterData = prev.meterData;

      const sortedRecords = [...records].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (indexPacket === 1 || !prevMeterData || prevMeterData.serial !== meterSerial) {
        return {
          ...prev,
          meterData: {
            serial: meterSerial,
            currentTime,
            impData,
            expData,
            event,
            batteryLevel,
            latchPeriod: latchPeriodMinutes.toString(),
            dataRecords: sortedRecords,
          },
        };
      }

      const mergedRecords = [...prevMeterData.dataRecords, ...sortedRecords].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

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


