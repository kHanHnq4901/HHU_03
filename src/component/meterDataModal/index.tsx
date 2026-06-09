import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface MeterDataModalProps {
  visible: boolean;
  onClose: () => void;
  meterData?: {
    serial?: string;
    currentTime?: Date;
    impData?: number;
    expData?: number;
    event?: string;
    batteryLevel?: number;
    dataRecords?: { timestamp?: Date; value?: number }[];
  } ;
  isLoading?: boolean;
  textLoading?: string;
}

export const MeterDataModal: React.FC<MeterDataModalProps> = ({
  visible,
  onClose,
  meterData,
  isLoading = false,
  textLoading = "Đang tải dữ liệu...",
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            maxHeight: "85%",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          {isLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={{ marginTop: 10, fontSize: 16, color: "#555" }}>{textLoading}</Text>
            </View>
          ) : (
            <FlatList
              data={meterData?.dataRecords || []}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: "#f9f9f9",
                    marginBottom: 8,
                  }}
                >
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
                  <Text style={{ marginLeft: 6, flex: 1, color: "#333" }}>
                    {item.timestamp?.toLocaleString("vi-VN", { hour12: false }) || ""}
                  </Text>
                  <MaterialCommunityIcons name="chart-line" size={20} color="#4CAF50" />
                  <Text style={{ marginLeft: 6, fontWeight: "600", color: "#4CAF50" }}>
                    {item.value}
                  </Text>
                </View>
              )}
              ListHeaderComponent={
                <>
                  {/* Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: "700", color: "#2196F3" }}>
                      📊 Dữ liệu đồng hồ
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                      <MaterialCommunityIcons name="close-circle" size={28} color="#f44336" />
                    </TouchableOpacity>
                  </View>

                  {/* Thông tin hiện tại */}
                  {meterData && (
                    <View
                      style={{
                        backgroundColor: "#f1f8ff",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 16,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
                        ⚡ Thông tin hiện tại
                      </Text>
                      <Text>🔢 Serial: {meterData.serial}</Text>
                      <Text>
                        🕒 Thời gian:{" "}
                        {meterData.currentTime?.toLocaleString("vi-VN", { hour12: false }) ||
                          "N/A"}
                      </Text>
                      <Text>⬇️ Chỉ số xuôi: {meterData.impData}</Text>
                      <Text>⬆️ Chỉ số ngược: {meterData.expData}</Text>
                      <Text>📌 Sự kiện: {meterData.event}</Text>
                      <Text>🔋 Pin: {meterData.batteryLevel}%</Text>
                    </View>
                  )}

                  {/* Tiêu đề lịch sử */}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 8,
                      color: "#333",
                    }}
                  >
                    📝 Lịch sử {meterData?.dataRecords?.length} bản tin 
                  </Text>
                </>
              }
              ListEmptyComponent={
                <Text style={{ textAlign: "center", padding: 16, color: "#888" }}>
                  Không có dữ liệu lịch sử.
                </Text>
              }
              style={{ maxHeight: 600 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
