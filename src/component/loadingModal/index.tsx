import React from 'react';
import { View, Modal, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  task?: string;
  modalVisible: boolean;
  // title: string;
};

export default function LoadingModal(props: Props) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={props.modalVisible === true ? true : false}
      statusBarTranslucent={true}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {props.task ? (
            <Text style={styles.modalText}>{props.task}</Text>
          ) : (
            <Text style={styles.modalText}>Loading... </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0008',
    // backgroundColor: 'pink',
  },
  modalView: {
    margin: 20,
    // width: 200,
    // height: 70,
    backgroundColor: 'white',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    paddingHorizontal: 15,
  },

  modalText: {
    marginVertical: 15,
    textAlign: 'center',
    fontSize: 17,
    marginLeft: 15,
  },
});
