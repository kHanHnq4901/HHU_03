import React from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import { useRoute } from "@react-navigation/native";
import { hookProps, useHookProps } from "./controller";
import { LoadingOverlay } from "../../component/loading ";

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export const DetailMeterScreen = () => {
  const route = useRoute<any>();
  const { meter } = route.params;

  useHookProps(meter.METER_NO);

  const meterData = hookProps.state.meterData;
  const historyData = hookProps.state.historyData ?? [];
  const topRecords = historyData.slice(0, 90); // ✅ tuỳ theo độ dài

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ===== THÔNG TIN METER ===== */}
        {meterData && (
          <>
            <Text style={styles.sectionTitle}>📊 Kết quả đọc</Text>
            <InfoRow label="🔧 Serial" value={meterData.METER_NO} />
            <InfoRow
              label="⏰ Thời gian"
              value={new Date(meterData.TIMESTAMP).toLocaleString("vi-VN")}
            />
            <InfoRow label="🔢 Chỉ số xuôi" value={meterData.IMPORT_DATA} />
            <InfoRow label="📤 Chỉ số ngược" value={meterData.EXPORT_DATA} />
            <InfoRow label="🔋 Pin" value={meterData.BATTERY} />
            <InfoRow label="⏱ Chu kỳ chốt" value={meterData.PERIOD} />

            <Text style={styles.sectionTitle}>📝 Sự kiện</Text>
            {meterData.EVENT ? (
              <Text style={styles.eventItem}>• {meterData.EVENT}</Text>
            ) : (
              <Text style={styles.eventItem}>Không có sự kiện</Text>
            )}
          </>
        )}

        {/* ===== LIST HISTORY ===== */}
        {topRecords.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              📂 {topRecords.length} bản ghi gần nhất
            </Text>
            <FlatList
              data={topRecords}
              keyExtractor={(_, idx) => idx.toString()}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.recordItem,
                    index % 2 === 0 && { backgroundColor: "#f7f9fc" },
                  ]}
                >
                  <Text style={styles.recordIndex}>{index + 1}</Text>
                  <Text style={styles.recordDate}>
                    {new Date(item.TIMESTAMP).toLocaleString("vi-VN")}
                  </Text>
                  <Text style={styles.recordValue}>{item.DATA_RECORD}</Text>
                </View>
              )}
            />
          </>
        ) : (
          <Text style={styles.noData}>Không có dữ liệu lịch sử</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 8 },
  scrollContent: { paddingBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
    color: "#1e293b",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: { fontSize: 14, color: "#374151", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#0f172a", fontWeight: "bold" },
  eventItem: { fontSize: 13, color: "#4b5563", marginBottom: 2 },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  recordIndex: { fontWeight: "bold", width: 30, textAlign: "center" },
  recordDate: { flex: 1, fontSize: 12, color: "#64748b" },
  recordValue: { fontWeight: "bold", fontSize: 13, color: "#1e293b" },
  noData: { textAlign: "center", color: "#9ca3af", marginTop: 20 },
});
