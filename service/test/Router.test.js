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

  it('does handle /thetime route', (done) => {
    const router = new Router();
    const app = express();
    const time = 1300;
    Date.now = jest.fn().mockReturnValue(time);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .get('/thetime')
      .expect((res) => {
        expect(res.status)
          .toEqual(200);
        expect(res.body)
          .toEqual({ time });
      })
      .end(done);
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
});
