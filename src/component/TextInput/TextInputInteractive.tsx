import React from 'react';
import { StyleSheet, View } from 'react-native';
import TextInput, {
  IInteractiveTextInputProps,
} from 'react-native-text-input-interactive';
import { Fonts } from '../../theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
} & IInteractiveTextInputProps;

export const TextInputInteractive = (props: Props) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        textInputStyle={styles.textInputStyle}
        keyboardType="numeric"
        {...props}
        placeholder={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        selectTextOnFocus={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // width: '100%',
    //paddingHorizontal: '10%',
    justifyContent: 'center',
    marginVertical: 10,
  },
  textInput: {
    //fontSize: 20,
    width: 150,
    fontFamily: Fonts,
  },
  textInputStyle: {
    width: '100%',
  },
});
