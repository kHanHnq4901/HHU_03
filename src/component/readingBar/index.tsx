// ReadingBar.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  status: "reading" | "success" | "fail" | null;
  meterNo?: string;
  name?: string;
};

export const ReadingBar = ({ status, meterNo, name }: Props) => {
  if (!status) return null;

  let bgColor = "#2196f3";
  let text = "";
  switch (status) {
    case "reading": text = `Đang đọc: ${meterNo} (${name})`; break;
    case "success": text = `✅ Đọc thành công: ${meterNo}`; bgColor = "#4caf50"; break;
    case "fail": text = `❌ Đọc thất bại: ${meterNo}`; bgColor = "#f44336"; break;
  }

  return (
    <View style={[styles.bar, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: { color: '#fff', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
});
