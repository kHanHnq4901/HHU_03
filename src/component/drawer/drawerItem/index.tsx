import React from 'react';
import { View, StyleSheet, TextStyle, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Theme, { normalize } from '../../../theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Text } from '../../Text';
import { Divider } from 'react-native-paper';
import { Colors } from '../../../theme/index';

type Props = {
  lable: string;
  icon: string;
  onPress: () => void;
  style?: TextStyle;
  colorIcon?: string;
};

export const DrawerItem = (props: Props) => {
  return (
    <>
      <TouchableOpacity style={styles.container} onPress={props.onPress}>
        <Icon
          name={props.icon}
          size={18}
          color={props.colorIcon ? props.colorIcon : Theme.Colors.colorIcon}
        />
        <Text
          style={
            props.style ? { ...styles.label, ...props.style } : styles.label
          }>
          {props.lable}
        </Text>
        <View style={{ flex: 1 }} />
        <AntDesign name="right" size={10} color={Theme.Colors.primary} />
      </TouchableOpacity>
      <Divider />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 15,
    alignItems: 'center',
  },
  label: {
    marginLeft: 10,
    fontSize: normalize(16),
    textAlignVertical: 'center',
    textAlign: 'center',
    color: Colors.text,
  },
});
