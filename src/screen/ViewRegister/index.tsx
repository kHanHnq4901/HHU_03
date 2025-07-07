import throttle from 'lodash.throttle';
import React, { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CheckboxButton } from '../../component/checkbox/checkbox';
import { GetColorDisplay, TYPE_READ_RF, VersionMeter } from '../../service/hhu/defineEM';
import { Colors, CommonHeight, normalize } from '../../theme';
import { scaleHeight, sizeScreen } from '../../theme/index';
import {
  styleItemRow,
  SubRow1Memo,
  SubRow2Memo,
  SubRow3Memo,
} from '../writeDataByBookCode';
import {
  GetHookProps,
  hookProps,
  isCloseToBottom,
  onDeInit,
  onInit,
  onScrollToEnd,
} from './controller';
import {
  onChangeTextSearch,
  onCheckBoxTypeReadChange,
  onExportExcelPress,
  onPencilPress,
  onStationSelected,
} from './handleButton';
import { store } from '../../component/drawer/drawerContent/controller';
import { PropsDatatable } from '../writeDataByBookCode/controller';
import { Button } from '../../component/button/button';
import Loader1 from '../../component/loader1';

const IconPencilMemo = React.memo((props: { item: PropsDatatable }) => {
  function _PencilPress() {
    //console.log('pencil press');
    onPencilPress({
      data: props.item,
    });
  }
  return (
    <TouchableOpacity style={styleItemRow.pencil} onPress={_PencilPress}>
      <Entypo name="open-book" size={35} color={Colors.primary} />
    </TouchableOpacity>
  );
});

//ListRenderItemInfo<PropsDatatable>
function ItemStock(item: PropsDatatable) {
  //const item = props.item;
  if (item.show !== true) {
    return null;
  }
  //console.log('ren:', item.stt);
  let backgroundColor = GetColorDisplay(item.checked, item.data.LoaiDoc as TYPE_READ_RF);

  function _onItemPress() {
    //onItemPress(item);
  }

  const versionMeter =
    item.versionMeter === VersionMeter.IEC
      ? 'IEC'
      : item.versionMeter === VersionMeter.DLMS_MANY_CHANEL
      ? 'DLMS v1'
      : 'DLMS v2';

  const labelMeter = item.labelMeter !== 'not GELEX' ? item.labelMeter + ' - ' + versionMeter : item.labelMeter;

  return (
    <TouchableOpacity
      onPress={_onItemPress}
      style={{ ...styleItemRow.container, backgroundColor: backgroundColor }}>
      <IconPencilMemo item={item} />
      <View style={styleItemRow.row}>
        
        <SubRow2Memo
          TT={item.stt}
          SERY_CTO={item.data.SERY_CTO}
          LOAI_BCS={item.data.LOAI_BCS}
          labelMeter={labelMeter}
        />
      </View>
      <SubRow1Memo
        MA_QUYEN={item.data.MA_QUYEN}
        MA_COT={item.data.MA_COT}
        TEN_KHANG={item.data.TEN_KHANG}
        MA_KHANG={item.data.MA_KHANG}
        DIA_CHI={item.data.DIA_CHI}
      />
      <SubRow3Memo
        CS_MOI={item.data.CS_MOI}
        SL_MOI={item.data.SL_MOI}
        CS_CU={item.data.CS_CU}
        SL_CU={item.data.SL_CU}
        isManyPrice={item.isManyPrice}
        PMAX={item.data.PMAX}
        NGAY_PMAX={item.data.NGAY_PMAX}
        loginMode={store.state.appSetting.loginMode}
        isSent={item.data.isSent === "1"}
        hasImage={item.data.hasImage === '1'}
      />
    </TouchableOpacity>
  );
}

function areEqual(prev: PropsDatatable, next: PropsDatatable) {
  if (
    prev.checked !== next.checked ||
    prev.data.CS_MOI !== next.data.CS_MOI ||
    prev.data.LoaiDoc !== next.data.LoaiDoc
  ) {
    return false;
  }
  return true;
}

const ItemStockMemoried = React.memo(ItemStock, areEqual);

