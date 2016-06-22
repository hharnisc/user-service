import express from 'express';
import bodyParser from 'body-parser';
import minimist from 'minimist';
import retryPromise from 'retry-promise';
import DatabaseDriver from './DatabaseDriver';
import Router from './Router';
import healthRouter from './healthRouter';
import { accessLogger, errorLogger, logger } from './logging';

const argv = minimist(process.argv.slice(2), {
  default: {
    port: 8080,
    apiVersion: 'v1',
    dbHost: 'rethinkdb',
    dbPort: 28015,
  },
});
const dbOptions = {
  config: {
    host: argv.dbHost,
    port: argv.dbPort,
    db: 'auth',
  },
  tableConfig: [
    'users',
  ],
  userTable: 'users',
};
const dbDriver = new DatabaseDriver(dbOptions);
const initDb = (attempt) => {
  if (attempt > 1) {
    logger.warn('Attempting to re-connect to database');
  }
  return dbDriver.init();
};
retryPromise({ max: 5, backoff: 10000 }, initDb)
  .then(() => {
    logger.info('Connected to database');
    const appRouter = new Router({ dbDriver });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(accessLogger);
    app.use(`/${argv.apiVersion}`, appRouter.router);
    app.use('/', healthRouter);
    app.use(errorLogger);
    app.listen(argv.port);
    logger.info(`User service started on port ${argv.port}`);
  })
  .catch((error) => {
    logger.error('Error while connecting to database', {
      dbOptions,
      error,
    });
  });
