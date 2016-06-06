jest.unmock('../src/DatabaseDriver');
jest.unmock('../src/symbols');
jest.unmock('lodash');
jest.mock('rethinkdb');
import DatabaseDriver from '../src/DatabaseDriver';
import _ from 'lodash';
import {
  INSERT,
  HAS_ALL_KEYS,
} from '../src/symbols';
import rethinkdb from 'rethinkdb';

describe('DatabaseDriver', () => {
  it('does exist', () => {
    expect(DatabaseDriver).not.toEqual({});
  });

  it('does initialize database', (done) => {
    const rethinkdbConfig = {
      config: {
        host: 'localhost',
        port: 28015,
        db: 'someDb',
      },
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    databaseDriver.init().then(() => {
      expect(databaseDriver.connection.use).toBeCalledWith(rethinkdbConfig.config.db);
      expect(rethinkdb.init).toBeCalledWith(rethinkdbConfig.config, undefined);
      done();
    });
  });

  pit('does handle database connection errors', () => {
    const rethinkdbConfig = {
      config: {
        host: 'badhost',
        port: 28015,
      },
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    return databaseDriver.init()
    .then(() => {
      throw new Error('Expecting connection to be invalid');
    })
    .catch((err) => {
      expect(err).toBe('bad host detected');
    });
  });

  it('does init db with tables and indexes', (done) => {
    const rethinkdbConfig = {
      config: {
        host: 'localhost',
        port: 28015,
        db: 'someDb',
      },
      tableConfig: [
        'a',
        'b',
      ],
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    databaseDriver.init().then(() => {
      expect(rethinkdb.init).toBeCalledWith(rethinkdbConfig.config, rethinkdbConfig.tableConfig);
      done();
    });
  });

  it('does have a private insert method', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver[INSERT]).toBeDefined();
  });

  pit('does insert data into database', () => {
    const databaseDriver = new DatabaseDriver();
    const table = 'sessions';
    const data = { someData: 'DATA!' };
    const options = { table, data };
    databaseDriver[INSERT](options).then((result) => {
      expect(result).toBe('result');
      expect(rethinkdb.table).toBeCalledWith(table);
      expect(rethinkdb.insert).toBeCalledWith(data, { returnChanges: 'always' });
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
    });
  });

  it('does set a default table for users', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.userTable).toBe('users');
  });

  it('does allow user table name to be configured', () => {
    const userTable = 'otherUserTable';
    const databaseDriver = new DatabaseDriver({ userTable });
    expect(databaseDriver.userTable).toBe(userTable);
  });

  describe('createUser', () => {
    it('does have a function to create new users', () => {
      const databaseDriver = new DatabaseDriver();
      expect(databaseDriver.createUser).toBeDefined();
    });

    pit('does create a new user', () => {
      const email = 'test@test.com';
      const provider = 'google';
      const providerInfo = {
        userId: 1234,
        scope: ['email'],
      };
      const roles = [];
      const databaseDriver = new DatabaseDriver();
      const options = { email, provider, providerInfo, roles };
      const expectedInsertOptions = {
        email,
        emails: [email],
        providers: { google: providerInfo },
        roles,
      };
      return databaseDriver.createUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.insert).toBeCalledWith(
            expectedInsertOptions,
            { returnChanges: 'always' }
          );
          expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toEqual('result');
        });
    });

    pit('does create a new user and de-dupe roles', () => {
      const email = 'test@test.com';
      const provider = 'google';
      const providerInfo = {
        userId: 1234,
        scope: ['email'],
      };
      const roles = ['a', 'a'];
      const databaseDriver = new DatabaseDriver();
      const options = { email, provider, providerInfo, roles };
      const expectedInsertOptions = {
        email,
        emails: [email],
        providers: { google: providerInfo },
        roles: _.uniq(roles),
      };
      return databaseDriver.createUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.insert).toBeCalledWith(
            expectedInsertOptions,
            { returnChanges: 'always' }
          );
          expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toEqual('result');
        });
    });

    pit('does not create a user with missing options', () => {
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.createUser({})
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('Expecting parameters: email, provider, providerInfo, roles');
        });
    });
  });

  describe('[HAS_ALL_KEYS]', () => {
    it('does hava a method to verify option keys', () => {
      const databaseDriver = new DatabaseDriver();
      expect(databaseDriver[HAS_ALL_KEYS])
        .toBeDefined();
    });

    pit('does verify that option keys match expected keys', () => {
      const expectedKeys = ['a'];
      const options = { a: true };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver[HAS_ALL_KEYS](expectedKeys, options);
    });

    it('does detect that option keys missing', () => {
      const expectedKeys = ['a'];
      const options = {};
      const databaseDriver = new DatabaseDriver();
      return databaseDriver[HAS_ALL_KEYS](expectedKeys, options)
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('Expecting parameters: a');
        });
    });
  });

  describe('updateUser', () => {
    it('does exist', () => {
      const databaseDriver = new DatabaseDriver();
      expect(databaseDriver.updateUser)
        .toBeDefined();
    });

    pit('does update a user', () => {
      const userId = 1;
      const email = 'test@test.com';
      const provider = 'google';
      const providerInfo = { scope: 'email' };
      const options = { userId, email, provider, providerInfo };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.get).toBeCalledWith(userId);
          expect(rethinkdb.row).toBeCalledWith('providers');
          expect(rethinkdb.row).toBeCalledWith('emails');
          expect(rethinkdb.setInsertRow).toBeCalledWith(email);
          expect(rethinkdb.update).toBeCalledWith({
            email,
            emails: 'setInsert row',
            providers: 'merge row',
          }, { returnChanges: 'always' });
          const expectedMergeRow = {};
          expectedMergeRow[provider] = providerInfo;
          expect(rethinkdb.mergeRow).toBeCalledWith(expectedMergeRow);
          expect(rethinkdb.updateRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toBe('update');
        });
    });

    pit('does update only an email address', () => {
      const userId = 1;
      const email = 'test@test.com';
      const options = { userId, email };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.get).toBeCalledWith(userId);
          expect(rethinkdb.row).toBeCalledWith('emails');
          expect(rethinkdb.setInsertRow).toBeCalledWith(email);
          expect(rethinkdb.update).toBeCalledWith({
            email,
            emails: 'setInsert row',
          }, { returnChanges: 'always' });
          expect(rethinkdb.updateRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toBe('update');
        });
    });

    pit('does update only provider and providerInfo', () => {
      const userId = 1;
      const provider = 'google';
      const providerInfo = { scope: 'email' };
      const options = { userId, provider, providerInfo };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.get).toBeCalledWith(userId);
          expect(rethinkdb.row).toBeCalledWith('providers');
          expect(rethinkdb.row).toBeCalledWith('emails');
          expect(rethinkdb.update).toBeCalledWith({
            providers: 'merge row',
          }, { returnChanges: 'always' });
          const expectedMergeRow = {};
          expectedMergeRow[provider] = providerInfo;
          expect(rethinkdb.mergeRow).toBeCalledWith(expectedMergeRow);
          expect(rethinkdb.updateRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toBe('update');
        });
    });

    pit('does not update if only provider is set', () => {
      const userId = 1;
      const provider = 'google';
      const options = { userId, provider };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('provider and providerInfo must both be set if either is specified');
        });
    });

    pit('does not update if no values are set', () => {
      const userId = 1;
      const options = { userId };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('at least one value must be set');
        });
    });

    pit('does not update if missing userId', () => {
      const email = 'test@test.com';
      const provider = 'google';
      const providerInfo = { scope: 'email' };
      const options = { email, provider, providerInfo };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('userId is a required parameter');
        });
    });
  });

  describe('addRole', () => {
    it('does exist', () => {
      const databaseDriver = new DatabaseDriver();
      expect(databaseDriver.addRole)
        .toBeDefined();
    });

    pit('does add a role to a user', () => {
      const userId = 1;
      const role = 'test';
      const options = { userId, role };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.addRole(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.get).toBeCalledWith(userId);
          expect(rethinkdb.row).toBeCalledWith('roles');
          expect(rethinkdb.setInsertRow).toBeCalledWith(role);
          expect(rethinkdb.update).toBeCalledWith({
            roles: 'setInsert row',
          }, { returnChanges: 'always' });
          expect(rethinkdb.updateRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toBe('update');
        });
    });

    pit('does not add a role with missing options', () => {
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.addRole({})
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('Expecting parameters: userId, role');
        });
    });
  });

  describe('removeRole', () => {
    it('exists', () => {
      const databaseDriver = new DatabaseDriver();
      expect(databaseDriver.removeRole)
        .toBeDefined();
    });

    pit('does add a role to a user', () => {
      const userId = 1;
      const role = 'test';
      const options = { userId, role };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.removeRole(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.get).toBeCalledWith(userId);
          expect(rethinkdb.row).toBeCalledWith('roles');
          expect(rethinkdb.setDifferenceRow).toBeCalledWith([role]);
          expect(rethinkdb.update).toBeCalledWith({
            roles: 'setDifference row',
          }, { returnChanges: 'always' });
          expect(rethinkdb.updateRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toBe('update');
        });
    });

    pit('does not remove a role with missing options', () => {
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.removeRole({})
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('Expecting parameters: userId, role');
        });
    });
  });

  describe('getUser', () => {
    it('exists', () => {
      const databaseDriver = new DatabaseDriver();
      expect(databaseDriver.getUser)
        .toBeDefined();
    });

    it('gets an existing user', () => {
      const email = 'test@gmail.com';
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.getUser({ email })
        .then((result) => {
          expect(rethinkdb.table)
            .toBeCalledWith('users');
          expect(rethinkdb.row)
            .toBeCalledWith('emails');
          expect(rethinkdb.containsRow)
            .toBeCalledWith(email);
          expect(rethinkdb.filter)
            .toBeCalledWith('contains row');
          expect(rethinkdb.limit)
            .toBeCalledWith(1);
          expect(rethinkdb.limitRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toEqual({ human: 'yes' });
        });
    });

    it('returns null for non-existent user', () => {
      const email = 'null@gmail.com';
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.getUser({ email })
        .then((result) => {
          expect(rethinkdb.table)
            .toBeCalledWith('users');
          expect(rethinkdb.row)
            .toBeCalledWith('emails');
          expect(rethinkdb.containsRow)
            .toBeCalledWith(email);
          expect(rethinkdb.filter)
            .toBeCalledWith('empty');
          expect(rethinkdb.limitEmpty)
            .toBeCalledWith(1);
          expect(rethinkdb.limitRunEmpty).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toEqual(null);
        });
    });

    it('does not get user when missing userId param', () => {
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.getUser()
        .then(() => {
          throw new Error('This should have broken');
        })
        .catch((err) => {
          expect(err.message)
            .toBe('Expecting parameters: email');
        });
    });
  });
});
