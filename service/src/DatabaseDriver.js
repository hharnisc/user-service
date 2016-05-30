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
    return rethinkdb.table(table)
      .insert(data)
      .run(this.connection);
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

  createUser(options = {}) {
    return this[HAS_ALL_KEYS](
      ['email', 'provider', 'providerInfo', 'verified'],
      options
    )
      .then(() => {
        const { email, provider, providerInfo, verified } = options;
        const emails = [email];
        const table = this.userTable;
        return this[INSERT]({
          table,
          data: {
            email,
            emails,
            provider,
            providerInfo,
            verified,
          },
        });
      });
  }

  updateUser(options = {}) {
    const { userId, email, provider, providerInfo, verified } = options;
    return new Promise((resolve) => {
      const updateValue = {};
      if (email) {
        Object.assign(updateValue, {
          email,
          emails: rethinkdb.row('emails').setInsert(email),
        });
      }
      resolve(updateValue);
    })
      .then((updateValue) => {
        if (provider || providerInfo) {
          if (provider && providerInfo) {
            const providerData = {};
            providerData[provider] = providerInfo;
            Object.assign(updateValue, {
              providers: rethinkdb.row('providers').merge(providerData),
            });
          } else {
            throw new Error('provider and providerInfo must both be set if either is specified');
          }
        }
        return updateValue;
      })
      .then((updateValue) => {
        if (verified) {
          Object.assign(updateValue, { verified });
        }
        return updateValue;
      })
      .then((updateValue) => {
        if (_.isEmpty(updateValue)) {
          throw new Error('at least one value must be set');
        }
        return updateValue;
      })
      .then((updateValue) => (
        rethinkdb
          .table(this.userTable)
          .get(userId)
          .update(updateValue)
          .run(this.connection)
      ));
  }
}
