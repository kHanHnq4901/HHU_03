import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      {/* ✅ Chặn toàn bộ thao tác bằng TouchableWithoutFeedback */}
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <ActivityIndicator size="large" color="#1A73E8" />
            {message && <Text style={styles.text}>{message}</Text>}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});