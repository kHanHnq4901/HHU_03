import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface StatusBarProps {
  counts: Record<number, number>;
  onSelectStatus: (status: number) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ counts, onSelectStatus }) => {
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd'
      }}>
        {[
          { status: 2, label: 'Thất bại', color: '#f44336' },
          { status: 0, label: 'Chưa đọc', color: '#9e9e9e' },
          { status: 1, label: 'Đã đọc', color: '#4caf50' },
          { status: 4, label: 'Cảnh báo', color: '#ff9800' },
        ].map(({ status, label, color }) => (
          <TouchableOpacity
            key={status}
            style={{
              flex: 1,
              borderRadius: 8,
              padding: 8,
              marginHorizontal: 4,
              alignItems: 'center',
              backgroundColor: color
            }}
            onPress={() => onSelectStatus(status)}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
              {counts[status] || 0}
            </Text>
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#fff',
              marginTop: 2
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
