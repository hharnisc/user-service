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

    this.router.post('/addrole', (req, res) => {
      this.dbDriver.addRole({
        userId: req.body.userId,
        role: req.body.role,
      })
        .then((user) => res.status(200).send(user))
        .catch((error) => res.status(400).send({ error }));
    });

    this.router.post('/removerole', (req, res) => {
      this.dbDriver.removeRole({
        userId: req.body.userId,
        role: req.body.role,
      })
        .then((user) => res.status(200).send(user))
        .catch((error) => res.status(400).send({ error }));
    });

    this.router.post('/create', (req, res) => {
      this.dbDriver.create({
        email: req.body.email,
        provider: req.body.provider,
        providerInfo: req.body.providerInfo,
        roles: req.body.roles || [],
        verified: req.body.verified || false,
      })
        .then((user) => res.status(200).send(user))
        .catch((error) => res.status(400).send({ error }));
    });
  }
}
