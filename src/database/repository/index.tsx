import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { TYPE_READ_RF } from '../../service/hhu/defineEM';
import { NAME_CSDL, PATH_EXECUTE_CSDL, PATH_EXPORT_CSDL } from '../../shared/path';
import { isNumeric, showAlert } from '../../util';
import { dumyEntity, GetStringSelectEntity,PropsInfoMeterEntity, TABLE_NAME_INFO_LINE, TABLE_NAME_INFO_METER, TABLE_NAME_METER_DATA } from '../entity';
import { dataDBTabel, getTypeOfColumn, PropsPercentRead } from '../model';
import { PropsFilter, PropsPagination, PropsSorting } from '../service';
import RNFS from 'react-native-fs';
import { getStringTime } from '../../screen/importexportCSDL/handleButton';
import { getLastPathImport } from '../../service/storage';
import { store } from '../../component/drawer/drawerContent/controller';

const TAG = 'Repository:';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export const checkTabelDBIfExist = async (): Promise<boolean> => {
  try {
    const db = await getDBConnection();
    if (!db) {
      return false;
    }

    // Helper tạo bảng
    const createTable = async (tableName: string, entity: Record<string, any>) => {
      let query = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
      let first = true;
      for (let key in entity) {
        if (first) {
          first = false;
        } else {
          query += ', ';
        }
        query += `${key} TEXT`; // mặc định TEXT, có thể tùy chỉnh kiểu
      }
      query += ')';
      await db.executeSql(query);
      console.log(`✅ Table ${tableName} checked/created`);
    };

    // Tạo 3 bảng
    await createTable(TABLE_NAME_INFO_METER, dumyEntity);
    await createTable(TABLE_NAME_INFO_LINE, {
      LINE_ID: '',
      LINE_NAME: '',
      ADDRESS: '',
      CODE: '',
    });
    await createTable(TABLE_NAME_METER_DATA, {
      TIMESTAMP: '',
      IMPORT_DATA: '',
      EXPORT_DATA: '',
      EVENT: '',
      BATTERY: '',
      PERIOD: '',
      DATA_RECORD: '',
    });

    return true;
  } catch (err: any) {
    console.log('❌ err tabel exist: ', err.message);
    return false;
  }
};



export async function BackupDb(){


 // backup
 try {
  console.log('move file');
  const path = await  getLastPathImport();

  let fileName: string = '';
  try{
    const arrPath = path.split('/');
    fileName = arrPath[arrPath.length - 1].split('.')[0];
  }catch{
    fileName = 'noname';
  }

  console.log('fileName:', fileName);
  
  await RNFS.copyFile(
    'file://' + PATH_EXECUTE_CSDL + '/' + NAME_CSDL,
    PATH_EXPORT_CSDL +
      '/' +
      fileName +
      '_' +
      getStringTime() +
      '.db',
  );
  console.log(TAG, 'coppy file to ' + PATH_EXPORT_CSDL);
  //showAlert('test backup thanhf coong');
} catch (err :any) {
  console.log(TAG, 'Err: ' + err.message);
}


}

export const deleteDataDB = async (): Promise<boolean> => {
  try {
    const db = await getDBConnection();
    if (!db) {
      return false;
    }

    await BackupDb();

    //const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=${TABLE_NAME_INFO_METER}`;
    // let query = `DELETE FROM ${TABLE_NAME_INFO_METER};`;
    let query = `DROP TABLE IF EXISTS ${TABLE_NAME_INFO_METER};`;
    const results = await db?.executeSql(query);
    console.log('deletedb: ', results);
    await checkTabelDBIfExist();
    return true;
  } catch (err :any) {
    console.log(TAG, 'err tabel exist: ', err.message);
  }
  return false;
};
export const getDBConnection = async (): Promise<SQLiteDatabase | null> => {
  try {
    if (!db) {
      console.log('📂 Opening database:', NAME_CSDL);
      db = await SQLite.openDatabase({
        name: NAME_CSDL,
        location: 'default',
      });
      console.log('✅ Database opened successfully');
    }
    return db;
  } catch (error) {
    console.error('❌ Error opening database:', error);
    db = null;
    return null;
  }
};

export type PropsCondition = {
  data: { [key: string]: any } | { [key: string]: any }[];
  logic: '=' | '!=' | '<=' | '>=';
  operator: 'AND' | 'OR' | 'LIKE' | '';
};

export interface MeterRepository {
  findAll: (
    pagination?: PropsPagination,
    condition?: PropsCondition,
  ) => Promise<PropsInfoMeterEntity[]>;
  findByColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<PropsInfoMeterEntity[]>;
  findUniqueValuesInColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<any[]>;
  update: (
    condition: PropsCondition,
    valueSet: { [key: string]: any },
  ) => Promise<boolean>;
  save: (item: PropsInfoMeterEntity) => Promise<boolean>;
  getPercentRead: () => Promise<PropsPercentRead>;
  getImage: (seri: string, loaiBCS: string) => Promise<string | null>;
}
export const closeConnection = async () => {
  if (db) {
    console.log('close db connection');

    await db.close();
    db = null;
    return;
  }
};

