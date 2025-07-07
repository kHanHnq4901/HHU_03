// import React, { useEffect } from 'react';
// import {
//   ActivityIndicator,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import DropDownPicker from 'react-native-dropdown-picker';
// import { Checkbox } from 'react-native-paper';
// import { TextInputInteractive } from '../../component/TextInput/TextInputInteractive';
// import Theme, {
//   Colors,
//   CommonFontSize,
//   CommonHeight,
//   normalize,
//   scale,
// } from '../../theme';
// import * as controller from './controller';
// //import InteractiveTextInput from 'react-native-text-input-interactive';
// import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
// import { useNavigation } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import DoubleClick from 'double-click-react-native';
// import throttle from 'lodash.throttle';
// import { Dimensions } from 'react-native';
// import { Pie } from 'react-native-progress';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { Button } from '../../component/button/button';
// import { CheckboxButton } from '../../component/checkbox/checkbox';
// import { getTypeOfColumn, KHCMISClomunsInfo } from '../../database/model';
// import { StackWriteDataList } from '../../navigation/model/model';
// import { TYPE_READ_RF } from '../../service/hhu/defineEM';
// import {
//   indexHeader,
//   itemPerPages,
//   RowTableProps,
//   variable,
// } from './controller';
// import * as handleButton from './handleButton';
// import { onBtnStopPress, onDoubleDocPress } from './handleButton';
// import { ModalWriteRegister } from '../../component/modal/modalWriteRegister';

// const siezScreen = Dimensions.get('screen');

// const sizeChartWaiting =
//   siezScreen.width < siezScreen.height
//     ? siezScreen.width * 0.2
//     : siezScreen.height * 0.2;

// type PropsRenderRow = {
//   item: RowTableProps;
//   index: number;
//   navigation: StackNavigationProp<StackWriteDataList>;
// };

// const RenderHeader = React.memo(
//   ({ arrTitle }: { arrTitle: string[] }) => {
//     return (
//       <View style={styles.head}>
//         <DoubleClick
//           singleTap={() => {}}
//           doubleTap={onDoubleDocPress}
//           delay={0}
//           style={{
//             ...styles.elementHeader,
//             width: variable.widthDoc,
//           }}>
//           <Text style={styles.titleHeader}>Đọc</Text>
//         </DoubleClick>
//         {arrTitle.map((title, index) => {
//           return (
//             <View
//               key={title}
//               style={{
//                 ...styles.elementHeader,
//                 width: controller.headerTables.widths[index],
//               }}>
//               <Text style={styles.titleHeader}>{title}</Text>
//             </View>
//           );
//         })}
//       </View>
//     );
//   },
//   () => true,
// );

// const ElementCell = ({ cellData, cellIndex }) => {
//   return (
//     <View
//       style={{
//         justifyContent: 'center',
//         alignItems: 'center',
//         width: controller.headerTables.widths[cellIndex],
//       }}>
//       <Text style={styles.text}>{cellData}</Text>
//     </View>
//   );
// };

// const ElementCellMemorized = React.memo(
//   ElementCell,
//   (prev, next) => prev.cellData === next.cellData,
// );

// const RenderRow = ({ item, index, navigation }: PropsRenderRow) => {
//   console.log('ren:', index);

//   let backgroundColor: string = '';
//   const typeReadRf = item.data[indexHeader.typeReadRf];
//   if (item.checked === true) {
//     backgroundColor = '#e3e6e8';
//   } else {
//     if (typeReadRf === TYPE_READ_RF.HAVE_NOT_READ) {
//       backgroundColor = 'transparent';
//     } else if (typeReadRf === TYPE_READ_RF.READ_FAILED) {
//       backgroundColor = '#f6a8bf';
//     } else if (typeReadRf === TYPE_READ_RF.WRITE_BY_HAND) {
//       backgroundColor = '#a9f6a8';
//     } else if (typeReadRf === TYPE_READ_RF.ABNORMAL_CAPACITY) {
//       backgroundColor = '#f6f5a9';
//     } else if (typeReadRf === TYPE_READ_RF.READ_SUCCEED) {
//       backgroundColor = '#67f3bb';
//     }
//   }

