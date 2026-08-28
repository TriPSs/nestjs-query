<p align="center">
  <a href="https://nestjs-query.mintlify.site/" target="blank"><img src="https://nestjs-query.mintlify.site/images/logo.svg" width="120" alt="Nestjs-query Logo" /></a>
</p>

[![Test](https://github.com/TriPSs/nestjs-query/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/TriPSs/nestjs-query/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/TriPSs/nestjs-query/branch/master/graph/badge.svg?token=29EX71ID2P)](https://codecov.io/gh/TriPSs/nestjs-query)
[![Known Vulnerabilities](https://snyk.io/test/github/tripss/nestjs-query/badge.svg?targetFile=package.json)](https://snyk.io/test/github/tripss/nestjs-query?targetFile=package.json)
[![slack](https://img.shields.io/badge/slack-nestjsquery-brightgreen.svg?logo=slack)](https://join.slack.com/t/nestjsquery/shared_invite/zt-27dvu0tye-tOcAmeQ0PRSCEInW6P3h9g)

# nestjs-query

Nestjs-Query is a collection of packages for building queryable CRUD APIs with NestJS. It provides reusable query, filtering, sorting, paging, authorization, and persistence-service primitives for GraphQL and REST applications.

## Why?

While working on projects in NestJS it was easy to get up and running with GraphQL, but many resolver patterns were repeated across applications—especially querying, sorting, and paging. Nestjs-Query packages those patterns so they can be configured and reused.

## Installation

[Install Guide](https://nestjs-query.mintlify.site/introduction/install).

## Docs

* [Getting Started](https://nestjs-query.mintlify.site/introduction/getting-started)
* [Install Guide](https://nestjs-query.mintlify.site/introduction/install)
* [Concepts](https://nestjs-query.mintlify.site/concepts/queries)
* [Example](https://nestjs-query.mintlify.site/introduction/example)
* [TypeORM](https://nestjs-query.mintlify.site/persistence/typeorm/getting-started)
* [Sequelize](https://nestjs-query.mintlify.site/persistence/sequelize/getting-started)
* [GraphQL](https://nestjs-query.mintlify.site/graphql/resolvers)

## Packages

Nestjs-query is composed of multiple packages

* [`@ptc-org/nestjs-query-core`](https://github.com/TriPSs/nestjs-query/tree/master/packages/core) - Framework-independent query, service, DTO, and utility primitives.
* [`@ptc-org/nestjs-query-graphql`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-graphql) - GraphQL resolvers, decorators, and CRUD endpoints.
* [`@ptc-org/nestjs-query-rest`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-rest) - REST controllers, decorators, and CRUD endpoints.
* [`@ptc-org/nestjs-query-mikro-orm`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-mikro-orm) - MikroORM persistence service.
* [`@ptc-org/nestjs-query-mongoose`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-mongoose) - Mongoose persistence service.
* [`@ptc-org/nestjs-query-sequelize`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-sequelize) - Sequelize persistence service.
* [`@ptc-org/nestjs-query-typegoose`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-typegoose) - Typegoose persistence service.
* [`@ptc-org/nestjs-query-typeorm`](https://github.com/TriPSs/nestjs-query/tree/master/packages/query-typeorm) - TypeORM persistence service.

## Development

For local development, clone the repository and install dependencies with Yarn 4:

```bash
$ yarn

# To build all packages
$ yarn nx run-many --target=build --all

# To run all tests
$ yarn nx run-many --target=test --all

# To run the standard E2E tests (requires Docker)
$ yarn docker up -d
$ yarn nx e2e examples

# To build one package
$ yarn nx build query-graphql
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete development and pull-request guide. Please also review our [Code of Conduct](CODE_OF_CONDUCT.md).

## Collaboration

If you have questions or [issues](https://github.com/TriPSs/nestjs-query/issues), please [open an issue](https://github.com/TriPSs/nestjs-query/issues/new). For community discussion, join the [NestJS Query Slack](https://join.slack.com/t/nestjsquery/shared_invite/zt-27dvu0tye-tOcAmeQ0PRSCEInW6P3h9g).
