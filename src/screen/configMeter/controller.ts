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
  isReading: boolean;
  textLoading: string;
};

type PropsHook = {
  state: PropsState;
  setState: React.Dispatch<React.SetStateAction<PropsState>>;
  formatHour: (date: Date) => string;
  onChangeTime: (mode: string, selectedDate?: Date) => void;
};

// ---- Custom hook ----fv
  export const useHookProps = (): PropsHook => {
    const [state, setState] = useState<PropsState>({
      serial: "",
      cycle: "",
      isReading: false,
      textLoading: "Đang đọc cấu hình",
      timeRange1Start: null,
      timeRange1End: null,
      timeRange2Start: null,
      timeRange2End: null,

      pickerMode: null,

      daysPerMonth: [],
      openDays: false,
      dayItems: Array.from({ length: 31 }, (_, i) => ({
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

  
  



  