//   const onRowLongPress = () => {
//     controller.hookProps.setState(state => {
//       let checked: boolean | null = null;
//       state.KHCMISs = state.KHCMISs.map(itm => {
//         itm = { ...itm };
//         itm.data = [...itm.data];
//         if (item.data[indexHeader.seri] === itm.data[indexHeader.seri]) {
//           if (checked === null) {
//             checked = item.checked;
//           }
//           //console.log('checked:', checked);
//           itm.checked = checked === true ? false : true;
//         }
//         return itm;
//       });
//       return { ...state };
//     });
//   };
//   const onRowPress = () => {
//     navigation.navigate('WriteRegisterByHand', {
//       row: item.data as string[],
//     });
//   };

//   return (
//     <TouchableOpacity
//       onLongPress={onRowPress}
//       onPress={onRowLongPress}
//       style={{
//         ...styles.rowTableNoSelect,
//         backgroundColor: backgroundColor,
//       }}>
//       <View style={styles.cellDoc}>
//         <Checkbox status={item.checked ? 'checked' : 'unchecked'} />
//       </View>
//       {item.data.map((cellData, cellIndex) => (
//         <ElementCellMemorized
//           key={cellIndex}
//           cellData={cellData}
//           cellIndex={cellIndex}
//         />
//       ))}
//     </TouchableOpacity>
//   );
// };

// const RenderRowMemorized = React.memo(RenderRow, (prev, next) => {
//   // if (prev.index === 0) {
//   //   console.log('pre:', prev.item.checked);
//   //   console.log('next:', next.item.checked);
//   // }
//   return (
//     prev.item.checked === next.item.checked &&
//     prev.item.data[indexHeader.CS_MOI] === next.item.data[indexHeader.CS_MOI] &&
//     prev.item.data[indexHeader.rf] === next.item.data[indexHeader.rf]
//   );
// });

// export const WriteRegisterScreen = () => {
//   const navigation = useNavigation<StackNavigationProp<StackWriteDataList>>();
//   useEffect(() => {
//     controller.onInit(navigation);

//     return () => controller.onDeInit(navigation);
//   }, []);

//   const hookProps = controller.GetHookProps();

//   const type = getTypeOfColumn(hookProps.state.dropdown.value);
//   const startIndexTabel = hookProps.state.page * itemPerPages;
//   const endIndexTabel = hookProps.state.page * itemPerPages + itemPerPages;

//   //console.log(PixelRatio.get());

//   return (
//     <View style={styles.container}>
//       <ModalWriteRegister
//         title={variable.modalAlert.title}
//         info={variable.modalAlert.content}
//         onDismiss={variable.modalAlert.onDissmiss}
//       />
//       {hookProps.state.isReading && (
//         <View style={styles.bigLoading}>
//           <Pie progress={0.4} size={sizeChartWaiting} indeterminate={true} />
//         </View>
//       )}
//       <View>
//         <View
//           style={{
//             flexDirection: 'row',
//             marginBottom: 15,
//             height: CommonHeight + 5,
//           }}>
//           <View style={styles.dropdown}>
//             <DropDownPicker
//               zIndex={100000000}
//               listMode="MODAL"
//               placeholder="Chọn cột cần tìm"
//               open={hookProps.state.dropdown.open}
//               value={hookProps.state.dropdown.value}
//               items={hookProps.state.dropdown.items}
//               setOpen={value => {
//                 const open = value as unknown as boolean;
//                 hookProps.setState(state => {
//                   state.dropdown.open = open;
//                   if (open === true) {
//                     state.dropdown.subDropdown.open = false;
//                   }
//                   return { ...state };
//                 });
//               }}
//               setValue={func => {
//                 const val = func(hookProps.state.dropdown.value);
//                 //console.log('setValue:', val);
//                 hookProps.setState(state => {
//                   state.dropdown.value = val;

//                   state.dropdown.subDropdown.placeholder =
//                     'Chọn ' + KHCMISClomunsInfo.infoColumn[val].title;
//                   state.dropdown.subDropdown.items =
//                     controller.dataSubDropdown[val];
//                   return { ...state };
//                 });
//               }}
//               textStyle={{ fontSize: CommonFontSize, height: CommonHeight }}
//               labelStyle={{ fontSize: CommonFontSize, height: CommonHeight }}
//               setItems={func => {
//                 hookProps.setState(state => {
//                   state.dropdown.items = func(hookProps.state.dropdown.items);
//                   return { ...state };
//                 });
//               }}
//               listItemContainerStyle={{ marginVertical: 15 }}
//             />
//           </View>
//           <View style={styles.selectTime}>
//             <CheckboxButton
//               label="0h"
//               checked={hookProps.state.is0h}
//               onPress={() =>
//                 hookProps.setState(state => {
//                   state.is0h = !state.is0h;
//                   return { ...state };
//                 })
//               }
//             />
//             {hookProps.state.is0h ? (
//               <TouchableOpacity
//                 onPress={() => {
//                   DateTimePickerAndroid.open({
//                     value: hookProps.state.dateLatch,
//                     mode: 'date',
//                     display: 'calendar',
//                     onChange: date => {
//                       //console.log(JSON.stringify(date));

