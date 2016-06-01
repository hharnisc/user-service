import test from 'tape';
import tapSpec from 'tap-spec';
import requestPromise from 'request-promise';
import retryPromise from 'retry-promise';
import rethinkdb from 'rethinkdb';
import rethinkdbInit from 'rethinkdb-init';
rethinkdbInit(rethinkdb);


test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

const before = test;
const after = test;

let connection;
let userId;
const host = process.env.HOST || 'user';
const port = process.env.PORT || 8080;

const config = {
  host: process.env.RETHINKDB_SERVICE_HOST || 'rethinkdb',
  port: 28015,
  db: 'auth',
};
const tableConfig = [
  'users',
];

const connectDB = () => (
  rethinkdb.init(config, tableConfig)
    .then((conn) => {
      conn.use(config.db);
      connection = conn;
    })
);

const disconnectDB = () => {
  if (connection) {
    connection.close();
  }
};

const populateDB = () => (
  rethinkdb.table('users')
    .insert({ roles: ['read'] })
    .run(connection)
  .then((result) => {
    userId = result.generated_keys[0];
  })
);

const resetDB = () => (
  rethinkdb.table('users')
    .delete()
    .run(connection)
);

before('before', (t) => {
  const healthCheck = (attempt) => {
    if (attempt > 1) {
      t.comment('Health Check Failed Retrying...');
    }
    return requestPromise({
      method: 'GET',
      uri: `http://${host}:${port}/health`,
      json: true,
      resolveWithFullResponse: true,
    }).then((response) => {
      if (response.statusCode !== 200) {
        throw new Error('Health Check Failed');
      }
    });
  };
  return retryPromise({ max: 5, backoff: 1000 }, healthCheck)
    .then(() => connectDB())
    .then(() => {
      t.pass('Connect To SUT and Database');
      t.end();
    })
    .catch((error) => t.fail(error));
});

test('GET /v1/thetime', (t) => {
  requestPromise({
    method: 'GET',
    uri: `http://${host}:${port}/v1/thetime`,
    json: true,
    resolveWithFullResponse: true,
  })
    .then((response) => {
      t.equal(response.statusCode, 200, 'has statusCode 200');
      t.deepEqual(
        Object.keys(response.body).sort(),
        ['time'],
        'response has expected keys'
      );
      t.end();
    })
    .catch((error) => t.fail(error));
});

test('POST /v1/addrole', (t) => {
  populateDB()
    .then(() => (
      requestPromise({
        method: 'POST',
        body: {
          userId,
          role: 'test',
        },
        uri: `http://${host}:${port}/v1/addrole`,
        json: true,
        resolveWithFullResponse: true,
      })
    ))
      .then((response) => {
        t.equal(response.statusCode, 200, 'has statusCode 200');
        t.deepEqual(
          response.body,
          {
            id: userId,
            roles: [
              'read',
              'test',
            ],
          },
          'response has expected user data'
        );
      })
      .then(() => (
        rethinkdb.table('users')
          .get(userId)
          .run(connection)
          .then((user) => {
            t.deepEqual(user, {
              id: userId,
              roles: [
                'read',
                'test',
              ],
            }, 'role added to database');
          })
      ))
      .catch((error) => t.fail(error))
      .then(() => resetDB())
      .then(() => t.end());
});

test('POST /v1/removerole', (t) => {
  populateDB()
    .then(() => (
      requestPromise({
        method: 'POST',
        body: {
          userId,
          role: 'read',
        },
        uri: `http://${host}:${port}/v1/removerole`,
        json: true,
        resolveWithFullResponse: true,
      })
    ))
      .then((response) => {
        t.equal(response.statusCode, 200, 'has statusCode 200');
        t.deepEqual(
          response.body,
          {
            id: userId,
            roles: [],
          },
          'response has expected user data'
        );
      })
      .then(() => (
        rethinkdb.table('users')
          .get(userId)
          .run(connection)
          .then((user) => {
            t.deepEqual(user, {
              id: userId,
              roles: [],
            }, 'role deleted from database');
          })
      ))
      .catch((error) => t.fail(error))
      .then(() => resetDB())
      .then(() => t.end());
});


after('after', (t) => {
  disconnectDB();
  t.pass('Disconnected from DB');
  t.end();
});
