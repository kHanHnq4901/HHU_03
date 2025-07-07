import React, { useContext } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { Modal, Portal, Divider } from 'react-native-paper';
import { Colors, normalize } from '../../theme/index';

type Props = {
  visible: boolean;
  title: string;
  onOKPress?: (text: string) => void;
  onDismiss?: () => void;
};

let name: string = '';

export const ModalGetText = (props: Props) => {
  function onOkPress() {
    if (props.onOKPress) {
      props.onOKPress(name);
      //console.log('name1:', name);
    }
    name = '';
  }

  function onDissmissPress() {
    if (props.onDismiss) {
      props.onDismiss();
    }

    name = '';
  }

  return (
    <Portal>
      <Modal
        visible={props.visible}
        onDismiss={props.onDismiss}
        contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.titleHeader}>{props.title ?? 'Thông tin'}</Text>
        </View>
        <Divider />
        <View style={styles.body}>
          <TextInput
            style={styles.titleBody}
            // onSubmitEditing={({ nativeEvent }) => {
            //   name = nativeEvent.text;
            // }}
            onChangeText={text => {
              name = text;
            }}
          />
        </View>
        <Divider />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.subfooter} onPress={onDissmissPress}>
            <Text style={styles.titleBottom}>Hủy</Text>
          </TouchableOpacity>
          <View style={styles.deivider} />
          <TouchableOpacity style={styles.subfooter} onPress={onOkPress}>
            <Text style={styles.titleBottomOK}>Ok</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};
const styles = StyleSheet.create({
  modal: {
    width: '80%',
    height: 200,
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
  titleBottomOK: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.primary,
  },
  titleBottom: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  titleBody: {
    fontSize: normalize(18),
    // lineHeight: normalize(25),
    color: 'black',
    backgroundColor: Colors.backgroundIcon,
    width: '100%',
    borderRadius: 15,
    textAlign: 'center',
    paddingVertical: 5,
  },
  deivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.backgroundIcon,
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