//                       if (date.type === 'set') {
//                         hookProps.setState(state => {
//                           state.dateLatch = new Date(
//                             date.nativeEvent.timestamp as string | number,
//                           );
//                           return { ...state };
//                         });
//                       }
//                     },
//                   });
//                 }}>
//                 <TextInputInteractive
//                   label="Chọn ngày"
//                   value={hookProps.state.dateLatch.toLocaleDateString('vi')}
//                   onChangeText={() => {}}
//                   //style={styles.searchText}
//                   editable={false}
//                   textInputStyle={styles.selectDate}
//                 />
//               </TouchableOpacity>
//             ) : null}
//           </View>
//         </View>

//         <View style={styles.rowSearch}>
//           {type !== 'number' ? (
//             hookProps.state.dropdown.value ===
//               KHCMISClomunsInfo.infoColumn.MA_QUYEN.id ||
//             hookProps.state.dropdown.value ===
//               KHCMISClomunsInfo.infoColumn.MA_COT.id ||
//             hookProps.state.dropdown.value ===
//               KHCMISClomunsInfo.infoColumn.MA_TRAM.id ? (
//               <View style={{ ...styles.dropdown, zIndex: 2000 }}>
//                 <DropDownPicker
//                   //zIndex={10000000000}
//                   maxHeight={100}
//                   style={{ zIndex: 2000 }}
//                   listMode="MODAL"
//                   placeholder={hookProps.state.dropdown.subDropdown.placeholder}
//                   open={hookProps.state.dropdown.subDropdown.open}
//                   value={hookProps.state.dropdown.subDropdown.value}
//                   items={hookProps.state.dropdown.subDropdown.items}
//                   setOpen={value => {
//                     const open = value as unknown as boolean;
//                     hookProps.setState(state => {
//                       state.dropdown.subDropdown.open = open;
//                       return { ...state };
//                     });
//                   }}
//                   setValue={func => {
//                     const val = func(
//                       hookProps.state.dropdown.subDropdown.value,
//                     );
//                     //console.log('setValue:', val);
//                     hookProps.setState(state => {
//                       state.dropdown.subDropdown.value = val;
//                       state.searchText = val;
//                       return { ...state };
//                     });
//                   }}
//                   setItems={func => {
//                     hookProps.setState(state => {
//                       state.dropdown.items = func(
//                         hookProps.state.dropdown.subDropdown.items,
//                       );
//                       return { ...state };
//                     });
//                   }}
//                   textStyle={{ fontSize: CommonFontSize, height: CommonHeight }}
//                   labelStyle={{
//                     fontSize: CommonFontSize,
//                     height: CommonHeight,
//                   }}
//                   listItemContainerStyle={{ marginVertical: 15 }}
//                 />
//               </View>
//             ) : (
//               <View style={styles.searchText}>
//                 <TextInputInteractive
//                   label="Tìm kiếm"
//                   placeholderTextColor={Colors.primary}
//                   value={hookProps.state.searchText}
//                   onChangeText={text => {
//                     hookProps.setState(state => {
//                       state.searchText = text.trim();
//                       return { ...state };
//                     });
//                   }}
//                   textInputStyle={{
//                     fontSize: CommonFontSize,
//                     width: '95%',
//                     height: CommonHeight,
//                   }}
//                   keyboardType="default"
//                 />
//               </View>
//             )
//           ) : (
//             <View
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 maxWidth: '70%',
//                 //width: '70%'
//                 //width: '70%',
//                 //backgroundColor: 'green',
//                 // justifyContent: 'space-between',
//               }}>
//               <View style={styles.searchTextNumber}>
//                 <TextInputInteractive
//                   label="Ngưỡng bắt đầu"
//                   placeholderTextColor={Colors.primary}
//                   value={hookProps.state.searchStart}
//                   onChangeText={text => {
//                     hookProps.setState(state => {
//                       state.searchStart = text.trim();
//                       return { ...state };
//                     });
//                   }}
//                   // style={styles.searchText}
//                   textInputStyle={styles.textSearchNumber}
//                 />
//               </View>
//               <View style={styles.searchTextNumber}>
//                 <TextInputInteractive
//                   label="Ngưỡng kết thúc"
//                   value={hookProps.state.searchEnd}
//                   placeholderTextColor={Colors.primary}
//                   onChangeText={text => {
//                     hookProps.setState(state => {
//                       state.searchEnd = text.trim();
//                       return { ...state };
//                     });
//                   }}
//                   textInputStyle={styles.textSearchNumber}
//                   // style={styles.searchText}
//                   //textInputStyle={styles.searchText}
//                 />
//               </View>
//             </View>
//           )}
//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               //flexGrow: 1,
//               flex: 1,
//               marginHorizontal: 10,
//             }}>
//             <TouchableOpacity
//               style={styles.iconSearch}
//               onPress={throttle(handleButton.onSearchPress, 1000)}>
//               <Ionicons name="search" size={25} />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.iconSearch}
//               onPress={throttle(handleButton.onRefreshPress, 1500)}>
//               <Ionicons name="ios-refresh" size={25} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       <Text style={styles.status}>{hookProps.state.status}</Text>
//       {/* <View style={styles.rowForSelect}>
//         <TouchableOpacity style={styles.btnSelectAll}>
//           <Ionicons
//             name="ios-checkmark-done-circle"
//             size={20}
//             color="#c8e1ff"
//           />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.btnSelectAll}>
//           <Ionicons name="md-close-circle-sharp" size={20} color="#c8e1ff" />
//         </TouchableOpacity>
//       </View> */}

