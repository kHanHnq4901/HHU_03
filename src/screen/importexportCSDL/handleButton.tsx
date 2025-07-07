import Share from 'react-native-share';
import * as controller from './controller';
import { hookProps, loadFileCsdlFromStorage } from './controller';
import { showAlertDanger } from '../../service/alert';
import {
  NAME_CSDL,
  PATH_EXECUTE_CSDL,
  PATH_EXPORT_CSDL,
  PATH_IMPORT_CSDL,
  PATH_IMPORT_XML,
} from '../../shared/path';
import { showAlertWarning } from '../../service/alert/index';
import RNFS from 'react-native-fs';
import { deleteFile } from '../../shared/file';
import { BackupDb, closeConnection } from '../../database/repository';
import { showAlert, showToast } from '../../util';
import { savePathImport } from '../../service/storage';

const TAG = 'Handle Btn Import Export CSDL';

export const onImportPress = async () => {
  //controller.testMoveFile();
  // try {
  //   //console.log('here');
  //   await onInitWriteRegister(null);
  // } catch (err :any) {
  //   console.log(TAG, err);
  // }
  // return;
  let hasItem = false;
  const listUrl: string[] = [];
  //const filenames: string[] = [];
  for (let i = 0; i < hookProps.state.csdlList.length; i++) {
    if (hookProps.state.csdlList[i].checked === true) {
      hasItem = true;
      listUrl.push(hookProps.state.csdlList[i].path);
      //filenames.push(hookProps.state.xmlList[i].name.split('.')[0]);
    }
    
  }
  if (hasItem === false) {
    showToast('Chưa có file nào được chọn');
    return;
  }

  if (listUrl.length > 1) {
    showToast('Chỉ chọn được 1 file duy nhất');
    return;
  }

  showAlert(

    'Bạn có muốn khôi phục CSDL này ? CSDL cũ sẽ bị mất',
    {
      label: 'Hủy',
      func: () => {},
    },
    {
      label: 'Vẫn khôi phục',
      func: async () => {
        try {
          await closeConnection();
          RNFS.copyFile(listUrl[0], PATH_EXECUTE_CSDL + '/' + NAME_CSDL);

          showToast('Cập nhật CSDL mới thành công');

          const pathCSDL = listUrl[0];
          let fileName: string = '';
          try{
            const arrPath = pathCSDL.split('/');
            fileName = arrPath[arrPath.length - 1].split('.')[0];
          }catch{
            fileName = 'unknown';
          }
          // for create name file xml
          console.log('fileName:', fileName);
          const path = PATH_IMPORT_XML + '/' + fileName +'.xml';
          console.log('pathSave:', path);
          await savePathImport(path);

          hookProps.setState(state => {
            for (let item of state.csdlList) {
              item.checked = false;
            }
            return { ...state };
          });
        } catch (err :any) {
          showToast('Cập nhật CSDL mới thất bại');
          console.log(TAG, err.message);
        }
      },
    },
  );

  //console.log('filenames:', filenames);
};

export const getStringTime = (): string => {
  const date = new Date();
  const str =
    date.getFullYear().toString() +
    '' +
    (date.getMonth() + 1).toString().padStart(2, '0').slice(-2) +
    '' +
    date.getDate().toString().padStart(2, '0').slice(-2) +
    '_' +
    date.getHours().toString().padStart(2, '0').slice(-2) +
    '' +
    date.getMinutes().toString().padStart(2, '0').slice(-2) +
    '' +
    date.getSeconds().toString().padStart(2, '0').slice(-2);
  return str;
};

export const onExportPress = async () => {
  // try {
  //   console.log('move file');

  //   await RNFS.copyFile(
  //     'file://' + PATH_EXECUTE_CSDL + '/' + NAME_CSDL,
  //     PATH_EXPORT_CSDL +
  //       '/' +
  //       NAME_CSDL.split('.')[0] +
  //       '_' +
  //       getStringTime() +
  //       '.db',
  //   );
  //   console.log(TAG, 'coppy file to ' + PATH_EXPORT_CSDL);
  // } catch (err :any) {
  //   console.log(TAG, 'Err: ' + err.message);
  // }
  try {
    Share.open({
      title: 'Chia sẻ qua',
      url: 'file://' + PATH_EXECUTE_CSDL + '/' + NAME_CSDL,
      //filenames: filenames,
      type: 'application/db',
      showAppsToView: true,
    })
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        err && console.log(err);
      });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
};

export const onDeleteFilePress = async () => {
  let hasItem = false;
  let selectedItem = 0;
  for (let i = 0; i < hookProps.state.csdlList.length; i++) {
    if (hookProps.state.csdlList[i].checked === true) {
      hasItem = true;
      selectedItem++;
    }
  }
  if (hasItem) {

  showAlert('Bạn có muốn xóa ' + selectedItem + ' file ?',
  {
    label: 'Hủy',
    func: () => {},
  },
  {
    label: 'Xóa',
    func: async () => {
      for (let i = 0; i < hookProps.state.csdlList.length; i++) {
        if (hookProps.state.csdlList[i].checked === true) {
          await deleteFile(hookProps.state.csdlList[i].path);
        }
      }
      if (hasItem) {
        controller.loadFileCsdlFromStorage();
      }
    },
  }

);

  }
};


export async function OnCreateBackupPress(){
  await BackupDb();
  loadFileCsdlFromStorage();
}
