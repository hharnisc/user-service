jest.autoMockOff();
require.requireActual('bluebird');
const rethinkdb = jest.genMockFromModule('rethinkdb');
jest.autoMockOn();
const connection = {
  use: jest.fn(),
};
rethinkdb.init = jest.fn().mockImplementation((config) =>
  new Promise((resolve, reject) => {
    if (config.host === 'localhost') {
      resolve(connection);
    } else {
      reject('bad host detected');
    }
  })
);
rethinkdb.run = jest.fn().mockImplementation((conn, cb) => {
  cb(undefined, 'result');
});
rethinkdb.insert = jest.fn().mockImplementation(() => ({ run: rethinkdb.run }));
rethinkdb.table = jest.fn().mockImplementation(() => ({
  insert: rethinkdb.insert,
}));
module.exports = rethinkdb;
