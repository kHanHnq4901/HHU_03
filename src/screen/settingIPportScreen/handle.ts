import {
  PropsAppSetting,
  saveValueAppSettingToNvm as saveStorage,
} from '../../service/storage';
import { showToast } from '../../util';
import { TYPE_SUPPORT_NSX, hook, store } from './controller';

export async function onSavePress() {
  console.log('save');

  const item = hook.state.selectedSerVer;

  console.log('abc:', hook.state.appSetting.server);
  console.log('loginMode:', hook.state.appSetting.loginMode);

  await saveStorage(hook.state.appSetting as PropsAppSetting);

  showToast('Đã lưu');
}
// export function onDropdownSelected(newLanguage: string) {
//   // const currentLanguage = store.state.appSetting.currentLanguage;
//   store.setState(state => {
//     state.appSetting.currentLanguage =
//       newLanguage as unknown as SUPPORT_LANGUAGE_LABEL_TYPE;
//     return { ...state };
//   });
//   // if(currentLanguage !== newLanguage)
//   // {
//   //   changeLanguage();
//   // }
// }

export function getDefaultIPPort(): {
  host: string;
  port: string;
} {
  

  const ret = {} as { host: string; port: string };

   
    ret.host = 'http://14.225.244.63'; // https://apigcsncc.npc.com.vn // https://apigcsinternet.npc.com.vn
    ret.port = '8088';

  return ret;
}
