import React, { useState } from "react";
import { Alert } from "react-native";
import { ERROR_MESSAGES, ERROR_TABLE } from "../../service/hhu/defineEM";
export const hookProps = {} as PropsHook;
type PropsState = {
  serial: string;
  cycle: string;
  timeRange1Start: Date;
  timeRange1End: Date;
  timeRange2Start: Date;
  timeRange2End: Date;
  pickerMode: null | string;
  daysPerMonth: number[];
  openDays: boolean;
  dayItems: { label: string; value: number }[];
  readCycle: boolean;
  readTimeRange : boolean
  readDaysPerMonth: boolean;
};

type PropsHook = {
  state: PropsState;
  setState: React.Dispatch<React.SetStateAction<PropsState>>;
  formatHour: (date: Date) => string;
  onChangeTime: (mode: string, selectedDate?: Date) => void;
};

// ---- Custom hook ----
  export const useHookProps = (): PropsHook => {
    const [state, setState] = useState<PropsState>({
      serial: "",
      cycle: "2",
      
      timeRange1Start: new Date(),
      timeRange1End: new Date(),
      timeRange2Start: new Date(),
      timeRange2End: new Date(),

      pickerMode: null,

      daysPerMonth: [],
      openDays: false,
      dayItems: Array.from({ length: 28 }, (_, i) => ({
        label: `${i + 1}`,
        value: i + 1,
      })),

      readCycle: true,
      readTimeRange: true,
      readDaysPerMonth: true,
    });

    const formatHour = (date: Date) =>
      date.getHours().toString().padStart(2, "0") + " h";

    const onChangeTime = (mode: string, selectedDate?: Date) => {
      if (!selectedDate) {
        setState(prev => ({ ...prev, pickerMode: null }));
        return;
      }

      const date = new Date(selectedDate);
      date.setMinutes(0);
      date.setSeconds(0);

      // Kiểm tra phạm vi sáng
      if (mode === "t1start" || mode === "t1end") {
        if (date.getHours() < 0 || date.getHours() > 12) {
          Alert.alert("Lỗi", "Khoảng giờ sáng chỉ được từ 0h đến 12h");
          setState(prev => ({ ...prev, pickerMode: null }));
          return;
        }
      }

      // Kiểm tra phạm vi chiều
      if (mode === "t2start" || mode === "t2end") {
        if (date.getHours() < 12 || date.getHours() > 23) {
          Alert.alert("Lỗi", "Khoảng giờ chiều chỉ được từ 12h đến 24h");
          setState(prev => ({ ...prev, pickerMode: null }));
          return;
        }
      }

      // Kiểm tra giờ bắt đầu < giờ kết thúc
      if (mode === "t1start" && date >= state.timeRange1End) {
        Alert.alert("Lỗi", "Giờ bắt đầu phải nhỏ hơn giờ kết thúc (sáng)");
        setState(prev => ({ ...prev, pickerMode: null }));
        return;
      }
      if (mode === "t1end" && date <= state.timeRange1Start) {
        Alert.alert("Lỗi", "Giờ kết thúc phải lớn hơn giờ bắt đầu (sáng)");
        setState(prev => ({ ...prev, pickerMode: null }));
        return;
      }
      if (mode === "t2start" && date >= state.timeRange2End) {
        Alert.alert("Lỗi", "Giờ bắt đầu phải nhỏ hơn giờ kết thúc (chiều)");
        setState(prev => ({ ...prev, pickerMode: null }));
        return;
      }
      if (mode === "t2end" && date <= state.timeRange2Start) {
        Alert.alert("Lỗi", "Giờ kết thúc phải lớn hơn giờ bắt đầu (chiều)");
        setState(prev => ({ ...prev, pickerMode: null }));
        return;
      }

      // Nếu hợp lệ thì update state
      setState(prev => {
        const newState = { ...prev };
        if (mode === "t1start") newState.timeRange1Start = date;
        if (mode === "t1end") newState.timeRange1End = date;
        if (mode === "t2start") newState.timeRange2Start = date;
        if (mode === "t2end") newState.timeRange2End = date;
        newState.pickerMode = null;
        return newState;
      });
    };
    hookProps.state = state;
    hookProps.setState = setState;
    hookProps.formatHour = formatHour
    hookProps.onChangeTime = onChangeTime
    return hookProps ;
  };

  export function responeSetting(payload: number[]) {
    console.log("🔹 Xử lý Setting:", payload);
  
    if (!payload || payload.length < 2) {
      Alert.alert("Lỗi", "Payload không hợp lệ!");
      return;
    }
  
    const errorCode = payload[0] as ERROR_TABLE;
    const command = payload[1];
  
    if (errorCode !== ERROR_TABLE.E_SUCCESS) {
      const message = ERROR_MESSAGES[errorCode] || "Lỗi không xác định";
      Alert.alert("❌ Lỗi", message);
      return;
    }
  
    switch (command) {
      case 2: {
        // ✅ Get toàn bộ settings
        const settingCount = payload[2];
        console.log(`✅ Thành công - có ${settingCount} settings`);
  
        let offset = 3;
        for (let i = 0; i < settingCount; i++) {
          const paramId = payload[offset];
          const lenParam = payload[offset + 1];
          const paramData = payload.slice(offset + 2, offset + 2 + lenParam);
  
          console.log(
            `📌 Setting ${i + 1}: paramId=${paramId}, len=${lenParam}, data=`,
            paramData
          );
  
          applySetting(paramId, paramData);
          offset += 2 + lenParam;
        }
        break;
      }
  
      case 3: {
        // ✅ Get LORA_CMD_TIME_WAKEUP
        const count = payload[2]; // byte đếm số config
        const data = payload.slice(3, 3 + count); // lấy đúng count byte data
        console.log("⏰ LORA_CMD_TIME_WAKEUP:", data);
        applySetting(0x00, data);
        break;
      }
  
      case 4: {
        // ✅ Get LORA_CMD_WAKEUP_SPECIFIC_DAYS
        const count = payload[2];
        const data = payload.slice(3, 3 + count);
        console.log("📅 LORA_CMD_WAKEUP_SPECIFIC_DAYS:", data);
        applySetting(0x01, data);
        break;
      }
  
      case 5: {
        // ✅ Get LORA_CMD_PERIOD_LATCH
        const count = payload[2];
        const data = payload.slice(3, 3 + count);
        console.log("🔄 LORA_CMD_PERIOD_LATCH:", data);
        applySetting(0x02, data);
        break;
      }
  
      default:
        console.log(`⚠️ Command ${command} chưa được hỗ trợ`);
    }
  }
  
  

