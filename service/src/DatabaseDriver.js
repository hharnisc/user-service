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
    const providerData = {};
    providerData[provider] = providerInfo;
    return rethinkdb
      .table(this.userTable)
      .get(userId)
      .update({
        email,
        emails: rethinkdb.row('emails').setInsert(email),
        providers: rethinkdb.row('providers').merge(providerData),
        verified,
      })
      .run(this.connection);
  }
}
