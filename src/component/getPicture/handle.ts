import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { UserImageProps } from '.';
import { deleteFile } from '../../shared/file';

export type PropsInsertImage = (images: UserImageProps[]) => void;
export type PropsDeleteImage = (image: UserImageProps) => void;
export async function onTakePicturePress(func: PropsInsertImage) {
  const result = await launchCamera({
    mediaType: 'photo',
    cameraType: 'back',
    saveToPhotos: false,
    quality: 0.1,
    includeBase64: true,
  });
  if (result.assets) {
    func(result.assets);
  }
  //console.log('result:', result.assets ? result.assets[0].base64 : null);
}
export async function onPickFromLibrary(func: PropsInsertImage) {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 1,
    selectionLimit: 2,
  });
  if (result.assets) {
    func(result.assets);
  }
  //   console.log('result:', result);
}

export async function onDeletePicture(
  image: UserImageProps,
  func: PropsDeleteImage,
) {
  func(image);
  try {
    if (image.uri) {
      deleteFile(image.uri);
    }
  } catch (err: any) {
    console.log('Delete image failed');
  }
}
