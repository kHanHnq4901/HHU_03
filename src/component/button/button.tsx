import React from 'react';
import {
  Omit,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity
} from 'react-native';
import { Button as Btn } from 'react-native-paper';
import Theme, { Fonts, normalize } from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  textStyle?: StyleProp<TextStyle>;
} & Omit<React.ComponentProps<typeof Btn>, 'children'>;

export const Button = (props: Props) => {
  //const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={{
        ...styles.container,
        ...styles.button,
        ...props.style,
      }}>
      {/* <Btn
        labelStyle={styles.label}
        {...props}
        style={{ ...styles.button, ...props.style }}
        mode="contained">
        {props.label}
      </Btn> */}
      <Text style={{ ...styles.label, ...props.textStyle }}>{props.label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    marginHorizontal: 15,
  },
  button: {
    backgroundColor: Theme.Colors.primary,
    borderRadius: 25,
    elevation: 3,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    fontSize: normalize(18),
    textAlignVertical: 'center',
    fontFamily: Fonts,
    color: 'white',
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
});
