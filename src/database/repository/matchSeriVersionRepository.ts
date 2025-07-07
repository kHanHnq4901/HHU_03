import SQLite from 'react-native-sqlite-storage';
import { NAME_CSDL } from '../../shared/path';
import { isNumeric } from '../../util';
import { getTypeOfColumn, PropsPercentRead } from '../model';
import { PropsFilter, PropsPagination, PropsSorting } from '../service';
import {
  PropsMatchSeriVersionEntity,
  TABLE_NAME_MATCH_SERI_VERSION as TABLE_NAME,
  dumyEntityMatchSeriVersion as dumyEntity,
} from '../entity/matchSeriVersion';

const TAG = 'Repository Match seri version:';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export const checkTableDBIfExist = async (): Promise<boolean> => {
  try {
    if ((await getDBConnection()) === false) {
      return false;
    }
    //const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=${TABLE_NAME_MATCH_SERI_VERSION}`;
    let query = `create table if not exists ${TABLE_NAME} (`;
    let first: boolean;
    first = true;
    for (let i in dumyEntity) {
      if (first === true) {
        first = false;
      } else {
        query += ',';
      }

      query += i;
    }
    query += ')';
    const results = await db?.executeSql(query);
  } catch (err: any) {
    console.log(TAG, 'err tabel exist: ', err.message);
  }
  return false;
};

export const deleteDataDB = async (): Promise<boolean> => {
  try {
    if ((await getDBConnection()) === false) {
      return false;
    }
    //const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=${TABLE_NAME}`;
    let query = `DROP TABLE IF EXISTS ${TABLE_NAME};`;
    const results = await db?.executeSql(query);
    console.log('deletedb: ', results);
    return true;
  } catch (err: any) {
    console.log(TAG, 'err tabel exist: ', err.message);
  }
  return false;
};

export const getDBConnection = async (): Promise<boolean> => {
  let succeed = false;
  if (!db) {
    console.log('get db');
    // console.log(NAME_CSDL.split('.')[0]);
    // console.log(PATH_EXECUTE_CSDL + '/' + NAME_CSDL);
    succeed = await new Promise(async resolve => {
      db = await SQLite.openDatabase(
        {
          name: NAME_CSDL,
          location: 'default',
        },
        () => {
          resolve(true);
        },
        err => {
          console.log('open SQL error:' + err);
          db = null;
          resolve(false);
        },
      );
    });
    //await sleep(500);
    //console.log(await db.executeSql('database tables'));
  } else {
    succeed = true;
  }
  //console.log('succeed:', succeed);
  return succeed;
};

export type PropsCondition = {
  data: { [key: string]: any } | { [key: string]: any }[];
  logic: '=' | '!=' | '<=' | '>=';
  operator: 'AND' | 'OR' | 'LIKE' | '';
};

export interface IMatchSeriVersionRepository {
  findAll: (
    pagination?: PropsPagination,
    condition?: PropsCondition,
  ) => Promise<PropsMatchSeriVersionEntity[]>;
  findByColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<PropsMatchSeriVersionEntity[]>;
  findUniqueValuesInColumn: (
    filter: PropsFilter,
    pagination?: PropsPagination,
    sort?: PropsSorting,
  ) => Promise<any[]>;
  update: (
    condition: PropsCondition,
    valueSet: { [key: string]: any },
  ) => Promise<boolean>;
  save: (item: PropsMatchSeriVersionEntity) => Promise<boolean>;
}
export const closeConnection = async () => {
  if (db) {
    console.log('close db connection');

    await db.close();
    db = null;
    return;
  }
};

export const MatchSeriVersionRepository = {} as IMatchSeriVersionRepository;

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

MatchSeriVersionRepository.findAll = async (
  pagination?: PropsPagination,
  condition?: PropsCondition,
) => {
  let items: PropsMatchSeriVersionEntity[] = [];
  try {
    if ((await getDBConnection()) === false) {
      return items;
    }
    let query = `SELECT * FROM ${TABLE_NAME}`;
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
    console.log(results);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        // if (index === 0) {
        //   console.log('result.rows.item(index):', result.rows.item(index));
        // }
        items.push(result.rows.item(index));
      }
    });
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

MatchSeriVersionRepository.findByColumn = async (
  filter: PropsFilter,
  pagination?: PropsPagination,
  sort?: PropsSorting,
) => {
  let items: PropsMatchSeriVersionEntity[] = [];
  try {
    if ((await getDBConnection()) === false) {
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
    const query = `SELECT * FROM ${TABLE_NAME} ` + clause;
    //console.log(TAG, query);
    const results = await db?.executeSql(query);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

MatchSeriVersionRepository.findUniqueValuesInColumn = async (
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
    if ((await getDBConnection()) === false) {
      return items;
    }
    const query =
      `SELECT DISTINCT ${filter.idColumn} FROM ${TABLE_NAME} ` + clause;
    const results = await db?.executeSql(query);
    results?.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
  } catch (err: any) {
    console.log(TAG, err.message);
  }
  if (pagination) {
    items = filterArr(items, pagination);
  }
  return items;
};

const convertStringSpecial = (value: any): string => {
  if (typeof value === 'number') {
    return value.toString();
  } else {
    return '"' + value.toString() + '"';
  }
};

MatchSeriVersionRepository.update = async (
  condition: PropsCondition,
  valueSet: { [key: string]: any },
): Promise<boolean> => {
  if ((await getDBConnection()) === false) {
    return false;
  }
  let query: string = `UPDATE ${TABLE_NAME} 
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
  console.log(query);
  try {
    const results = (await db?.executeSql(query)) as [
      { rows: { length: number }; rowsAffected: number },
    ];
    console.log('result update: ' + JSON.stringify(results));
    if (results[0]?.rowsAffected > 0) {
      return true;
    }
  } catch (err: any) {
    console.log(TAG, 'result update: ', err.message);
    return false;
  }

  return false;
};

MatchSeriVersionRepository.save = async (
  item: PropsMatchSeriVersionEntity,
): Promise<boolean> => {
  try {
    if ((await getDBConnection()) === false) {
      return false;
    }

    let queryCheckExist = `SELECT id FROM ${TABLE_NAME}  WHERE id = "${item.id}";`; //'id'

    const res = await db?.executeSql(queryCheckExist);
    if (res) {
      if (res[0].rows.length > 0) {
        console.log('Item exist ' + item.id);
        return true;
      }
    }

    let query = `INSERT INTO ${TABLE_NAME} (`;
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
    await db?.executeSql(query);
    return true;
  } catch (error) {
    console.log(TAG, error.message);
  }
  return false;
};
