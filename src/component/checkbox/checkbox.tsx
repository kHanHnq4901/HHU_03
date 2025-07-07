import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Checkbox as CB_Paper, useTheme } from 'react-native-paper';
import { normalize } from '../../theme';
import { Colors } from '../../theme/index';
import { Text } from '../Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = {
  checked: boolean;
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  uncheckedColor?: string;
};

export const CheckboxButton = (props: Props) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={{ ...styles.conatiner, ...props.style }}>
      { props.checked !== true && (
        <View
          style={{
            // position: 'absolute',
            // // top: 0,
            // left: 0,
            backgroundColor: 'transparent',
            width: 20,
            height: 20,
            borderRadius: 5,
            // marginLeft: 12,
            marginRight: 5,
            borderWidth: 1,
            borderColor:
              !props.checked ? props.uncheckedColor ?? Colors.colorIcon : Colors.colorIcon,
            // marginLeft: -10,
          }}
        />
      )}
      {
        props.checked === true && <Ionicons name="checkmark" size={25} color={theme.colors.primary} ></Ionicons>
      }
      {/* <CB_Paper
        color={theme.colors.primary}
        onPress={props.onPress}
        status={props.checked === true ? 'checked' : 'unchecked'}
        uncheckedColor={props.uncheckedColor}
      /> */}
      {props.label && <Text style={styles.text}>{props.label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  conatiner: {
    flexDirection: 'row',
    marginVertical: 3,
    //justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    height: 25,

  },
  text: {
    textAlignVertical: 'center',
    fontSize: normalize(18),
    color: Colors.text,
  },
});
