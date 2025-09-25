import { Alert, EventSubscription } from "react-native";
import BleManager from 'react-native-ble-manager';
import { hookProps } from "./controller";
import { store } from "../overview/controller";
import { checkPeripheralConnection, send } from "../../util/ble";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { parseDateBCD, parseStringToDate } from "../../service/hhu/aps/util";
import { parseUint16, parseUint32 } from "../../util";

let hhuReceiveDataListener: EventSubscription | null = null;
let dataQueue: { value: number[] }[] = [];
let isProcessing = false;
let globalHistoryRecords: { timestampMs: number; value: number }[] = [];
let globalLatchPeriodMinutes = 0;
let globalTotalPacket = 0;
let receivedPacketCount = 0;

export const onReadData = async () => {
  try {
    if (!hookProps.state.serial) {
      Alert.alert("Vui lòng điền serial");
      return;
    }

    const isConnected = await checkPeripheralConnection(store.state.hhu.idConnected);
    if (!isConnected) return;

    // 🚮 clear listener cũ
    if (hhuReceiveDataListener) {
      hhuReceiveDataListener.remove();
      hhuReceiveDataListener = null;
    }

    // reset biến toàn cục
    dataQueue = [];
    globalHistoryRecords = [];
    globalLatchPeriodMinutes = 0;
    globalTotalPacket = 0;
    receivedPacketCount = 0;

    hookProps.setState((prev) => ({
      ...prev,
      isReading: true,
      meterData: null,
      historyData: null,
      currentTime: new Date(),
    }));

    // timeout & retry
    let timeoutMain: NodeJS.Timeout;
    let timeoutRetry: NodeJS.Timeout;
    let hasReceivedFirstPacket = false;
    let retryCount = 0;
    const MAX_RETRY = 3;

    const cleanup = () => {
      if (timeoutMain) clearTimeout(timeoutMain);
      if (timeoutRetry) clearTimeout(timeoutRetry);
      if (hhuReceiveDataListener) {
        hhuReceiveDataListener.remove();
        hhuReceiveDataListener = null;
      }
      hookProps.setState((prev) => ({ ...prev, isReading: false }));
    };

    // ⏱ timeout chính (ngắt sau 6s)
    timeoutMain = setTimeout(() => {
      console.warn("⏱️ Hết thời gian chờ phản hồi!");
      cleanup();
    }, 3000);

    // 📡 Listener BLE
    hhuReceiveDataListener = BleManager.onDidUpdateValueForCharacteristic(
      (data: { value: number[] }) => {
        if (!hasReceivedFirstPacket) {
          hasReceivedFirstPacket = true;
          if (timeoutRetry) clearTimeout(timeoutRetry); // dừng retry ngay
        }
        dataQueue.push(data);
        processQueue().then(() => {
          if (globalTotalPacket > 0 && receivedPacketCount >= globalTotalPacket) {
            console.log("📦 Nhận đủ số gói:", receivedPacketCount, "/", globalTotalPacket);
            cleanup();
          }
        });
      }
    );

    const requestData = buildQueryDataPacket(
      hookProps.state.serial,
      hookProps.state.isDetailedRead
    );

    // 🔁 Hàm retry
    const retrySend = async () => {
      if (hasReceivedFirstPacket) return; // nếu đã nhận thì thôi
      if (retryCount >= MAX_RETRY) return; // quá số lần retry

      retryCount++;
      console.warn(`⚠️ Retry lần ${retryCount}...`);

      try {
        await send(store.state.hhu.idConnected, requestData);
      } catch (err) {
        console.error("❌ Lỗi khi gửi retry:", err);
      }

      // tiếp tục retry nếu chưa nhận gói nào
      if (!hasReceivedFirstPacket && retryCount < MAX_RETRY) {
        timeoutRetry = setTimeout(retrySend, 2000);
      }
    };

    // 🔥 Gửi lần đầu
    try {
      await send(store.state.hhu.idConnected, requestData);
      console.log("🚀 Gửi lần đầu xong");
    } catch (err) {
      console.error("❌ Lỗi khi gửi lần đầu:", err);
    }

    // ⏳ Sau 2s nếu chưa nhận -> retry
    timeoutRetry = setTimeout(retrySend, 2000);
  } catch (error) {
    console.error(error);
    hookProps.setState((prev) => ({ ...prev, isReading: false }));
    if (hhuReceiveDataListener) {
      hhuReceiveDataListener.remove();
      hhuReceiveDataListener = null;
    }
  }
};



