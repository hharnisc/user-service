import express from 'express';
import {
  INIT_ROUTES,
} from './symbols';

export default class Router {
  constructor(options = {}) {
    this.dbDriver = options.dbDriver;
    this.router = new express.Router();
    this[INIT_ROUTES]();
  }

  [INIT_ROUTES]() {
    this.router.get('/thetime', (req, res) => res.status(200).send({
      time: Date.now(),
    }));
  }
}
