import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, normalize } from '../../theme';

export type PropsDetail = { data: PropsItemStation[] };

export type PropsItemStation = {
  stationName: string;
  totalMeter: number;
  totalSucceed: number;
  totalBCS: number;
  listBook: PropsItemBook[];
};

const OneStation = (props: PropsItemStation) => {
  return (
    <View style={styles.containerOneItem}>
      <View style={styles.containerMainColumn}>
        <Text style={styles.title}>{props.stationName}</Text>
        <Text style={styles.subTitle}>Số CT: {props.totalMeter}</Text>
        <Text style={styles.subTitle}>
          BCS: {props.totalSucceed}/ {props.totalBCS}
        </Text>
      </View>
      <View style={{ ...styles.containerMainColumn, flex: 2 }}>
        {props.listBook.map(item => (
          <OneBook key={item.bookName} {...item} />
        ))}
      </View>
    </View>
  );
};

export type PropsItemBook = {
  totalMeter: number;
  totalSucceed: number;
  totalBCS: number;
  bookName: string;
  listColumn: PropsItemColumn[];
};

const OneBook = (props: PropsItemBook) => {
  return (
    <View style={styles.containerOneItem}>
      <View style={styles.containerMainColumn}>
        <Text style={styles.title}>{props.bookName}</Text>
        <Text style={styles.subTitle}>Số CT: {props.totalMeter}</Text>
        <Text style={styles.subTitle}>
          BCS: {props.totalSucceed}/ {props.totalBCS}
        </Text>
      </View>
      <View style={styles.containerMainColumn}>
        {props.listColumn.map(item => (
          <OneColumn key={item.columnName} {...item} />
        ))}
      </View>
    </View>
  );
};

export type PropsItemColumn = {
  totalMeter: number;
  totalSucceed: number;
  totalBCS: number;
  columnName: string;
};

const OneColumn = (props: PropsItemColumn) => {
  return (
    <View style={styles.containerOneItem}>
      <View style={styles.containerMainColumn}>
        <Text style={styles.title}>{props.columnName}</Text>
        <Text style={styles.subTitle}>Số CT: {props.totalMeter}</Text>
        <Text style={styles.subTitle}>
          BCS: {props.totalSucceed}/ {props.totalBCS}
        </Text>
      </View>
    </View>
  );
};

export const DetailDB = (props: PropsDetail) => {
  //console.log('props:', props);
  return (
    <View style={styles.conatiner}>
      <View style={styles.header}>
        <View style={styles.containerMainColumn}>
          <Text style={styles.title}>Mã trạm</Text>
        </View>
        <View style={styles.containerMainColumn}>
          <Text style={styles.title}>Mã quyển</Text>
        </View>
        <View style={styles.containerMainColumn}>
          <Text style={styles.title}>Mã cột</Text>
        </View>
      </View>
      {props.data.map(itemStation => (
        <OneStation key={itemStation.stationName} {...itemStation} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  conatiner: {
    // paddingLeft: 3,
    //borderLeftWidth: 1,
  },
  header: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  row1: {
    flexDirection: 'row',
  },
  containerOneItem: {
    flexDirection: 'row',
  },
  containerMainColumn: {
    //justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    //paddingVertical: 5,
  },
  title: {
    fontSize: normalize(20),
    color: Colors.primary,
    marginBottom: 15,
  },
  subTitle: {
    fontSize: normalize(16),
    color: Colors.blurPrmiary,
  },
});
