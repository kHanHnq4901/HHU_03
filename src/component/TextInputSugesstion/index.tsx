import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import {
  Colors,
  CommonHeight,
  Fonts,
  normalize,
  scale,
  scaleHeight,
} from '../../theme';

type Props = {
  onSelectedItem: (item: string) => void;
  filter: (text: string) => string[];
  onEditDone: (text: string) => void;
  styleItem?: StyleProp<ViewStyle>;
} & TextInputProps;

type PropsTextList = {
  label: string;
};

let data: string[] = [];

export const AutoCompleteInput = (props: Props) => {
  const [show, setShow] = React.useState<boolean>(false);

  data = props.filter(props.value as string);

  const RenderItemList = (propsItem: PropsTextList) => {
    return (
      <TouchableOpacity
        style={styles.itemText}
        onPress={() => {
          setShow(_ => false);
          props.onSelectedItem(propsItem.label);
        }}>
        <Text style={styles.textItem}>{propsItem.label}</Text>
      </TouchableOpacity>
    );
  };
  const style = props.styleItem ?? {};
  return (
    <View style={{ ...styles.containerItem, ...style }}>
      <TextInput
        {...props}
        onSubmitEditing={e => {
          props.onEditDone(e.nativeEvent.text);
          setShow(false);
        }}
        style={styles.text}
        placeholderTextColor={Colors.primary}
        onFocus={() => {
          //console.log('setShow:');
          setShow(_ => true);
        }}
      />
      {show && data.length ? (
        <View style={styles.containerList}>
          {data.map(item => {
            return <RenderItemList key={item} label={item} />;
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: normalize(20),
    width: '100%',
    //backgroundColor: 'pink',
    fontFamily: Fonts,
    // height: CommonHeight,
    color: Colors.primary,
    backgroundColor: '#dde3f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.pink,
    paddingVertical: 7,

    paddingHorizontal: 5,
  },
  containerItem: {
    width: '100%', //sizeScreen.width * 0.45,
    // height: CommonHeight,
    // backgroundColor: 'pink',
    alignItems: 'center',
    //borderRadius: 15,
    justifyContent: 'center',
    zIndex: Number.MAX_VALUE,
    minHeight: 50 * scale,
  },
  containerList: {
    position: 'absolute',
    top: CommonHeight,
    left: 0,
    backgroundColor: 'white',
    zIndex: Number.MAX_VALUE,
    width: '100%',
    maxWidth: 300,
    paddingTop: 15,
    borderColor: Colors.border,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    paddingBottom: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },
  itemText: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    // height: 50 * scale,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  textItem: {
    //color: 'black',
    fontSize: normalize(22),
    // paddingHorizontal: 3,
    // marginHorizontal: 3,
  },
});
