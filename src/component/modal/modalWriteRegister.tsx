import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Modal, Portal, Divider } from 'react-native-paper';
import { storeContext } from '../../store';
import { Colors, normalize } from '../../theme/index';

type Props = {
  title: string;
  info: string;
  onDismiss?: () => void;
  onOKPress?: () => void;
};

export const ModalWriteRegister = (props: Props) => {
  const store = useContext(storeContext);
  function onDismiss() {
    store?.setState(state => {
      state.modal.showWriteRegister = false;
      return { ...state };
    });
    // if (props.onDismiss) {
    //   props.onDismiss();
    // }
    if (store?.state.modal.modalAlert.onDissmiss) {
      store?.state.modal.modalAlert.onDissmiss();
    }
  }
  function onOKPress() {
    store?.setState(state => {
      state.modal.showWriteRegister = false;
      return { ...state };
    });
    // if (props.onOKPress) {
    //   props.onOKPress();
    // }
    if (store?.state.modal.modalAlert.onOKPress) {
      store?.state.modal.modalAlert.onOKPress();
    }
  }
  return (
    <Portal>
      <Modal
        visible={store?.state.modal.showWriteRegister as boolean}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.titleHeader}>
            {store?.state.modal.modalAlert.title ?? 'Thông tin'}
          </Text>
        </View>
        <Divider />
        <View style={styles.body}>
          <Text style={styles.titleBody}>
            {store?.state.modal.modalAlert.content ?? ''}
          </Text>
        </View>
        <Divider />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.subfooter} onPress={onDismiss}>
            <Text style={styles.titleBottom}>Không lưu</Text>
          </TouchableOpacity>
          <View style={styles.deivider} />
          <TouchableOpacity style={styles.subfooter} onPress={onOKPress}>
            <Text style={styles.titleBottomOK}>Vẫn lưu</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: '80%',
    height: '80%',
    elevation: 1,
    borderRadius: 30,
    backgroundColor: 'white',
    alignSelf: 'center',
  },
  deivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.backgroundIcon,
  },
  titleHeader: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.text,
  },
  titleBottom: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  titleBottomOK: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.primary,
  },
  titleBody: {
    fontSize: normalize(25),
    lineHeight: normalize(35),
    //marginVertical: 5,
    color: Colors.text,
  },

  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    //borderBottomWidth: 1,
  },
  footer: {
    //borderTopWidth: 1,
    height: 60,
    // justifyContent: 'center',
    // alignItems: 'center',
    flexDirection: 'row',
  },
  subfooter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
