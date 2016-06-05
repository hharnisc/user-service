jest.unmock('../src/Router');
jest.unmock('../src/symbols');
jest.unmock('supertest');
jest.unmock('express');
jest.unmock('body-parser');
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import {
  INIT_ROUTES,
} from '../src/symbols';
import Router from '../src/Router';

describe('Router', () => {
  it('does exist', () => {
    expect(Router).not.toEqual({});
  });

  it('does initialize a Router with the DatabaseDriver', () => {
    const dbDriver = 'some db driver';
    const router = new Router({ dbDriver });
    expect(router.dbDriver)
      .toBe(dbDriver);
  });

  it('does have a method to initialize routes', () => {
    const router = new Router();
    expect(router[INIT_ROUTES])
      .toBeDefined();
  });

  describe('/addrole', () => {
    it('does handle route', (done) => {
      const userId = 1;
      const role = 'read';
      const dbDriver = {
        addRole: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
          userId,
          role,
        }))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/addrole')
        .send({
          userId,
          role,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(200);
          expect(res.body)
            .toEqual({
              userId,
              role,
            });
        })
        .end(done);
    });

    it('does handle errors', (done) => {
      const userId = 1;
      const role = 'read';
      const error = 'some error';
      const dbDriver = {
        addRole: jest.fn().mockImplementation(() =>
          new Promise((resolve, reject) => reject(error))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/addrole')
        .send({
          userId,
          role,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(400);
          expect(res.body)
            .toEqual({ error });
        })
        .end(done);
    });
  });

  describe('/removerole', () => {
    it('does handle route', (done) => {
      const userId = 1;
      const role = 'read';
      const dbDriver = {
        removeRole: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
          userId,
        }))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/removerole')
        .send({
          userId,
          role,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(200);
          expect(res.body)
            .toEqual({
              userId,
            });
        })
        .end(done);
    });

    it('does handle errors', (done) => {
      const userId = 1;
      const role = 'read';
      const error = 'some error';
      const dbDriver = {
        removeRole: jest.fn().mockImplementation(() =>
          new Promise((resolve, reject) => reject(error))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/removerole')
        .send({
          userId,
          role,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(400);
          expect(res.body)
            .toEqual({ error });
        })
        .end(done);
    });
  });

  describe('/create', () => {
    it('does handle route', (done) => {
      const email = 'test@test.com';
      const provider = 'twitter';
      const providerInfo = {
        handle: 'test',
        scope: 'read',
      };
      const roles = ['admin'];
      const dbDriver = {
        createUser: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
          email,
        }))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/create')
        .send({
          email,
          provider,
          providerInfo,
          roles,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(200);
          expect(res.body)
            .toEqual({
              email,
            });
        })
        .end(done);
    });

    it('does handle errors', (done) => {
      const email = 'test@test.com';
      const provider = 'twitter';
      const providerInfo = {
        handle: 'test',
        scope: 'read',
      };
      const roles = ['admin'];
      const error = 'some error';
      const dbDriver = {
        createUser: jest.fn().mockImplementation(() =>
          new Promise((resolve, reject) => reject(error))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/create')
        .send({
          email,
          provider,
          providerInfo,
          roles,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(400);
          expect(res.body)
            .toEqual({ error });
        })
        .end(done);
    });

    it('does set default args on roles', (done) => {
      const email = 'test@test.com';
      const provider = 'twitter';
      const providerInfo = {
        handle: 'test',
        scope: 'read',
      };
      const dbDriver = {
        createUser: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
          email,
        }))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/create')
        .send({
          email,
          provider,
          providerInfo,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(200);
          expect(res.body)
            .toEqual({
              email,
            });
          expect(dbDriver.createUser)
            .toBeCalledWith({
              email,
              provider,
              providerInfo,
              roles: [],
            });
        })
        .end(done);
    });
  });

  describe('/update', () => {
    it('does handle route', (done) => {
      const email = 'test@test.com';
      const provider = 'twitter';
      const providerInfo = {
        handle: 'test',
        scope: 'read',
      };
      const dbDriver = {
        updateUser: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
          email,
        }))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/update')
        .send({
          email,
          provider,
          providerInfo,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(200);
          expect(res.body)
            .toEqual({
              email,
            });
        })
        .end(done);
    });

    it('does handle errors', (done) => {
      const email = 'test@test.com';
      const provider = 'twitter';
      const providerInfo = {
        handle: 'test',
        scope: 'read',
      };
      const error = 'some error';
      const dbDriver = {
        updateUser: jest.fn().mockImplementation(() =>
          new Promise((resolve, reject) => reject(error))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .post('/update')
        .send({
          email,
          provider,
          providerInfo,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(400);
          expect(res.body)
            .toEqual({ error });
        })
        .end(done);
    });
  });

  describe('/get', () => {
    it('does handle route', (done) => {
      const userId = 1;
      const user = {
        human: true,
      };
      const dbDriver = {
        getUser: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(user))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .get('/get')
        .send({
          userId,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(200);
          expect(res.body)
            .toEqual(user);
          expect(dbDriver.getUser)
            .toBeCalledWith({
              userId,
            });
        })
        .end(done);
    });

    it('does handle errors', (done) => {
      const userId = 1;
      const error = 'some error';
      const dbDriver = {
        getUser: jest.fn().mockImplementation(() =>
          new Promise((resolve, reject) => reject(error))),
      };
      const router = new Router({ dbDriver });
      const app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(router.router);
      request(app)
        .get('/get')
        .send({
          userId,
        })
        .expect((res) => {
          expect(res.status)
            .toEqual(400);
          expect(res.body)
            .toEqual({ error });
        })
        .end(done);
    });
  });
});
