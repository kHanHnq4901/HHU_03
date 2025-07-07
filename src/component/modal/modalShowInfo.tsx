import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Modal, Portal, Divider } from 'react-native-paper';
import { storeContext } from '../../store';
import { Colors, normalize } from '../../theme/index';

type Props = {
  title: string;
  info: string;
  onDismiss?: () => void;
};

export const ModalInfo = (props: Props) => {
  const store = useContext(storeContext);
  const onDismiss = () => {
    store?.setState(state => {
      state.modal.showInfo = false;
      return { ...state };
    });
    if (props.onDismiss) {
      props.onDismiss();
    }
  };
  return (
    <Portal>
      <Modal
        visible={store?.state.modal.showInfo as boolean}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.titleHeader}>{props.title ?? 'Thông tin'}</Text>
        </View>
        <Divider />
        <View style={styles.body}>
          <Text style={styles.titleBody}>{props.info}</Text>
        </View>
        <Divider />
        <TouchableOpacity style={styles.footer} onPress={onDismiss}>
          <Text style={styles.titleBottom}>OK</Text>
        </TouchableOpacity>
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
  titleHeader: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: 'black',
  },
  titleBottom: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  titleBody: {
    fontSize: normalize(18),
    lineHeight: normalize(25),
    color: 'black',
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
