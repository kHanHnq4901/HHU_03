import React, { useState } from "react";
import { Alert } from "react-native";
import { ERROR_MESSAGES, ERROR_TABLE } from "../../service/hhu/defineEM";
export const hookProps = {} as PropsHook;
type PropsState = {
  serial: string;
  cycle: string;
  timeRange1Start: Date | null;
  timeRange1End: Date | null;
  timeRange2Start: Date | null;
  timeRange2End: Date | null;
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
      serial: "1234567890",
      cycle: "",
      
      timeRange1Start: null,
      timeRange1End: null,
      timeRange2Start: null,
      timeRange2End: null,

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
  
    if (!payload || payload.length < 3) {
      Alert.alert("Lỗi", "Payload không hợp lệ!");
      return;
    }
  
    const errorCode = payload[0] as ERROR_TABLE; // u8Res
    const command = payload[1]; // u8CommandCode
    const paramCount = payload[2]; // u8ParamCount
  
    if (errorCode !== ERROR_TABLE.E_SUCCESS) {
      const message = ERROR_MESSAGES[errorCode] || "Lỗi không xác định";
      Alert.alert("❌ Lỗi", message);
      return;
    }
  
    console.log(`✅ Thành công - Command=${command}, ParamCount=${paramCount}`);
  
    let offset = 3; // bắt đầu đọc LoraParamSettingType từ byte thứ 3
    for (let i = 0; i < paramCount; i++) {
      if (offset + 2 > payload.length) {
        console.warn("⚠️ Payload thiếu dữ liệu cho param", i);
        break;
      }
  
      const paramId = payload[offset];
      const lenParam = payload[offset + 1];
      const paramData = payload.slice(offset + 2, offset + 2 + lenParam);
  
      console.log(
        `📌 Param ${i + 1}: paramId=${paramId}, len=${lenParam}, data=`,
        paramData
      );
  
      applySetting(paramId, paramData);
      offset += 2 + lenParam;
    }
  
    if (offset < payload.length) {
      console.log("ℹ️ Còn dư dữ liệu trong payload:", payload.slice(offset));
    }
  }
  

function applySetting(paramId: number, paramData: number[]) {
  switch (paramId) {
    case 0x00: // LORA_WAKEUP_TIME (4 byte: [cycle, h1, h2, h3] tuỳ định nghĩa)
      if (paramData.length === 4) {
        const hour1 = paramData[0];
        const hour2 = paramData[1];
        const hour3 = paramData[2];
        const hour4 = paramData[3];

        hookProps.setState(prev => ({
          ...prev,
          timeRange1Start:new Date(2025, 0, 1, hour1, 0),
          timeRange1End: new Date(2025, 0, 1, hour2, 0),
          timeRange2Start: new Date(2025, 0, 1, hour3, 0),
          timeRange2End: new Date(2025, 0, 1, hour4, 0),
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
        // Little-endian
        const value = (paramData[0] & 0xff) | ((paramData[1] & 0xff) << 8);
    
        hookProps.setState(prev => ({
          ...prev,
          cycle: value.toString(), // ✅ ép sang string
        }));
    
        console.log("🔄 LORA_PERIOD_LATCH_ID:", value);
      }
      break;
  }
}

  
