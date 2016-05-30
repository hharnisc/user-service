jest.unmock('../src/DatabaseDriver');
jest.unmock('../src/symbols');
jest.unmock('lodash');
jest.mock('rethinkdb');
import DatabaseDriver from '../src/DatabaseDriver';
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
      expect(rethinkdb.insert).toBeCalledWith(data);
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
      const verified = true;
      const databaseDriver = new DatabaseDriver();
      const options = { email, provider, providerInfo, verified };
      return databaseDriver.createUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.insert).toBeCalledWith(Object.assign({}, options, { emails: [email] }));
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
            .toBe('Expecting parameters: email, provider, providerInfo, verified');
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
      const verified = true;
      const options = { userId, email, provider, providerInfo, verified };
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
            verified,
          });
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
          });
          expect(rethinkdb.updateRun).toBeCalledWith(databaseDriver.connection);
          expect(result)
            .toBe('update');
        });
    });

    pit('does update only verified', () => {
      const userId = 1;
      const verified = true;
      const options = { userId, verified };
      const databaseDriver = new DatabaseDriver();
      return databaseDriver.updateUser(options)
        .then((result) => {
          expect(rethinkdb.table).toBeCalledWith('users');
          expect(rethinkdb.get).toBeCalledWith(userId);
          expect(rethinkdb.update).toBeCalledWith({
            verified,
          });
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
          });
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

    it('does not update if missing userId', () => {
      const email = 'test@test.com';
      const provider = 'google';
      const providerInfo = { scope: 'email' };
      const verified = true;
      const options = { email, provider, providerInfo, verified };
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
});
