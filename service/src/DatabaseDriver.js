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
      .insert(data, { returnChanges: 'always' })
      .run(this.connection)
      .then((result) => result.changes[0].new_val);
  }

  [HAS_ALL_KEYS](expectedKeys, options) {
    return new Promise((resolve, reject) => {
      if (!_.isEmpty(_.xor(expectedKeys, _.keys(options)))) {
        reject(Error(`Expecting parameters: ${expectedKeys.join(', ')}`));
      } else {
        resolve();
      }
    });
  }

  createUser(options = {}) {
    return this[HAS_ALL_KEYS](
      ['email', 'provider', 'providerInfo', 'roles'],
      options
    )
      .then(() => {
        const { email, provider, providerInfo, roles } = options;
        const emails = [email];
        const table = this.userTable;
        const providers = {};
        providers[provider] = providerInfo;
        const uniqueRoles = _.uniq(roles);
        const now = Date.now();
        return this[INSERT]({
          table,
          data: {
            email,
            emails,
            providers,
            roles: uniqueRoles,
            createdAt: now,
            updatedAt: now,
          },
        });
      });
  }

  updateUser(options = {}) {
    const { userId, email, provider, providerInfo } = options;
    return new Promise((resolve, reject) => {
      if (userId) {
        resolve();
      } else {
        reject(Error('userId is a required parameter'));
      }
    })
      .then(() => {
        const updateValue = {};
        if (email) {
          Object.assign(updateValue, {
            email,
            emails: rethinkdb.row('emails').setInsert(email),
          });
        }
        return updateValue;
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
        if (_.isEmpty(updateValue)) {
          throw new Error('at least one value must be set');
        }
        return updateValue;
      })
      .then((updateValue) => (
        rethinkdb
          .table(this.userTable)
          .get(userId)
          .update(
            Object.assign(updateValue, { updatedAt: Date.now() }),
            { returnChanges: 'always' }
          )
          .run(this.connection)
      ))
      .then((result) => result.changes[0].new_val);
  }

  getUser(options = {}) {
    const { email } = options;
    return this[HAS_ALL_KEYS](
      ['email'],
      options
    )
      .then(() => (
        rethinkdb
          .table(this.userTable)
          .filter(rethinkdb.row('emails').contains(email))
          .limit(1)
          .run(this.connection)
          .then((cursor) => cursor.toArray())
      ))
      .then((users) => {
        if (users.length) {
          return users[0];
        }
        return null;
      });
  }

  addRole(options = {}) {
    const { userId, role } = options;
    return this[HAS_ALL_KEYS](
      ['userId', 'role'],
      options
    )
      .then(() => (
        rethinkdb
          .table(this.userTable)
          .get(userId)
          .update({
            roles: rethinkdb.row('roles').setInsert(role),
          }, { returnChanges: 'always' })
          .run(this.connection)
      ))
      .then((result) => result.changes[0].new_val);
  }

  removeRole(options = {}) {
    const { userId, role } = options;
    return this[HAS_ALL_KEYS](
      ['userId', 'role'],
      options
    )
      .then(() => (
        rethinkdb
          .table(this.userTable)
          .get(userId)
          .update({
            roles: rethinkdb.row('roles').setDifference([role]),
          }, { returnChanges: 'always' })
          .run(this.connection)
      ))
      .then((result) => result.changes[0].new_val);
  }
}
