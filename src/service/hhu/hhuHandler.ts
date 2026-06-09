import { Alert } from "react-native";
import { send } from "../../util/ble";
import { buildQueryDataPacket } from "../../service/hhu/aps/hhuAps";
import { parseResponsePayload } from "../../service/hhu/hhuParser";
import { removeBleListener } from "../../service/hhu/ble";
import { hhuState } from "../../service/hhu/hhuState";
import { HuResponseCode, getHuResponseMsg } from "../../service/hhu/huResponse";
import { Buffer } from "buffer";
import { store } from "../../screen/overview/controller";
import { HookProps } from "../../screen/readDataMeter/controller";
export function createHhuHandler(hookProps: any) {
  let timeoutRetry: NodeJS.Timeout | null = null;
  let ackTimeout: NodeJS.Timeout | null = null;
  let hasFinished = false;          // cleanup done
  let hasCompletedRead = false;     // ✅ đã đọc đủ dữ liệu
  let hasReceivedAnyPacket = false;
  let isProcessing = false;

  const packetRawMap: Map<number, number[]> = new Map();
  const perPacketRetries: Map<number, number> = new Map();
  let expectedTotalPackets = 0;
  let nextToProcessIndex = 1;
  let accumulatedRecords: any[] = [];
  let currentMeterData: any = null;
  let latchPeriodMinutesLocal = 0;

  let lastRequestedSerial: string | null = null;

  const ACK_TIMEOUT_MS = 400;
  const MISSING_PACKET_TIMEOUT_MS = 4000;

  const getMaxRetry = () => {
    const v = store?.state?.appSetting?.setting?.retryCount;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };

  const clearAckTimeout = () => {
    if (ackTimeout) {
      clearTimeout(ackTimeout);
      ackTimeout = null;
    }
  };

  const clearRetryTimeout = () => {
    if (timeoutRetry) {
      clearTimeout(timeoutRetry);
      timeoutRetry = null;
    }
  };

  const markReadFailed = (meterSerial?: string, reason?: string) => {
    const serial = meterSerial ?? lastRequestedSerial ?? hookProps.state?.selectedMeterNo ?? null;
    if (!serial) {
      console.warn("markReadFailed: no serial available");
      cleanup();
      return;
    }

    const meter = (hookProps.state.listMeter || []).find((m: any) => m.METER_NO === serial || m.SERIAL === serial);
    const name = meter?.CUSTOMER_NAME ?? serial;

    try {
      hookProps.setState((prev: any) => ({
        ...prev,
        readingStatus: { meterNo: serial, name, status: "fail" as const },
        listMeter: prev.listMeter.map((m: any) =>
          m.METER_NO === (meter?.METER_NO ?? serial) ? { ...m, STATUS: "2" } : m
        ),
        isReading: false,
        isLoading: false,
        textLoading: reason ? `Lỗi: ${reason}` : prev.textLoading,
      }));
    } catch (err) {
      console.warn("markReadFailed: hookProps.setState failed", err);
    }

    console.warn(`Mark read failed for ${serial}. Reason: ${reason ?? "retry exceeded"}`);
    cleanup();
  };

  const cleanup = () => {
    console.log("🧹 cleanup - reset state & resources");
    clearRetryTimeout();
    clearAckTimeout();

    try {
      removeBleListener();
    } catch {}

    hhuState.dataQueue = [];

    hasFinished = true;       // ✅ đánh dấu cleanup
    isProcessing = false;

    packetRawMap.clear();
    perPacketRetries.clear();
    expectedTotalPackets = 0;
    nextToProcessIndex = 1;
    accumulatedRecords = [];
    currentMeterData = null;
    latchPeriodMinutesLocal = 0;
    lastRequestedSerial = null;

    try {
      hookProps.setState((prev: any) => ({
        ...prev,
        isReading: false,
        isLoading: false,
        textLoading: "",
      }));
    } catch (err) {
      console.warn("hookProps.setState failed in cleanup:", err);
    }
  };

  const finalizeProcessing = (meterSerial: string) => {
  console.log(
    "✅ finalizeProcessing: đã xử lý đủ gói, chờ 300ms trước cleanup để đảm bảo state cập nhật."
  );

  setTimeout(() => {
    if (hasFinished) return;

    const processed = nextToProcessIndex - 1;

    if (expectedTotalPackets > 0 && processed >= expectedTotalPackets) {
      // ✅ đánh dấu đã đọc đủ dữ liệu
      hasCompletedRead = true;

      // Cập nhật hookProps thống kê
      hookProps.setState((prev: { fullDataReceived: number; successCount: number; }) => ({
        ...prev,
        fullDataReceived: prev.fullDataReceived + 1,
      }));

      console.log("finalizeProcessing: điều kiện đủ -> cleanup()");
      cleanup();
    } else {
      // Nếu chưa đủ gói → xem là partial
      hookProps.setState((prev: { partialDataReceived: number; successCount: number; }) => ({
        ...prev,
        partialDataReceived: prev.partialDataReceived + 1,
      }));

      console.log(
        "finalizeProcessing: điều kiện không đủ, giữ nguyên state.",
        `Đã nhận ${processed}/${expectedTotalPackets} gói`
      );
    }
  }, 300);
};


  const handleAckTimeoutFor = (packetIndex: number) => {
    ackTimeout = null;
    const retries = perPacketRetries.get(packetIndex) ?? 0;
    const max = getMaxRetry();

    if (retries >= max) {
      console.warn(`⚠️ ACK timeout: packet ${packetIndex} exceeded retry ${retries} >= ${max}`);
      markReadFailed(lastRequestedSerial ?? undefined, `ACK timeout packet ${packetIndex}`);
      return;
    }

    perPacketRetries.set(packetIndex, retries + 1);
    console.log(`🔁 ACK timeout: retrying packet ${packetIndex} (attempt ${retries + 1})`);
    sendRequestForPacket(packetIndex, lastRequestedSerial ?? undefined);
  };

  const sendRequestForPacket = async (packetIndex: number, meterSerial?: string) => {
    lastRequestedSerial = meterSerial ?? hookProps.state?.serial ?? lastRequestedSerial;
    const serialToUse = lastRequestedSerial ?? "";
    const packet = buildQueryDataPacket(serialToUse, packetIndex, hookProps.state.isDetailedRead);

    try {
      await send(store.state.hhu.idConnected, packet);
      console.log("📤 Sent packet request", { packetIndex, serialToUse });
      hookProps.setState?.((prev: any) => ({
        ...prev,
        textLoading: `Đang đọc dữ liệu... gửi yêu cầu gói ${packetIndex}`,
      }));

      clearAckTimeout();
      ackTimeout = setTimeout(() => handleAckTimeoutFor(packetIndex), ACK_TIMEOUT_MS);
    } catch (err) {
      console.error(`❌ Error sending packet ${packetIndex}:`, err);
      handleAckTimeoutFor(packetIndex);
    }
  };

  const resetTimeout = (meterSerial: string) => {
    clearRetryTimeout();
    timeoutRetry = setTimeout(() => {
      if (isProcessing) {
        console.log("⏳ resetTimeout fired but isProcessing true -> reschedule");
        resetTimeout(meterSerial);
        return;
      }
      console.log("⏰ resetTimeout fired => checkAndRequestMissingPackets");
      checkAndRequestMissingPackets(meterSerial);
    }, MISSING_PACKET_TIMEOUT_MS);
  };

  const checkAndRequestMissingPackets = async (meterSerial: string) => {
    if (hasFinished) return;

    if (!currentMeterData) {
      const retries = perPacketRetries.get(1) ?? 0;
      if (retries >= getMaxRetry()) {
        console.warn(`⚠️ Gói 1 retry exceeded (${retries}) -> dừng đọc.`);
        markReadFailed(meterSerial, "Không nhận được gói khởi tạo (gói 1)");
        return;
      }
      perPacketRetries.set(1, retries + 1);
      console.log(`📡 gói 1 chưa có -> retry lần ${retries + 1}`);
      await sendRequestForPacket(1, meterSerial);
      resetTimeout(meterSerial);
      return;
    }

    if (expectedTotalPackets <= 0) return;

    if (packetRawMap.size === expectedTotalPackets) {
      await tryProcessSequentialPackets(meterSerial);
      return;
    }

    const missing: number[] = [];
    for (let i = 1; i <= expectedTotalPackets; i++) {
      if (!packetRawMap.has(i)) missing.push(i);
    }

    if (missing.length === 0) {
      await tryProcessSequentialPackets(meterSerial);
      return;
    }

    console.log(`📡 Missing packets: [${missing.join(", ")}]`);
    for (const idx of missing) {
      const retries = perPacketRetries.get(idx) ?? 0;
      if (retries >= getMaxRetry()) {
        console.warn(`⚠️ Gói ${idx} retry exceeded`);
        markReadFailed(meterSerial, `Không nhận được gói ${idx} sau ${retries} lần thử`);
        return;
      }
      perPacketRetries.set(idx, retries + 1);
      await sendRequestForPacket(idx, meterSerial);
    }
    resetTimeout(meterSerial);
  };

  const tryProcessSequentialPackets = async (meterSerial: string) => {
    if (hasFinished || isProcessing) return;

    isProcessing = true;
    try {
      while (packetRawMap.has(nextToProcessIndex)) {
        const rawPayload = packetRawMap.get(nextToProcessIndex)!;
        const result = parseResponsePayload(rawPayload, meterSerial, accumulatedRecords, latchPeriodMinutesLocal);

        if (nextToProcessIndex === 1 && result?.meterData) {
          currentMeterData = result.meterData;
          latchPeriodMinutesLocal = parseInt(String(result.meterData.latchPeriod || latchPeriodMinutesLocal), 10) || latchPeriodMinutesLocal;
          if (result.totalPacket && result.totalPacket > 0) {
            expectedTotalPackets = result.totalPacket;
            hhuState.globalTotalPacket = expectedTotalPackets;
          }
          if (result.meterData?.latchPeriod) {
            hhuState.globalLatchPeriodMinutes = parseInt(String(result.meterData.latchPeriod), 10) || hhuState.globalLatchPeriodMinutes;
          }
        }

        accumulatedRecords = result.historyRecords ?? accumulatedRecords;

        try {
          hookProps.setState((prev: any) => ({
            ...prev,
            meterData: result.meterData ?? prev.meterData ?? null,
            historyData: accumulatedRecords.length
              ? {
                  serial: meterSerial,
                  dataRecords: accumulatedRecords.map((r: any) => ({
                    timestamp: r.timestamp,
                    value: r.value,
                  })),
                }
              : prev.historyData ?? null,
            textLoading: `Đã xử lý ${nextToProcessIndex - 1}/${expectedTotalPackets || "?"} gói`,
          }));
        } catch (e) {
          console.warn("hookProps.setState failed", e);
        }

        hhuState.receivedPacketCount = Math.max(hhuState.receivedPacketCount, nextToProcessIndex);
        packetRawMap.delete(nextToProcessIndex);
        nextToProcessIndex++;
      }

      const processed = nextToProcessIndex - 1;
      if (expectedTotalPackets > 0 && processed >= expectedTotalPackets) {
        finalizeProcessing(meterSerial);
      } else if (expectedTotalPackets > 0 && packetRawMap.size < expectedTotalPackets) {
        resetTimeout(meterSerial);
      }
    } catch (err) {
      console.error("❌ Lỗi trong tryProcessSequentialPackets:", err);
      cleanup();
    } finally {
      isProcessing = false;
    }
  };

  const responeData = async (payload: number[], meterSerial: string) => {
    try {
      const packetIndex = typeof payload[1] === "number" ? payload[1] : 0;
      if (!packetIndex || hasFinished) return;

      packetRawMap.set(packetIndex, payload);
      hasReceivedAnyPacket = true;

      if (packetIndex === 1 && !currentMeterData) {
        const firstResult = parseResponsePayload(payload, meterSerial, [], 0);
        if (firstResult && firstResult.meterData) {
          currentMeterData = firstResult.meterData;
          latchPeriodMinutesLocal = parseInt(String(firstResult.meterData.latchPeriod), 10) || 0;
          expectedTotalPackets = firstResult.totalPacket || expectedTotalPackets || 0;
          if (expectedTotalPackets > 0) hhuState.globalTotalPacket = expectedTotalPackets;
          if (firstResult.meterData?.latchPeriod) {
            hhuState.globalLatchPeriodMinutes =
              parseInt(String(firstResult.meterData.latchPeriod), 10) || hhuState.globalLatchPeriodMinutes;
          }
        } else {
          const retries = perPacketRetries.get(1) ?? 0;
          if (retries >= getMaxRetry()) {
            Alert.alert("Thông báo", "Không nhận được gói khởi tạo (gói 1). Vui lòng thử lại.");
            markReadFailed(meterSerial, "Gói 1 không hợp lệ");
            return;
          }
          perPacketRetries.set(1, retries + 1);
          console.log(`🔁 Gói 1 không hợp lệ -> retry lần ${retries + 1}`);
          await sendRequestForPacket(1, meterSerial);
          return;
        }
      }

      await tryProcessSequentialPackets(meterSerial);

      if (!hasFinished && expectedTotalPackets > 0 && packetRawMap.size < expectedTotalPackets) {
        resetTimeout(meterSerial);
      }
    } catch (err) {
      console.error("❌ Lỗi trong responeData:", err);
      cleanup();
    }
  };

 const hhuHandleReceiveData = async (
    data: { value: number[] }
  ): Promise<{ success: boolean } | undefined> => {
    if (hasFinished) return;

    console.log("Dữ liệu phản hồi về (raw):", data.value);

    const buf = Buffer.from(data.value);

    // Xử lý gói ACK (0xAA)
    if (buf[0] === 0xAA) {
      const response = buf[2];
      const msg = getHuResponseMsg(response);
      clearAckTimeout();

      if (response === HuResponseCode.CMD_RESP_SUCCESS) {
      hookProps.setState((prev: { successCount: number; }) => ({
        ...prev,
        successCount: prev.successCount + 1, // Gửi thành công
      }));
    } else {
      hookProps.setState((prev: { failCount: number; }) => ({
        ...prev,
        failCount: prev.failCount + 1, // Gửi thất bại
      }));
      Alert.alert("Thông báo", "Thiết bị báo lỗi: " + msg);
      cleanup();
    }
  }

  // Kiểm tra gói dữ liệu hợp lệ
  if (buf.length < 15 || buf[0] !== 0x08) return;

  const commandType = buf[1];
  const lenPayload = buf[2];
  const meterSerial = buf.slice(3, 7).toString("ascii");
  const payload = Array.from(buf.slice(7, 7 + lenPayload));

  if (commandType === 0x01) {
    try {
      await responeData(payload, meterSerial);
      return { success: true }; // gói này đã nhận và xử lý thành công
    } catch (err) {
      console.error("❌ Lỗi xử lý payload:", err);
      return { success: false };
    }
  }

  // Các loại command khác có thể thêm vào ở đây
  return { success: false };
};



  const prepareForRead = () => {
    clearRetryTimeout();
    clearAckTimeout();

    packetRawMap.clear();
    perPacketRetries.clear();
    expectedTotalPackets = 0;
    nextToProcessIndex = 1;
    accumulatedRecords = [];
    currentMeterData = null;
    latchPeriodMinutesLocal = 0;
    hasFinished = false;
    hasCompletedRead = false;   // ✅ reset flag
    hasReceivedAnyPacket = false;
    isProcessing = false;
    lastRequestedSerial = null;

    try {
      hookProps.setState((prev: any) => ({
        ...prev,
        isReading: true,
        meterData: null,
        historyData: null,
        textLoading: "Đang đọc dữ liệu",
        currentTime: new Date(),
      }));
    } catch (err) {
      console.error("❌ Lỗi khi gọi hookProps.setState:", err);
    }
  };

  return {
    prepareForRead,
    hhuHandleReceiveData,
    cleanup,
    getMaxRetry,
    _internal: {
      hasFinished: () => hasFinished,
      hasCompletedRead: () => hasCompletedRead,   // ✅ thêm ra ngoài
      hasReceivedAnyPacket: () => hasReceivedAnyPacket,
      isProcessing: () => isProcessing,
      packetRawMap,
      expectedTotalPackets: () => expectedTotalPackets,
      nextToProcessIndex: () => nextToProcessIndex,
      getCurrentMeterData: () => currentMeterData,
      getAccumulatedRecords: () => [...accumulatedRecords],
      hasProcessedMeterData: false,
    },
  };
}
