import { CMISKHServices } from '.';
import { GetFileListMatchVersionMeter } from '../../service/api';

import {
  getVersionUpdateFileMatchSeriVersion,
  saveVersionUpdateFileMatchSeriVersion,
} from '../../service/storage';
import { showAlert, showToast } from '../../util';
import { dataDBTabel } from '../model';
import { InfoMeterRepository, PropsCondition } from '../repository';


const TAG = 'matchSeriVersionRepository:';


type ObjMinMax = {
  min: number;
  max: number;
};

function getArrayMinMax(stringVersion: string): ObjMinMax[] {
  let objMimAx: ObjMinMax[] = [];
  const arrStr = stringVersion.split(/\r?\n/);
  const regNumber = /\d+/g;

  for (let temp of arrStr) {
    const arrNumber: string[] = [];
    if (temp.length > 10) {
      let num;
      while ((num = regNumber.exec(temp)) !== null) {
        arrNumber.push(num[0]);
      }
      if (arrNumber.length === 2) {
        objMimAx.push({
          min: Number(arrNumber[0]),
          max: Number(arrNumber[1]),
        });
      }
    }
  }

  return objMimAx;
}

async function updateSeriVersion2Db(
  arrSeri: ObjMinMax[],
  version: VersionMeterValue,
) {
  for (let item of arrSeri) {
    const valueUpdate = {} as PropsMatchSeriVersionEntity;

    valueUpdate.id = item.min.toString() + item.max.toString() + version;
    valueUpdate.min = item.min;
    valueUpdate.max = item.max;
    valueUpdate.version = version;

    await MatchSeriVersionRepository.save(valueUpdate);
  }
}

export async function UpdateDbMatchSeriVersionFromString(str: string) {
  try {
    const newStr = str.toUpperCase().replace(/ /g, '');

    const regVersion = /(?<=\()(.+)(?=\))/;

    const resultVerion = regVersion.exec(newStr);

    const version = resultVerion ? resultVerion[0] : 'unkown';

    const versionStorage = await getVersionUpdateFileMatchSeriVersion();

    console.log('version server:', version);
    console.log('versionStorage:', versionStorage);

    if (version === versionStorage) {
      console.log('no need to update seri version to db');
      //showToast('Đã cập nhật danh sách mới nhất');

      await UpdateVersionToCurrentDb();

      return;
    } else {
      console.log('version server:', version);
      console.log('versionStorage:', versionStorage);

      await saveVersionUpdateFileMatchSeriVersion(version);
    }

    showToast('Đang cập nhật lại version công tơ ...');

    const dlmsv1 = 'DLMSV1:';
    const dlmsv2 = 'DLMSV2:';
    const iec = 'IEC:';

    const indexDLMSV1 = newStr.indexOf(dlmsv1);
    const indexDLMSV2 = newStr.indexOf(dlmsv2);
    const indexIEC = newStr.indexOf(iec);

    const strDLMSV1 = newStr.slice(indexDLMSV1 + dlmsv1.length, indexDLMSV2);
    const strDLMSV2 = newStr.slice(indexDLMSV2 + dlmsv2.length, indexIEC);
    const strIEC = newStr.slice(indexIEC + iec.length);

    const arrMinMaxDLMSV1 = getArrayMinMax(strDLMSV1);
    const arrMinMaxDLMSV2 = getArrayMinMax(strDLMSV2);
    const arrMinMaxIEC = getArrayMinMax(strIEC);

    //console.log('arrMinMaxIEC:', arrMinMaxIEC);

    await deleteDataDB();

    await checkTableDBIfExist();

    await updateSeriVersion2Db(arrMinMaxDLMSV1, '1');
    await updateSeriVersion2Db(arrMinMaxDLMSV2, '2');
    await updateSeriVersion2Db(arrMinMaxIEC, '3');

    await UpdateDataSeriVersionToLocaleVariable();
    await UpdateVersionToCurrentDb();

    showToast('Cập nhật xong version công tơ');
  } catch (err: any) {
    showAlert(err.message);
  }
}

export async function UpdateDataSeriVersionToLocaleVariable(): Promise<boolean> {
  dataDBMatchSeriVersion = await MatchSeriVersionRepository.findAll();
  if (!dataDBMatchSeriVersion.length) {
    // showAlert(
    //   'Dữ liệu danh sách seri đang chưa có, cần cập nhật lại trong cài đặt',
    // );
    showToast('Dữ liệu seri version rỗng');
    return false;
  }
  console.log(TAG, 'dataDBMatchSeriVersion:', dataDBMatchSeriVersion.length);

  return true;
}

export async function UpdateVersionToCurrentDb() {
  try {
    showToast('Đang kiểm tra version công tơ...');

    const KHCMISEntity = await InfoMeterRepository.findAll();

    const mapSeri = new Map<string, { RF: string; maCto: string }>();

    for (let kh of KHCMISEntity) {
      mapSeri.set(kh.SERY_CTO, { RF: kh.RF, maCto: kh.MA_CTO });
    }

    let countEffetc = 0;

    //console.log('dataDBMatchSeriVersion:', dataDBMatchSeriVersion);//18063185

    for (let item of mapSeri) {
      const seri = item[0];
      const objRF = item[1];

      const labelAndManyPrice = getLabelAndIsManyPriceByCodeMeter(
        objRF.maCto,
        seri,
      );
      const newRF = getTypeMeterBySerial(seri, labelAndManyPrice.label);

      if (newRF !== objRF.RF) {
        // update

        countEffetc++;

        const valuesSet = {};

        const condition: PropsCondition = {
          data: {},
          logic: '=',
          operator: 'AND',
        };
        condition.data[dataDBTabel.SERY_CTO.id as string] = seri;

        valuesSet[dataDBTabel.RF.id as string] = newRF;

        await CMISKHServices.update(condition, valuesSet);
      }
    }

    showToast('Thay đổi version ' + countEffetc + ' công tơ');
  } catch (err: any) {
    showAlert('Lỗi: ' + err.message);
  }
}

export async function UpdateFirstTimeSeriVersion() {
  try {
    const response = await GetFileListMatchVersionMeter();
    if (response.bSucceed) {
      await UpdateDbMatchSeriVersionFromString(response.obj as string);
    } else {
    }
  } catch (err: any) {
    showAlert('Lỗi: ' + err.message);
  } finally {
  }
}