export const InfoMeterRepository = {} as MeterRepository;

const filterArr = (items: any[], pagination: PropsPagination): any[] => {
  pagination.itemPerPage = pagination.itemPerPage ?? 1;
  pagination.totalPage = Math.floor(items.length / pagination.itemPerPage) + 1;
  const startIndex = pagination.page * pagination.itemPerPage;
  const endIndex =
    pagination.page * pagination.itemPerPage + pagination.itemPerPage;
  // console.log('startIndex', startIndex);
  // console.log('endIndex', endIndex);
  items = items.filter(
    (item, index) => index >= startIndex && index < endIndex,
  );
  return items;
};

InfoMeterRepository.findAll = async (
  pagination?: PropsPagination,
  condition?: PropsCondition,
) => {
  let items: PropsInfoMeterEntity[] = [];
  try {
    if ((await getDBConnection())) {
      return items;
    }
    let query = `SELECT ${GetStringSelectEntity()} FROM ${TABLE_NAME_INFO_METER}`;
    if (condition) {
      let first = true;
      query += `
      WHERE 
      `;
      if (Array.isArray(condition.data) === false) {
        for (let i in condition.data) {
          if (first === true) {
            first = false;
          } else {
            query += ' ' + condition.operator + ' ';
          }

          query +=
            i +
            ' ' +
            condition.logic +
            ' ' +
            convertStringSpecial(condition.data[i]);
        }
      } else {
        for (let obj of condition.data as { [key: string]: any }[]) {
          for (let i in obj) {
            if (first === true) {
              first = false;
            } else {
              query += ' ' + condition.operator + ' ';
            }

            query +=
              i + ' ' + condition.logic + ' ' + convertStringSpecial(obj[i]);
          }
        }
      }

      query += ';';
    }
    //console.log('query:', query);
    const results = await db?.executeSql(query);
    //console.log(results);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        // if (index === 0) {
        //   console.log('result.rows.item(index):', result.rows.item(index));
        // }
        items.push(result.rows.item(index));
      }
    });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  const isGetOnlyInteger = store.state.appSetting.hhu.isOnlyGetIntegers;
  // if(rowKHCMISModel.SERY_CTO === '17306890' && rowKHCMISModel.LOAI_BCS === 'SG')
  //   {
  //     console.log('test here');
  //     console.log('isGetOnlyInteger:', isGetOnlyInteger);
  //     console.log('CS_MOI:', rowKHCMISModel.CS_MOI);
  //     console.log('CS_MOI after:', Number(Number(rowKHCMISModel.CS_MOI).toFixed(0)));
  //     // console.log('isGetOnlyInteger:', isGetOnlyInteger);
  //     // console.log('isGetOnlyInteger:', isGetOnlyInteger);
      
  //   }


  if(isGetOnlyInteger)
  {
    for(let item of items)
    {
      item.CS_MOI = Math.floor(Number(item.CS_MOI)).toString();
      item.CS_CU = Math.floor(Number(item.CS_CU)).toString();
      item.SL_MOI = Math.floor(Number(item.SL_MOI)).toString();
      item.SL_CU = Math.floor(Number(item.SL_CU)).toString();
      item.PMAX = Math.floor(Number(item.PMAX)).toString();
    }
  }
  return items;
};

