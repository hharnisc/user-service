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
module.exports = rethinkdb;
