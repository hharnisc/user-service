import {
  INSERT,
  HAS_ALL_KEYS,
} from './symbols';
import _ from 'lodash';
import rethinkdb from 'rethinkdb';
import rethinkdbInit from 'rethinkdb-init';
rethinkdbInit(rethinkdb);

export default class DatabaseDriver {
  constructor(options = {}) {
    this.config = options.config;
    this.tableConfig = options.tableConfig;
    this.userTable = options.userTable || 'users';
  }

  init() {
    return rethinkdb.init(this.config, this.tableConfig)
      .then((connection) => {
        this.connection = connection;
        this.connection.use(this.config.db);
      });
  }

  [INSERT](options = {}) {
    const table = options.table;
    const data = options.data;
    return new Promise((resolve, reject) => {
      rethinkdb.table(table)
        .insert(data)
        .run(this.connection, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  createUser(options = {}) {
    return this[HAS_ALL_KEYS](
      ['email', 'provider', 'prodviderInfo', 'verified'],
      options
    )
      .then(() => {
        const { email, provider, prodviderInfo, verified } = options;
        const emails = [email];
        const table = this.userTable;
        return this[INSERT]({
          table,
          data: {
            email,
            emails,
            provider,
            prodviderInfo,
            verified,
          },
        });
      });
  }

  [HAS_ALL_KEYS](expectedKeys, options) {
    return new Promise((resolve, reject) => {
      if (!_.isEmpty(_.xor(expectedKeys, _.keys(options)))) {
        reject(`Expecting parameters: ${expectedKeys.join(', ')}`);
      } else {
        resolve();
      }
    });
  }
}
