import React from "react";
import { View, Text, StyleSheet, Modal } from "react-native";
import * as Progress from "react-native-progress";

interface SyncOverlayProps {
  visible: boolean;
  progress: number; // số % tiến trình (0–100)
}

const SyncOverlay: React.FC<SyncOverlayProps> = ({ visible, progress }) => {
  const normalizedProgress = Math.min(Math.max(progress / 100, 0), 1); // 0–1

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Đang đồng bộ...</Text>

          {/* Thanh progress */}
          <Progress.Bar
            progress={normalizedProgress}
            width={200}
            height={12}
            color="#4CAF50"
            unfilledColor="rgba(255,255,255,0.2)"
            borderWidth={0}
            borderRadius={8}
            animationType="spring"
            useNativeDriver
          />

          {/* Text phần trăm */}
          <Text style={styles.percentText}>{progress}%</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    width: 280,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  percentText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default SyncOverlay;
