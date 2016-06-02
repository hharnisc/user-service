# User

[![Build Status](https://travis-ci.org/hharnisc/user-service.svg?branch=master)](https://travis-ci.org/hharnisc/user-service)

A user management service

## Table Of Contents

- [Quickstart](#quickstart)
- [Testing](#testing)
- [Running Locally](#running-locally)
- [Deploy Locally](#deploy-locally)
- [Deploy To Production](#deploy-to-production)
- [User Object](#user-object)
- [API](#api)

## Quickstart

Install [docker toolbox](https://www.docker.com/products/docker-toolbox)

Install redspread (local kubernetes cluster management)

```bash
$ brew tap redspread/spread
$ brew install spread
```

Start Up `localkube`

```bash
$ spread cluster start
```

Do a local deploy

```bash
./local_deploy.sh
```

## Testing

Install [docker toolbox](https://www.docker.com/products/docker-toolbox) (for CI tests)

```sh
$ cd service
```

Install dependencies

```sh
$ npm install
```

### CI Tests

```sh
$ npm run test
```

### Run Unit Tests

```sh
$ npm run test:jest
```

### Run Unit Tests (and watch for changes)

```sh
$ npm run test:watch
```

### Run Integration Tests

```sh
$ npm run test:integration
```

## Running Locally

```sh
$ cd service
```

Install dependencies

```sh
$ npm install
```

Start the server

```sh
$ npm start
```

## Deploy Locally

Follow [Quickstart](#quickstart) instructions

## Running locally with hot reload

TODO - (mostly waiting on docker for mac and localkube to play nice)

## Deploy To Production

TODO

## User Object

```json
{
  "id": "1",
  "email": "someone@xyz.com",
  "emails": ["someoneelse@xyz.com", "someone@xyz.com"],
  "providers": {
    "google": {
      /* google provider data*/
    }
  },
  "roles": ["read", "write", "sudo"]
}
```

## API

### GET /health

A health check

#### request

No parameters

#### response

200 - Empty

### POST /v1/addrole

Add a role to a user

#### request

- **role** - *string* - a feature or permission that is enabled for a user
- **userId** - *string* - a user who is given the new role

#### response

- **user** - *object* - complete user object


### POST /v1/removerole

remove a role from a user

#### request

- **role** - *string* - a feature or permission that is enabled for a user
- **userId** - *string* - a user who is given the new role

#### response

- **user** - *object* - complete user object

### POST /v1/create

Creates a new user with a given email address, provider (facebook, twitter, google etc) and if they've come from a verified source.

#### request

- **email** - *string* - email address
- **provider** - *string* - the provider the user was authenticated against (facebook, twitter, google, etc)
- **providerInfo** - *object* - the data received from the provider
- **roles** - *array* - a list of roles to apply to the user
- **verified** - *boolean* - did the providerInfo come from a verified source?

#### response

- **user** - *object* - complete user object

### POST /v1/update

Updates a user with a userId.

All fields except `id` are optional.

- `email` sets current email and appends to known emails if not seen yet
- `provider` must be specified if `providerInfo` is set
- `providerInfo` is merged onto the user `providers` field with the key specified in the `provider` input parameters. Much like using

```js
Object.assign(existing, updated)
```

- `verified` can be flipped between true/false

#### request

- **id** - *string* - user id to update
- **email** - *string* - (optional) email address
- **provider** - *string* - (optional) the provider the user was authenticated against (facebook, twitter, google, etc)
- **providerInfo** - *object* - (optional) the data received from the provider
- **verified** - *boolean* - (optional) did the providerInfo come from a verified source?

#### response

- **user** - *object* - complete user object
