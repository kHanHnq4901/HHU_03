import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors, sizeScreen } from '../../theme';
import {
  PropsDeleteImage,
  PropsInsertImage,
  onDeletePicture,
  onPickFromLibrary,
  onTakePicturePress,
} from './handle';
import { requestCameraPermissions } from '../../service/permission';

export type UserImageProps = Asset;

type Props = {
  images: UserImageProps[];
  onInsertImages: PropsInsertImage;
  onDeleteImages: PropsDeleteImage;
};

const height = sizeScreen.width * 0.5 - 10;
export function GetPicture(props: Props) {
  React.useEffect(() => {
    requestCameraPermissions();
  }, []);

  //console.log('image.base64:', props.images.length);
  

  return (
    <View style={styles.conatiner}>
      {props.images.map(image => (
        <View style={styles.imageEmpty} key={image.fileName}>
          <Image
            source={{ uri: image.uri ?? `data:image/png;base64,${image.base64}` }}
            style={styles.imageEmpty}
            resizeMode="stretch"
          />
          <Pressable
            onPress={() => onDeletePicture(image, props.onDeleteImages)}
            style={styles.iconCLear}>
            <MaterialIcons name="cancel" size={30} color={Colors.primary} />
          </Pressable>
        </View>
      ))}
      {props.images.length < 1 && (
        <View style={styles.imageEmpty}>
          <TouchableOpacity
            onPress={() => onTakePicturePress(props.onInsertImages)}
            style={styles.selectIOptionGetPicture}>
            <Ionicons name="camera" size={35} color={Colors.colorIcon} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={() => {}}
            style={styles.selectIOptionGetPicture}>
            <MaterialIcons
              name="photo-library"
              size={35}
              color={Colors.colorIcon}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conatiner: {
    width: '100%',
    // height: height,
    backgroundColor: Colors.backgroundIcon,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 15,
    borderRadius: 10,
  },
  imageEmpty: {
    height: height,
    width: height,
    backgroundColor: Colors.backgroundIcon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectIOptionGetPicture: {
    // backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
  },
  iconCLear: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 10,
  },
});