const processQueue = async () => {
  if (isProcessing || dataQueue.length === 0) return;
  isProcessing = true;

  while (dataQueue.length > 0) {
    const data = dataQueue.shift();
    if (!data) continue;
    try {
      await hhuHandleReceiveData(data);
    } catch (err) {
      console.error("❌ Lỗi xử lý gói:", err);
    }
  }

  hookProps.setState((prev) => {
    const newRecords = globalHistoryRecords
      .map((r) => ({
        timestamp: new Date(r.timestampMs),
        value: r.value,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      ...prev,
      historyData: { serial: prev.meterData?.serial || "", dataRecords: newRecords },
    };
  });

  isProcessing = false;
};

export const hhuHandleReceiveData = async (data: { value: number[] }) => {
  const buf = Buffer.from(data.value);
  if (buf.length < 15 || buf[0] !== 0x02 || buf[1] !== 0x08) return;

  const commandType = buf[2];
  const lenPayload = buf[3];
  const meterSerialBytes = buf.slice(4, 14);
  const meterSerial = meterSerialBytes.toString("ascii");

  if (hookProps.state.serial && meterSerial !== hookProps.state.serial) return;

  const payload = Array.from(buf.slice(14, 14 + lenPayload));

  if (commandType === 0x01) {
    await responeData(payload, meterSerial);
  }
};

export function responeData(payload: number[], meterSerial: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (payload.length < 3) return resolve();

      const u8CommandCode = payload[0];
      const indexPacket = payload[1];
      const recordCount = payload[2];
      const bytePerRecord = u8CommandCode === 1 ? 4 : 2;
      let offset = 3;

      if (indexPacket === 1) {
        const currentTimeBytes = payload.slice(offset, offset + 6);
        const currentDate = parseDateBCD(currentTimeBytes);
        offset += 6;

        const impData = parseUint32(payload.slice(offset, offset + 4));
        offset += 4;
        const expData = parseUint32(payload.slice(offset, offset + 4));
        offset += 4;

        const event = payload[offset].toString(16).padStart(2, "0");
        offset += 1;

        const voltage = payload[offset] / 10;
        const batteryLevel = `${Math.min(
          100,
          Math.max(0, (voltage / 3.6) * 100)
        ).toFixed(0)}%`;
        offset += 1;

        globalLatchPeriodMinutes =
          (payload[offset] & 0xff) | ((payload[offset + 1] & 0xff) << 8);
        offset += 2;

        const totalPacket = payload[offset];
        offset += 1;

        // 🔑 Lưu tổng số gói và reset bộ đếm
        globalTotalPacket = totalPacket;
        receivedPacketCount = 1; // gói đầu tiên

        console.log("📦 Tổng số gói cần nhận:", totalPacket);

        hookProps.setState((prev) => ({
          ...prev,
          meterData: {
            serial: meterSerial,
            currentTime: currentDate,
            impData,
            expData,
            event,
            batteryLevel,
            latchPeriod: globalLatchPeriodMinutes.toString(),
            totalPacket: totalPacket,
          },
        }));

        if (currentDate) {
          const baseTimeMs = currentDate.getTime();
          for (let i = 0; i < recordCount; i++) {
            const start = offset + i * bytePerRecord;
            const value =
              u8CommandCode === 1
                ? parseUint32(payload.slice(start, start + bytePerRecord))
                : parseUint16(payload.slice(start, start + bytePerRecord));
            const timestampMs =
              baseTimeMs - i * globalLatchPeriodMinutes * 60_000;

            globalHistoryRecords.push({ timestampMs, value });
          }
        }
      } else {
        // 🔑 Tăng bộ đếm khi nhận thêm gói
        receivedPacketCount++;

        if (!globalLatchPeriodMinutes || globalHistoryRecords.length === 0)
          return resolve();

        const oldest = globalHistoryRecords.reduce(
          (min, r) => (r.timestampMs < min ? r.timestampMs : min),
          globalHistoryRecords[0].timestampMs
        );

        for (let i = 0; i < recordCount; i++) {
          const start = offset + i * bytePerRecord;
          const value =
            u8CommandCode === 1
              ? parseUint32(payload.slice(start, start + bytePerRecord))
              : parseUint16(payload.slice(start, start + bytePerRecord));

          const timestampMs =
            oldest - (i + 1) * globalLatchPeriodMinutes * 60_000;

          globalHistoryRecords.push({ timestampMs, value });
        }
      }

      console.log(`📥 Đã nhận gói ${receivedPacketCount}/${globalTotalPacket}`);
      resolve();
    } catch (err) {
      console.error("❌ Lỗi trong responeData:", err);
      resolve();
    }
  });
}





