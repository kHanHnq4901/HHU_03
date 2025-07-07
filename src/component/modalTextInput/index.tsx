import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { Colors, normalize, sizeScreen } from '../../theme';
import { TextInputProps } from 'react-native';

let valueTextInput: string = '';

type Props = {
  show: boolean;
  label: string;
  onOkPress: (value: string) => void;
  onDissmiss?: () => void;
} & TextInputProps;
export function ModalTextInput(props: Props) {
  return (
    <Portal>
      <Modal
        visible={props.show}
        onDismiss={props.onDissmiss}
        contentContainerStyle={styles.container}>
        <View style={styles.containerModal}>
          <View style={styles.header}>
            <Text style={styles.label}>{props.label}</Text>
          </View>
          <View style={styles.content}>
            <TextInput
              // onSubmitEditing={e => {
              //   valueTextInput = e.nativeEvent.text;
              // }}
              onChangeText={text => {
                valueTextInput = text.trim();
              }}
              style={styles.textInput}
              {...props}
            />
          </View>
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={props.onDissmiss}
              style={styles.subFooter}>
              <Text style={styles.labelFooter}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                props.onOkPress(valueTextInput);
                valueTextInput = '';
              }}
              style={styles.subFooter}>
              <Text style={styles.labelFooter}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  containerModal: {
    position: 'absolute',
    top: sizeScreen.height * 0.2,
    borderRadius: 10,
    backgroundColor: 'white',
    width: sizeScreen.width * 0.8,
    maxWidth: 250,
  },
  header: {
    height: 45,

    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  footer: {
    height: 60,
    flexDirection: 'row',
  },
  subFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    color: Colors.text,
    fontSize: normalize(20),
  },
  labelFooter: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  textInput: {
    fontSize: normalize(23),
    color: Colors.text,
    //borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    borderRadius: 10,
    backgroundColor: Colors.backgroundColor,
  },
});
