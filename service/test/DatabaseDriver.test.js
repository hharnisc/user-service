jest.unmock('../src/DatabaseDriver');
jest.mock('rethinkdb');
import DatabaseDriver from '../src/DatabaseDriver';
import { INSERT } from '../src/symbols';
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

  it('does handle database connection errors', (done) => {
    const rethinkdbConfig = {
      config: {
        host: 'badhost',
        port: 28015,
      },
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    databaseDriver.init()
    .then(() => {
      throw new Error('Expecting connection to be invalid');
    })
    .catch((err) => {
      expect(err).toBe('bad host detected');
      done();
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

  it('does insert data into database', (done) => {
    const databaseDriver = new DatabaseDriver();
    const table = 'sessions';
    const data = { someData: 'DATA!' };
    const options = { table, data };
    databaseDriver[INSERT](options).then((result) => {
      expect(result).toBe('result');
      expect(rethinkdb.table).toBeCalledWith(table);
      expect(rethinkdb.insert).toBeCalledWith(data);
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection, jasmine.any(Function));
      done();
    });
  });

  it('does have a function to create new users', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.createUser).toBeDefined();
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

  it('does create a new user', (done) => {
    const email = 'test@test.com';
    const provider = 'google';
    const prodviderInfo = {
      userId: 1234,
      scope: ['email'],
    };
    const verified = true;
    const databaseDriver = new DatabaseDriver();
    const options = { email, provider, prodviderInfo, verified };
    databaseDriver.createUser(options)
      .then((result) => {
        expect(rethinkdb.table).toBeCalledWith('users');
        expect(rethinkdb.insert).toBeCalledWith(Object.assign({}, options, { emails: [email] }));
        expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection, jasmine.any(Function));
        expect(result)
          .toEqual('result');
        done();
      });
  });
});
