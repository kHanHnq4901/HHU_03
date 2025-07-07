import React, { ReactNode } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native';

import AntDesign from 'react-native-vector-icons/AntDesign';
import { Colors, normalize, sizeScreen } from '../../theme/index';

type Props = {
  iconType: string;
  rightChildren?: ReactNode;
  onLeftIconPress?: () => void;
} & TextInputProps;

export const FormInput = React.forwardRef((props: Props, ref) => {
  return (
    <View style={styles.inputContainer}>
      <Pressable onPress={props.onLeftIconPress} style={styles.iconStyle}>
        <AntDesign name={props.iconType} size={25} color="#666" />
      </Pressable>
      <TextInput
        placeholderTextColor="#c2bebe"
        ref={ref}
        value={props.value}
        
        style={styles.input}
        numberOfLines={1}
        autoCapitalize="none"
        //placeholderTextColor="#666"
        {...props}
        caretHidden={false}
      />
      {props.rightChildren && (
        <View style={styles.iconStyle}>{props.rightChildren}</View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 5,
    marginBottom: 10,
    width: '100%',
    height: sizeScreen.height / 15,
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconStyle: {
    padding: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: '#ccc',
    borderRightWidth: 1,
    width: 50,
  },
  input: {
    padding: 10,
    flex: 1,
    fontSize: normalize(16),
    fontFamily: 'Lato-Regular',
    color: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    width: sizeScreen.width / 1.5,
    height: sizeScreen.height / 15,
    fontSize: normalize(16),
    borderRadius: 20,
    borderWidth: 1,
  },
});
