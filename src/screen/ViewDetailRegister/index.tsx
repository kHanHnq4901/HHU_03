import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { StackViewDataList } from '../../navigation/model/model';
import Theme, { Colors, normalize } from '../../theme';
import { GetHook, getTableContent, hookProps, onBeforeInit, onDeInit, onInit } from './controller';

type Props = {
  label: string;
  content: string;
};

const RowTable = (props: Props) => {
  return (
    <View style={styles.rowTable}>
      <View style={styles.lableTable}>
        <Text style={styles.title1}>{props.label}</Text>
      </View>
      <View style={styles.contentTable}>
        <Text style={styles.title2}>{props.content}</Text>
      </View>
    </View>
  );
};
export type PropsData = Props[];

export const ViewDetailRegisterScreen = () => {
  GetHook();
  const route =
    useRoute<RouteProp<StackViewDataList, 'ViewRegisterDetailed'>>();

  const props = route.params;

  const strSeri = props.data.data.SERY_CTO;

  const data: PropsData = getTableContent(props.data.data);

  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    onBeforeInit();
  }, []);

  React.useEffect(() => {
    onInit(props.data.data);
    return onDeInit;
  }, []);
  return (
    <View style={styles.container}>
      {/* <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          console.log('goBack');
          navigation.goBack();
        }}>
        <Ionicons name="chevron-back" size={30} color={Colors.secondary} />
      </TouchableOpacity> */}
      <Text style={styles.NO}>{strSeri}</Text>

      <ScrollView>
        <View style={styles.body}>
          {data.map(item => (
            <RowTable
              key={item.label}
              label={item.label}
              content={item.content}
            />
          ))}
          <View style={{ marginTop: 15 }} />
        </View>
        {
          hookProps.state.imageBase64 !== null && (
            <>
              <Text style={styles.titlePhoto} >Ảnh hiện trường</Text>
              <Image style={{width: '100%', height: 500}} resizeMode='contain' source={{ uri: `data:image/png;base64,${hookProps.state.imageBase64}` }} ></Image>
            </>
            
          )
        }
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonArea: {
    marginVertical: 5,
    //width: '50%',
    //alignItems: 'center',
  },
  itemInputContainer: {
    marginRight: 10,
  },
  rowTable: {
    flexDirection: 'row',
  },
  title3: {
    color: Colors.primary,
    fontSize: normalize(18),
    marginVertical: 5,
    width: 150,
    backgroundColor: '#f0ebec',
  },
  lableTable: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#dadadd',
    backgroundColor: 'white',
    paddingHorizontal: 3,
  },
  contentTable: {
    flex: 1,
    //borderWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: '#dadadd',
    backgroundColor: 'white',
    paddingHorizontal: 3,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.backgroundColor,
  },
  title: {
    fontSize: normalize(24),
    margin: 10,
    alignSelf: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 15,
    width: 30,
    height: 40,
    borderRadius: 30,
    backgroundColor: 'white',
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  NO: {
    color: 'black',
    fontSize: normalize(28),
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  title1: {
    fontSize: normalize(18),
    marginVertical: 5,
    color: Colors.primary,
  },
  title2: {
    color: Colors.primary,
    fontSize: normalize(18),
    marginVertical: 5,
  },
  status: {
    color: Colors.primary,
    marginVertical: 3,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  titlePhoto: {
      fontSize: normalize(20),
      color: Colors.caption,
      marginLeft: 20,
      marginBottom: 10,
  },
});
