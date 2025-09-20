import React from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import { useRoute } from "@react-navigation/native";
import { hookProps, useHookProps } from "./controller";
import { LoadingOverlay } from "../../component/loading";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string | number }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelWrap}>
      <Icon name={icon} size={18} color="#2563eb" style={{ marginRight: 6 }} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export const DetailMeterScreen = () => {
  const route = useRoute<any>();
  const { meter } = route.params;

  useHookProps(meter.METER_NO);

  const meterData = hookProps.state.meterData;
  const historyData = hookProps.state.historyData ?? [];
  const topRecords = historyData.slice(0, 90);

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={hookProps.state.isLoading}
        message={hookProps.state.textLoading}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ===== THÔNG TIN METER ===== */}
        {meterData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📊 Kết quả đọc</Text>
            <InfoRow icon="barcode" label="Serial" value={meterData.METER_NO} />
            <InfoRow
              icon="clock-outline"
              label="Thời gian"
              value={new Date(meterData.TIMESTAMP).toLocaleString("vi-VN")}
            />
            <InfoRow icon="arrow-down-bold-box" label="Chỉ số xuôi" value={meterData.IMPORT_DATA} />
            <InfoRow icon="arrow-up-bold-box" label="Chỉ số ngược" value={meterData.EXPORT_DATA} />
            <InfoRow icon="battery" label="Pin" value={meterData.BATTERY} />
            <InfoRow icon="calendar-sync" label="Chu kỳ chốt" value={`${meterData.PERIOD} phút`} />
          </View>
        )}

        {/* ===== SỰ KIỆN ===== */}
        {meterData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📝 Sự kiện</Text>
            {meterData.EVENT ? (
              <Text style={styles.eventItem}>• {meterData.EVENT}</Text>
            ) : (
              <Text style={styles.noData}>Không có sự kiện</Text>
            )}
          </View>
        )}
        <View style={styles.card}>
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
                      index % 2 === 0 && { backgroundColor: "#f1f5f9" },
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
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", paddingHorizontal: 10 },
  scrollContent: { paddingVertical: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1e293b",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  infoLabelWrap: { flexDirection: "row", alignItems: "center" },
  infoLabel: { fontSize: 14, color: "#374151", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#0f172a", fontWeight: "bold" },

  eventItem: { fontSize: 14, color: "#4b5563", marginBottom: 2 },
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  recordIndex: {
    fontWeight: "bold",
    width: 28,
    textAlign: "center",
    color: "#2563eb",
  },
  recordDate: { flex: 1, fontSize: 13, color: "#64748b" },
  recordValue: { fontWeight: "bold", fontSize: 14, color: "#1e293b" },

  noData: { textAlign: "center", color: "#9ca3af", marginVertical: 10 },
});
