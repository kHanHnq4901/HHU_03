import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface FloatingReadButtonProps {
  onPress: () => void;
}

export const FloatingReadButton: React.FC<FloatingReadButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={{ position: 'absolute', bottom: 80, alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 30, backgroundColor: '#4caf50' }} onPress={onPress}>
    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Đọc</Text>
  </TouchableOpacity>
);
