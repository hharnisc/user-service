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
rethinkdb.updateRun = jest.fn().mockImplementation(() => (
  new Promise((resolve) => {
    resolve('update');
  })
));
rethinkdb.insert = jest.fn().mockImplementation(() => ({ run: rethinkdb.run }));
rethinkdb.update = jest.fn().mockImplementation(() => ({ run: rethinkdb.updateRun }));
rethinkdb.get = jest.fn().mockImplementation(() => ({
  update: rethinkdb.update,
}));
rethinkdb.table = jest.fn().mockImplementation(() => ({
  insert: rethinkdb.insert,
  get: rethinkdb.get,
}));
rethinkdb.mergeRow = jest.fn().mockImplementation(() => 'merge row');
rethinkdb.setInsertRow = jest.fn().mockImplementation(() => 'setInsert row');
rethinkdb.row = jest.fn().mockImplementation(() => ({
  merge: rethinkdb.mergeRow,
  setInsert: rethinkdb.setInsertRow,
}));
module.exports = rethinkdb;
