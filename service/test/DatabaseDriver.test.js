jest.unmock('../src/DatabaseDriver');
jest.mock('rethinkdb');
import DatabaseDriver from '../src/DatabaseDriver';
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
});
