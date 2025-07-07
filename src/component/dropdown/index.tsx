import React, { useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Colors, Fonts, normalize, scale, sizeScreen } from '../../theme';
import { PropsDropdown } from '../../service/hhu/defineEM';
import { Divider } from 'react-native-paper';

type Props = {
  placeHolder?: string;
  searchPlaceHolder?: string;
  search?: boolean;
  selectedValue?: any;
  data: PropsDropdown[];
  onChange: (item: PropsDropdown) => void;
};

export function DropdownComponent(props: Props) {
  const renderItem = item => {
    return (
      <>
        <View style={styles.item}>
          <Text style={styles.textItem}>{item.label}</Text>
          {item.value === props.selectedValue && (
            <AntDesign
              style={styles.icon}
              color={Colors.primary}
              name="check"
              size={20}
            />
          )}
        </View>
        <Divider />
      </>
    );
  };

  return (
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      iconStyle={styles.iconStyle}
      data={props.data}
      search={props.search}
      maxHeight={sizeScreen.height * 0.5}
      labelField="label"
      valueField="value"
      placeholder={props.placeHolder ?? 'Select item'}
      searchPlaceholder={props.searchPlaceHolder ?? 'Search...'}
      itemContainerStyle={{ marginVertical: 5 }}
      onChange={props.onChange}
      //   renderLeftIcon={() => (
      //     <AntDesign style={styles.icon} color="black" name="Safety" size={20} />
      //   )}
      renderItem={renderItem}
      itemTextStyle={styles.itemTextStyle}
      containerStyle={styles.containListItemStyle}
    />
  );
}

const styles = StyleSheet.create({
  containListItemStyle: {
    borderRadius: 10,
    elevation: 1,
    borderWidth: 1,
    // borderColor: Colors.blurPrmiary,
    paddingVertical: 10,
  },
  itemTextStyle: {
    textAlign: 'center',
    fontFamily: Fonts,
  },
  dropdown: {
    // margin: 16,
    // height: 50,
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? Colors.text : 'transparent',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
    height: 40 * scale,
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textItem: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts,
    color: Colors.purple,
    fontWeight: 'bold',
  },
  placeholderStyle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.text,
    // fontFamily: Fonts,
  },
  iconStyle: {
    width: 20 * scale,
    // height: 20,
  },
  inputSearchStyle: {
    // height: 40,
    fontSize: 16,
  },
});