//       <ScrollView horizontal={true}>
//         {/* <DoubleClick
//           singleTap={() => {}}
//           delay={0}
//           style={{
//             backgroundColor: 'transparent',
//             width: controller.headerTables.widths[0],
//             height: 50,
//             marginRight: -controller.headerTables.widths[0],

//             zIndex: 100,
//           }}
//           doubleTap={onDoubleDocPress}>
//           <></>
//         </DoubleClick> */}

//         <View>
//           <RenderHeader arrTitle={controller.headerTables.titles} />

//           <ScrollView>
//             {hookProps.state.isLoadingTable ? null : (
//               <View style={styles.table}>
//                 {hookProps.state.KHCMISs.map((item, index) => {
//                   if (index >= startIndexTabel && index < endIndexTabel) {
//                     // const typeReadRf = item.data[indexHeader.typeReadRf];
//                     // let show = false;
//                     // if(controller.store?.state.appSetting.showResultOKInWriteData !== true){

//                     //   if (
//                     //     typeReadRf !== TYPE_READ_RF.READ_SUCCEED &&
//                     //     typeReadRf !== TYPE_READ_RF.WRITE_BY_HAND
//                     //   ) {
//                     //     show = true;
//                     //   } else {
//                     //     show = false;
//                     //   }
//                     // }
//                     // return (

