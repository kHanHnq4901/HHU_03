import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Divider } from 'react-native-paper';
import { Colors, normalize, scale } from '../../theme';

type Props = {
  label: string;
  ref?: React.LegacyRef<TextInput>;
  styleContainer?: StyleProp<ViewStyle>;
} & TextInputProps;

export const NormalTextInput = React.forwardRef<TextInput, Props>(
  (props, ref) => {
    return (
      <View style={[styles.container, props.styleContainer]}>
        <Text style={styles.label}>{props.label}</Text>
        <TextInput
          autoCorrect={false}
          style={styles.textInput}
          selectTextOnFocus={true}
          underlineColorAndroid="transparent"
          ref={ref}
          {...props}
        />
        <Divider />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 5,
  },
  label: {
    fontSize: normalize(16),
    color: Colors.caption,
    fontFamily: 'Lato-Regular',
  },
  textInput: {
    borderRadius: 5,
    backgroundColor: 'white',
    elevation: 1,
    fontFamily: 'Lato-Regular',
    fontSize: normalize(18),
    padding: 10 * scale,
    color: Colors.text,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    //borderWidth: 1,
  },
});
