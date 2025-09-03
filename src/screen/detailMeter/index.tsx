import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { hookProps, useHookProps } from "./controller";
import { LoadingOverlay } from "../../component/loading ";

export const DetailMeterScreen = () => {
   useHookProps();
  const route = useRoute<any>();
  const { meter } = route.params;

  const meterRecords = hookProps.state.dataMeter
    .filter((rec) => rec.DATA_RECORD === meter.METER_NO)
    .slice(0, 90);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
        <LoadingOverlay visible={hookProps.state.isLoading} message={hookProps.state.textLoading} />
      <Text style={styles.header}>90 bản ghi gần nhất của {meter.METER_NO}</Text>
      <ScrollView>
        {meterRecords.length > 0 ? (
          meterRecords.map((rec, idx) => (
            <View key={idx} style={styles.recordItem}>
              <Text style={styles.recordIndex}>{idx + 1}.</Text>
              <Text style={styles.recordText}>
                {rec.IMPORT_DATA}/{rec.EXPORT_DATA}{" "}
                <Text style={{ color: "#888" }}>({rec.TIMESTAMP})</Text>
              </Text>
            </View>
          ))
        ) : (
          <Text>Không có dữ liệu</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#333" },
  recordItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recordIndex: { fontWeight: "bold", width: 30 },
  recordText: { fontSize: 14, color: "#333" },
});