//                     // );
//                     //console.log('index:', index);
//                     return (
//                       <RenderRowMemorized
//                         key={item.key}
//                         item={item}
//                         index={index}
//                         navigation={navigation}
//                       />
//                     );
//                   } else {
//                     return null;
//                   }
//                 })}
//               </View>
//             )}
//           </ScrollView>
//         </View>
//       </ScrollView>
//       {hookProps.state.isLoadingTable ? (
//         <View style={{ flex: 1, marginTop: -200 }}>
//           <ActivityIndicator color="#f3a8c0" animating={true} size="small" />
//         </View>
//       ) : null}
//       {/* <DataTable>
//         <DataTable.Pagination
//           page={hookProps.state.page}
//           numberOfPages={hookProps.state.totalPage}
//           onPageChange={page => {
//             console.log(page);
//             hookProps.setState(state => ({
//               ...state,
//               page: page,
//               //isLoadingTable: true,
//             }));
//             //controller.updateDataToTable(page);
//           }}
//           showFastPaginationControls
//           label={`${hookProps.state.page + 1} of ${hookProps.state.totalPage}`}
//           numberOfItemsPerPage={10}
//           onItemsPerPageChange={itemPerPage => {
//             console.log('itemPerPage', itemPerPage);
//           }}
//         />
//       </DataTable> */}
//       <View style={styles.row}>
//         {hookProps.state.isReading === false ? (
//           <Button
//             style={styles.button}
//             label="Đọc"
//             onPress={throttle(handleButton.onBtnReadPress, 1500)}
//           />
//         ) : (
//           <Button
//             style={styles.button}
//             label={hookProps.state.requestStop ? 'Đang dừng ...' : 'Dừng'}
//             onPress={throttle(onBtnStopPress, 1000)}
//           />
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   rowSearch: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 6,
//     flexWrap: 'wrap',
//   },
//   rowForSelect: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   btnSelectAll: {
//     marginHorizontal: 8,
//     marginTop: -15,
//     marginBottom: 5,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: Theme.Colors.backgroundColor,
//     paddingTop: 15,
//     paddingHorizontal: 5,
//   },
//   textSearchNumber: {
//     fontSize: normalize(15),
//     width: '100%',
//     height: CommonHeight,
//   },
//   dropdown: {
//     width: '45%',
//     maxWidth: 350,
//     marginRight: 50,
//     height: CommonHeight,
//     //zIndex: Number.MAX_VALUE,
//   },
//   searchText: {
//     width: '60%',
//     maxWidth: 450,
//     height: CommonHeight,
//     fontSize: 20,
//     paddingHorizontal: 0,
//     color: Colors.primary,
//     // position: 'absolute',
//     // zIndex: 1,
//   },
//   selectDate: {
//     //width: '80%',
//     maxWidth: scale * 120,
//     marginLeft: 10,
//     height: CommonHeight,
//     color: Theme.Colors.primary,
//     fontSize: CommonFontSize,
//     // position: 'absolute',
//     // zIndex: 1,
//   },
//   searchTextNumber: {
//     width: '35%',
//     maxWidth: 350,
//     minWidth: '33%',
//     marginRight: 10,
//     height: CommonHeight,
//     //backgroundColor: 'pink',
//   },
//   iconSearch: {
//     height: 35,
//     width: 35,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderColor: '#2a41cb',
//     borderWidth: 1,
//     borderRadius: 8,
//     marginHorizontal: 10,
//     //backgroundColor: 'cyan',
//   },
//   row: {
//     flexDirection: 'row',
//     marginVertical: normalize(2),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rowTableNoSelect: {
//     flexDirection: 'row',
//     paddingVertical: normalize(2),
//     alignItems: 'center',
//   },
//   rowTableSelect: {
//     flexDirection: 'row',
//     paddingVertical: normalize(2),
//     alignItems: 'center',
//     backgroundColor: '#fbd5e1',
//   },
//   title: {
//     fontSize: 24,
//     margin: 10,
//     alignSelf: 'center',
//     color: 'balck',
//   },
//   table: {
//     borderWidth: 2,
//     borderColor: '#c8e1ff',
//   },
//   head: {
//     height: CommonHeight,
//     backgroundColor: '#f1f8ff',
//     flexDirection: 'row',
//   },
//   text: {
//     marginVertical: 10,
//     fontSize: normalize(15),
//     textAlign: 'center',
//     color: Colors.primary,
//     // fontWeight: 'bold',
//   },
//   titleHeader: {
//     fontSize: normalize(15),
//     color: Colors.primary,
//     fontWeight: 'bold',
//   },
//   headerTabel: {
//     fontSize: normalize(15),
//     textAlign: 'center',
//     marginHorizontal: 10,
//     color: Colors.primary,
//   },
//   rowTable: { backgroundColor: '0xffffff' },
//   checkbox: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   button: {
//     width: '50%',
//     alignSelf: 'center',
//     marginBottom: 15,
//     maxWidth: 350,
//     height: 50,
//   },
//   selectTime: {
//     //width: '45%',
//     marginLeft: -10,
//     marginTop: -10,
//     flexDirection: 'row',
//     alignItems: 'center',

//     //backgroundColor: 'pink',
//   },
//   status: {
//     color: Theme.Colors.primary,
//     fontSize: CommonFontSize,
//     marginBottom: normalize(10),
//     textAlign: 'center',
//   },
//   bigLoading: {
//     position: 'absolute',

//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     bottom: 80,
//     top: 0,
//     opacity: 0.5,
//     zIndex: Number.MAX_VALUE,

//     //backgroundColor: 'white',
//   },
//   elementHeader: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#c8e1ff',
//   },
//   cellDoc: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: variable.widthDoc,
//   },
// });
