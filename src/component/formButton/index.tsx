import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { normalize, sizeScreen } from '../../theme/index';

type Props = {
  buttonTitle: string;
  isBusy?: boolean;
} & TouchableOpacityProps;

export function FormButton(props: Props) {
  const title = props.isBusy
    ? 'Đang ' + props.buttonTitle.toLowerCase() + ' ...'
    : props.buttonTitle;
  return (
    <TouchableOpacity style={styles.buttonContainer} {...props}>
      {/* {!props.isBusy ? (
        <ActivityIndicator color="white" animating={true} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )} */}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default FormButton;

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 10,
    width: '100%',
    height: sizeScreen.height / 15,
    backgroundColor: '#2e64e5',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    // borderTopStartRadius: 20,
    // borderBottomEndRadius: 20,
  },
  buttonText: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Lato-Regular',
  },
});