function applySetting(paramId: number, paramData: number[]) {
  switch (paramId) {
    case 0x00: // LORA_WAKEUP_TIME (4 byte: [cycle, h1, h2, h3] tuỳ định nghĩa)
      if (paramData.length === 4) {
        const cycle = paramData[0];
        const hour1 = paramData[1];
        const hour2 = paramData[2];
        const hour3 = paramData[3];

        hookProps.setState(prev => ({
          ...prev,
          cycle: String(cycle),
          timeRange1Start: new Date(2025, 0, 1, hour1, 0),
          timeRange1End: new Date(2025, 0, 1, hour2, 0),
          timeRange2Start: new Date(2025, 0, 1, hour3, 0),
        }));
      }
      break;

    case 0x01: // LORA_WAKEUP_SPECIFIC_DAYS_ID (7 byte: danh sách ngày trong tháng)
      if (paramData.length === 7) {
        hookProps.setState(prev => ({
          ...prev,
          daysPerMonth: paramData, // array [d1, d2, ... d7]
        }));
      }
      break;

    case 0x02: // LORA_PERIOD_LATCH_ID (2 byte uint16_t)
      if (paramData.length === 2) {
        // Giả sử theo little-endian
        const value = (paramData[0] & 0xff) | ((paramData[1] & 0xff) << 8);
    
        hookProps.setState(prev => ({
          ...prev,
          periodLatch: value, // ✅ lưu thẳng số 16-bit vào state
        }));
    
        console.log("🔄 LORA_PERIOD_LATCH_ID:", value);
      }
      break;
      console.log(`⚠️ Chưa xử lý paramId=${paramId}, data=`, paramData);
  }
}

  
