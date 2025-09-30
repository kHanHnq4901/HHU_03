import {
  PropsAppSetting,
  saveValueAppSettingToNvm as saveStorage,
} from '../../service/storage';
import { showToast } from '../../util';
import { TYPE_SUPPORT_NSX, hook, store } from './controller';

export async function onSavePress() {
  console.log('save');

  console.log('abc:', hook.state.appSetting.server);

  await saveStorage(hook.state.appSetting as PropsAppSetting);

  showToast('Đã lưu');
}
export function getDefaultIPPort(): {
  host: string;
  port: string;
} {
  const ret = {} as { host: string; port: string };
    ret.host = 'http://14.225.244.63';
    ret.port = '8088';

  return ret;
}
