import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, normalize } from '../../theme';

type Props = {
  label: string;
  icon: string;

  onPress: () => void;
  leftChildren?: ReactNode;
};
export function ButtonList(props: Props) {
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.container}>
      {props.leftChildren ?? (
        <MaterialCommunityIcons
          name={props.icon}
          color={Colors.blurPrmiary}
          size={25}
        />
      )}

      <Text style={styles.label}>{props.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginVertical: 5,
    elevation: 3,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  label: {
    fontSize: normalize(18),
    color: Colors.text,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