InfoMeterRepository.findByColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
) => {
  let items: PropsInfoMeterEntity[] = [];
  try {
    if ((await getDBConnection())) {
      return items;
    }

    let clause: string = '';
    const type = getTypeOfColumn(filter.idColumn);
    if (type === 'number') {
      if (isNumeric(filter.startNumber) === false) {
        return items;
      }
      if (isNumeric(filter.endNumber) === true) {
        clause = `WHERE ${filter.idColumn} BETWEEN ${Number(
          filter.startNumber,
        )} AND ${Number(filter.endNumber)} `;
      } else {
        clause = `WHERE ${filter.idColumn} = ${Number(filter.startNumber)}`;
      }
    } else if (type === 'string') {
      clause = `WHERE ${
        filter?.idColumn
      } LIKE '%${filter.valueString?.trim()}%'`;
    } else {
      console.log(TAG, 'No type suitable filter database');
      return items;
    }

    if (sort) {
      if (sort === 'ascending') {
        clause += ` ORDER BY ${filter.idColumn} ASC`;
      } else {
        clause += ` ORDER BY ${filter.idColumn} DESC`;
      }
    }
    const query = `SELECT ${GetStringSelectEntity()} FROM ${TABLE_NAME_INFO_METER} ` + clause;
    //console.log(TAG, query);
    const results = await db?.executeSql(query);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

InfoMeterRepository.findUniqueValuesInColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
) => {
  let items: any[] = [];
  let clause: string = '';
  if (sort) {
    if (sort === 'ascending') {
      clause += ` ORDER BY ${filter.idColumn} ASC`;
    } else {
      clause += ` ORDER BY ${filter.idColumn} DESC`;
    }
  }
  try {
    if ((await getDBConnection())) {
      return items;
    }
    const query =
      `SELECT DISTINCT ${filter.idColumn} FROM ${TABLE_NAME_INFO_METER} ` + clause;
    const results = await db?.executeSql(query);
    results?.forEach(result => {
      
      
      for (let index = 0; index < result.rows.length; index++) {
        //console.log('result.rows.item(index):', result.rows.item(index)[filter.idColumn]);
        items.push( result.rows.item(index)[filter.idColumn]);
      }
    });
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

const convertStringSpecial = (value :any): string => {
  if (typeof value === 'number') {
    return value.toString();
  } else {
    return '"' + value.toString() + '"';
  }
};

InfoMeterRepository.update = async (
  condition: PropsCondition,
  valueSet: { [key: string]: any },
): Promise<boolean> => {
  if ((await getDBConnection())) {
    return false;
  }
  let query: string = `UPDATE ${TABLE_NAME_INFO_METER} 
  SET `;
  let first: boolean;
  first = true;
  for (let i in valueSet) {
    if (first === true) {
      first = false;
    } else {
      query += ', ';
    }

    query += i + ' = ' + convertStringSpecial(valueSet[i]);
  }
  query += `
  WHERE `;
  first = true;

  if (Array.isArray(condition.data) === false) {
    for (let i in condition.data) {
      if (first === true) {
        first = false;
      } else {
        query += ' ' + condition.operator + ' ';
      }

      query +=
        i +
        ' ' +
        condition.logic +
        ' ' +
        convertStringSpecial(condition.data[i]);
    }
  } else {
    for (let obj of condition.data as { [key: string]: any }[]) {
      for (let i in obj) {
        if (first === true) {
          first = false;
        } else {
          query += ' ' + condition.operator + ' ';
        }

        query += i + ' ' + condition.logic + ' ' + convertStringSpecial(obj[i]);
      }
    }
  }

  query += ';';
  // console.log(query);
  try {
    const results = (await db?.executeSql(query)) as [
      { rows: { length: number }; rowsAffected: number },
    ];
    console.log('result update: ' + JSON.stringify(results));
    if (results[0]?.rowsAffected > 0) {
      return true;
    }
  } catch (err :any) {
    console.log(TAG, 'result update: ', err.message);
    return false;
  }

  return false;
};

InfoMeterRepository.getPercentRead = async (): Promise<PropsPercentRead> => {
  // not change position of element in result
  const result: PropsPercentRead = {
    readFailed: 0,
    writeByHand: 0,
    abnormalRead: 0,
    readSucceed: 0,
    haveNotRead: 0,
  };
  try {
    if ((await getDBConnection())) {
      return result;
    }

    let clause: string;
    let query: string;
    let results:
      | [
          {
            insertId: any;
            rows: { item: any; length: number; raw: any };
            rowsAffected: number;
          },
        ]
      | undefined;
    query = `SELECT LoaiDoc FROM ${TABLE_NAME_INFO_METER} `;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.HAVE_NOT_READ};`;
    results = await db?.executeSql(query + clause);
    //console.log('123:', results);
    result.haveNotRead = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.ABNORMAL_CAPACITY};`;
    results = await db?.executeSql(query + clause);
    result.abnormalRead = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.READ_FAILED};`;
    results = await db?.executeSql(query + clause);
    result.readFailed = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.READ_SUCCEED};`;
    results = await db?.executeSql(query + clause);
    result.readSucceed = results[0].rows.length;

    clause = ` WHERE LoaiDoc = ${TYPE_READ_RF.WRITE_BY_HAND};`;
    results = await db?.executeSql(query + clause);
    result.writeByHand = results[0].rows.length;
  } catch (err :any) {
    console.log(TAG, err.message);
  }
  console.log('result aa:', result);
  return result;
};

InfoMeterRepository.save = async (item: PropsInfoMeterEntity): Promise<boolean> => {
  // try {
    if ((await getDBConnection())) {
      return false;
    }

    let queryCheckExist = `SELECT METER_NO FROM ${TABLE_NAME_INFO_METER}  WHERE METER_NO = "${item.METER_NO}";`; //'id'

    const res = await db?.executeSql(queryCheckExist);
    if (res) {
      if (res[0].rows.length > 0) {
        console.log('Item exist ' + item.METER_NO);
        return true;
      }
    }

    let query = `INSERT INTO ${TABLE_NAME_INFO_METER} (`;
    let first: boolean;
    first = true;
    for (let i in item) {
      if (first === true) {
        first = false;
      } else {
        query += ',';
      }

      query += i;
    }
    query += `)
  VALUES
  (`;
    first = true;
    for (let i in item) {
      if (first === true) {
        first = false;
      } else {
        query += ',';
      }

      query += `"${item[i]}"`;
    }
    query += ');';
    //console.log('query:', query);
    
    await db?.executeSql(query);
    console.log(query)
    return true;
  // } catch (error) {
  //   console.log(TAG, error.message);
  // }
  return false;
};