export const ViewRegisterScreen = () => {
  GetHookProps();
  const ref = useRef<SelectDropdown | null>(null);
  React.useEffect(() => {
    onInit(ref);

    return () => onDeInit();
  }, []);

  return (
    <View style={styles.conatiner}>
      {hookProps.state.isBusy && (
          <View style={styles.bigLoading}>
            {/* <Pie progress={0.4} size={sizeChartWaiting} indeterminate={true} /> */}
            {/* <BubblesLoader size={60} /> */}
            <Loader1 />
          </View>
        )}
      <View style={styles.rowTypeRead}>
        {hookProps.state.arrCheckBoxRead.map(item => (
          <CheckboxButton
            checked={item.checked}
            label={item.label}
            key={item.label}
            onPress={() => {
              onCheckBoxTypeReadChange(item.label);
            }}
          />
        ))}
      </View>
      <View style={styles.containerDropdown}>
          <SelectDropdown
            ref={ref}
            buttonStyle={styles.dropdown}
            defaultButtonText="Chọn trạm biến áp"
            data={hookProps.state.arrStation}
            onSelect={(selectedItem, index) => {
              //console.log(selectedItem, index);
              //onSelectedItemDropdown(selectedItem);
              onStationSelected(selectedItem);
            }}
            buttonTextStyle={{
              color: Colors.primary,
            }}
            buttonTextAfterSelection={(selectedItem, index) => {
              // text represented after item is selected
              // if data array is an array of objects then return selectedItem.property to render after item is selected
              return selectedItem;
            }}
            rowTextForSelection={(item, index) => {
              // text represented for each item in dropdown
              // if data array is an array of objects then return item.property to represent item in dropdown
              return item;
            }}
            renderDropdownIcon={() => {
              return <Ionicons name="chevron-down" size={20} />;
            }}
          />
        </View>
      
      <Text style={styles.statusStation}>
        Thành công {hookProps.state.totalSucceed}/ {hookProps.state.totalBCS}
      </Text>
      <Text style={styles.status}>{hookProps.state.status}</Text>
      <View style={styles.containDropdownAndButton} > 
        <View style={{flex: 1}}>
          <TextInput
            style={styles.searchText}
            placeholder="Tìm kiếm"
            placeholderTextColor={Colors.caption}
            onChangeText={throttle(text => onChangeTextSearch(text), 250)}
          />
        </View>  
      
        <Button
          style={{
            backgroundColor: Colors.purple,
            // flex: 1,
            // height: 50,
            maxWidth: 120,
            marginHorizontal: 5,
          }}
          label="Xuất Excel"
          onPress={onExportExcelPress}
        />
      </View>
      
      {/* </View> */}

      <ScrollView
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            //enableSomeButton();
            //console.log('to end');
            onScrollToEnd();
          }
        }}
        scrollEventThrottle={300}>
        {hookProps.state.dataTable.render.map(item => {
          if (item.show) {
            return <ItemStockMemoried key={item.id} {...item} />;
          } else {
            return null;
          }
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bigLoading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    bottom: 0,
    top: 0,
    opacity: 1,
    zIndex: 10000000,
    backgroundColor: 'transparent',
  },
  conatiner: {
    flex: 1,
    backgroundColor: 'white',
  },
  status: {
    color: Colors.primary,
    fontSize: normalize(16),
    textAlignVertical: 'center',
    textAlign: 'center',
    marginVertical: 5 * scaleHeight,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.colorIcon,
    flexGrow: 1,
    marginHorizontal: 10,
    height: 35,
  },
  rowTypeRead: {
    flexDirection: 'row',
    marginVertical: 5 * scaleHeight,
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  containDropdownAndButton: {
    width: '100%',
    flexDirection:'row',
    alignItems:'center',
  },
  containerDropdown: {
    //width: '50%',
    alignItems: 'center',
    //flex: 1,
    marginHorizontal: 5,
  },
  dropdown: {
    width: sizeScreen.width * 0.8,
    borderRadius: 15,
    height: 30 * scaleHeight,
    marginBottom: 10 * scaleHeight,
    backgroundColor: '#dcf0f8',
  },
  searchText: {
    borderWidth: 1,
    borderColor: Colors.border,
    //flexGrow: 1,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    height: 35 * scaleHeight,
    fontSize: normalize(15),
    marginBottom: 5,
    color: Colors.text,
  },
  statusStation: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: normalize(15),
    color: Colors.primary,
  },

  containerTable: {},
});
