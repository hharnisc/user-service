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
rethinkdb.run = jest.fn().mockImplementation(() => (
  new Promise((resolve) => {
    resolve({
      changes: [{
        new_val: 'result',
      }],
    });
  })
));
rethinkdb.updateRun = jest.fn().mockImplementation(() => (
  new Promise((resolve) => {
    resolve({
      changes: [{
        new_val: 'update',
      }],
    });
  })
));
rethinkdb.getRun = jest.fn().mockImplementation(() => (
  new Promise((resolve) => {
    resolve('get');
  })
));
rethinkdb.limitRun = jest.fn().mockImplementation(() => (
  new Promise((resolve) => {
    resolve({
      toArray: () => (
        [{
          human: 'yes',
        }]
      ),
    });
  })
));
rethinkdb.limitRunEmpty = jest.fn().mockImplementation(() => (
  new Promise((resolve) => {
    resolve({
      toArray: () => (
        []
      ),
    });
  })
));
rethinkdb.insert = jest.fn().mockImplementation(() => ({ run: rethinkdb.run }));
rethinkdb.update = jest.fn().mockImplementation(() => ({ run: rethinkdb.updateRun }));
rethinkdb.get = jest.fn().mockImplementation(() => ({
  update: rethinkdb.update,
  run: rethinkdb.getRun,
}));
rethinkdb.limit = jest.fn().mockImplementation(() => ({ run: rethinkdb.limitRun }));
rethinkdb.limitEmpty = jest.fn().mockImplementation(() => ({ run: rethinkdb.limitRunEmpty }));
rethinkdb.filter = jest.fn().mockImplementation((filterOptions) => {
  if (filterOptions === 'empty') {
    return { limit: rethinkdb.limitEmpty };
  }
  return { limit: rethinkdb.limit };
});
rethinkdb.filterEmpty = jest.fn().mockImplementation(() => ({ limit: rethinkdb.limitEmpty }));
rethinkdb.table = jest.fn().mockImplementation(() => ({
  insert: rethinkdb.insert,
  get: rethinkdb.get,
  filter: rethinkdb.filter,
}));
rethinkdb.mergeRow = jest.fn().mockImplementation(() => 'merge row');
rethinkdb.setDifferenceRow = jest.fn().mockImplementation(() => 'setDifference row');
rethinkdb.setInsertRow = jest.fn().mockImplementation(() => 'setInsert row');
rethinkdb.containsRow = jest.fn().mockImplementation((arg) => {
  if (arg === 'null@gmail.com') {
    return 'empty';
  }
  return 'contains row';
});
rethinkdb.row = jest.fn().mockImplementation(() => ({
  merge: rethinkdb.mergeRow,
  setInsert: rethinkdb.setInsertRow,
  setDifference: rethinkdb.setDifferenceRow,
  contains: rethinkdb.containsRow,
}));
module.exports = rethinkdb;
