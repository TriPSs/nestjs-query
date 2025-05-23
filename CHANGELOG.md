 
## [9.0.3](https://github.com/TriPSs/nestjs-query/compare/v9.0.2...v9.0.3) (2025-05-13)


### Bug Fixes

* describe indentation ([90e4074](https://github.com/TriPSs/nestjs-query/commit/90e4074b3229861636f710b2330f6b427525ffef))
* shouldUseSkipTake to handle nested cases ([ec39883](https://github.com/TriPSs/nestjs-query/commit/ec3988326ded3b378b0f3bbe2c69161eb49c1ebe))
* Update peer dependencies to support NestJS v11 ([55edc6a](https://github.com/TriPSs/nestjs-query/commit/55edc6a58b208853662bc05058e6d92d6dd4af51)), closes [#358](https://github.com/TriPSs/nestjs-query/issues/358)



## [9.0.2](https://github.com/TriPSs/nestjs-query/compare/v9.0.1...v9.0.2) (2025-02-17)



## [9.0.1](https://github.com/TriPSs/nestjs-query/compare/v9.0.0...v9.0.1) (2025-02-17)


### Bug Fixes

* Update peer dependencies to support NestJS v11 ([9471198](https://github.com/TriPSs/nestjs-query/commit/9471198b987139f297a56f1f4ca3ed8b5b5dce96)), closes [#358](https://github.com/TriPSs/nestjs-query/issues/358)



# [9.0.0](https://github.com/TriPSs/nestjs-query/compare/v8.0.3...v9.0.0) (2025-02-13)


### Features

* Updated to NestJS 11 ([8fe3ed9](https://github.com/TriPSs/nestjs-query/commit/8fe3ed98e19b2532526258d17758dc9d4055a521))


### BREAKING CHANGES

* Updated to NestJS 11



## [8.0.3](https://github.com/TriPSs/nestjs-query/compare/v8.0.2...v8.0.3) (2025-01-30)



## [8.0.2](https://github.com/TriPSs/nestjs-query/compare/v8.0.1...v8.0.2) (2025-01-21)


### Bug Fixes

* add missing import in doc + upgrading docker image version ([3ce8691](https://github.com/TriPSs/nestjs-query/commit/3ce86913e60a52188e61149c495a533ffa81fd59))
* mongoose ilike comparism wasn capable of searching with fixed start/end letter ([4f90c93](https://github.com/TriPSs/nestjs-query/commit/4f90c936d6fc5af3e1c8d1be35e26ad0d2824944))
* Mongoose ReferenceQueryService only accepted Relations with ObjectIds ([b364870](https://github.com/TriPSs/nestjs-query/commit/b364870b8c7348190359a722785b3c86324353d2))



## [8.0.1](https://github.com/TriPSs/nestjs-query/compare/v8.0.0...v8.0.1) (2024-12-13)


### Bug Fixes

* update missing peerDependencies version increase ([ed6e57c](https://github.com/TriPSs/nestjs-query/commit/ed6e57cecbb9e014c8fb33fc6da9ba1b7e90310e))



# [8.0.0](https://github.com/TriPSs/nestjs-query/compare/v7.1.0...v8.0.0) (2024-12-12)


### Features

* **query-graphql:** Updated graphql subscriptions ([ee688a2](https://github.com/TriPSs/nestjs-query/commit/ee688a2a1dc939964bdcabc07ec2a50de36dc7b7))


### Reverts

* Replace change-case with camel-case in multiple packages ([0720323](https://github.com/TriPSs/nestjs-query/commit/0720323ecf3941a296c909544c08ec3322f4ce54))


### BREAKING CHANGES

* **query-graphql:** Updated to new major version of graphql-subscriptions



# [7.1.0](https://github.com/TriPSs/nestjs-query/compare/v7.0.1...v7.1.0) (2024-10-16)


### Bug Fixes

* Adjust package.json configurations and correct filter defaultValue syntax ([cc19f4c](https://github.com/TriPSs/nestjs-query/commit/cc19f4c4f24f5ae872d966f2719b5ca11edbc99a))


### Features

* support querying soft deleted relations ([00296c0](https://github.com/TriPSs/nestjs-query/commit/00296c0e656f7865bcf5bb54848a07d53be8d7d7))



## [7.0.1](https://github.com/TriPSs/nestjs-query/compare/v7.0.0...v7.0.1) (2024-09-25)


### Bug Fixes

* null condition building for cursor filter ([4eb6e6b](https://github.com/TriPSs/nestjs-query/commit/4eb6e6bf50f48810e8bb5f513e67fb10f004f4a4))
* **query-graphql:** Fix null condition building for cursor filter ([423f320](https://github.com/TriPSs/nestjs-query/commit/423f320647dd205d9c1c2633100e2f7ae0cf1ca2))



# [7.0.0](https://github.com/TriPSs/nestjs-query/compare/v6.1.3...v7.0.0) (2024-07-26)


### Features

* **query-mongoose:** Dropped support of older versions ([7267967](https://github.com/TriPSs/nestjs-query/commit/72679678dbe9aa39f1e40bee1ed2c314b8c599c3))


### BREAKING CHANGES

* **query-mongoose:** Versions 6 and 7 of mongoose are no longer supported



## [6.1.3](https://github.com/TriPSs/nestjs-query/compare/v6.1.2...v6.1.3) (2024-07-25)



## [6.1.2](https://github.com/TriPSs/nestjs-query/compare/v6.1.1...v6.1.2) (2024-07-24)



## [6.1.1](https://github.com/TriPSs/nestjs-query/compare/v6.1.0...v6.1.1) (2024-06-07)


### Bug Fixes

* **query-graphql:** Fixed hard `isDate` validator for custom between filters ([7437e53](https://github.com/TriPSs/nestjs-query/commit/7437e53f521e43fd943ded7b13e7dc5abae3e537))



# [6.1.0](https://github.com/TriPSs/nestjs-query/compare/v6.0.0...v6.1.0) (2024-04-08)


### Bug Fixes

* Fix isValidPaging ([7f8913f](https://github.com/TriPSs/nestjs-query/commit/7f8913f525d56a86c374b0a4aa787e568051974b))


### Features

* **query-graphql:** Adds enableFetchAllWithNegative option ([6bfc92f](https://github.com/TriPSs/nestjs-query/commit/6bfc92f6ea3781f5619247023fef419c6d1b4299))


### Reverts

* Revert "test: Fix the typeorm tests with negative fetch and my sql" ([066732f](https://github.com/TriPSs/nestjs-query/commit/066732fb048f97d951e55e13e900269cb62f9421))



# [6.0.0](https://github.com/TriPSs/nestjs-query/compare/v5.0.1...v6.0.0) (2024-04-04)


### Bug Fixes

* Explicitly mark types in the assemblers files ([58b94a9](https://github.com/TriPSs/nestjs-query/commit/58b94a9498a54275bc01146550dcd03583d2d753))


### BREAKING CHANGES

* The methods convertToDTO, convertToEntity, convertToCreateEntity, and convertToUpdateEntity now require casting the return value.



## [5.0.1](https://github.com/TriPSs/nestjs-query/compare/v5.1.0-alpha.2...v5.0.1) (2024-03-29)



# [5.1.0-alpha.2](https://github.com/TriPSs/nestjs-query/compare/v5.1.0-alpha.1...v5.1.0-alpha.2) (2024-03-26)


### Bug Fixes

* **query-graphql:** Fixed relations update/aggregate not respecting the given name ([c252b2a](https://github.com/TriPSs/nestjs-query/commit/c252b2af48eafa9be67665f9f61c1eb9c9ab6778)), closes [#239](https://github.com/TriPSs/nestjs-query/issues/239)



# [5.1.0-alpha.1](https://github.com/TriPSs/nestjs-query/compare/v5.1.0-alpha.0...v5.1.0-alpha.1) (2024-02-12)



# [5.1.0-alpha.0](https://github.com/TriPSs/nestjs-query/compare/v5.0.0...v5.1.0-alpha.0) (2024-02-12)


### Performance Improvements

* **query-typeorm:** Custom count implementation for better performance ([eb89f32](https://github.com/TriPSs/nestjs-query/commit/eb89f32475875850062a635731ddfc0fd96d2455))



# [5.0.0](https://github.com/TriPSs/nestjs-query/compare/v4.4.0...v5.0.0) (2024-01-19)


### Bug Fixes

* **query-graphql:** Fixed relations not respecting the given name ([24aeca7](https://github.com/TriPSs/nestjs-query/commit/24aeca7e26eb13c02970d7fb9b1c16ca277595c0)), closes [#217](https://github.com/TriPSs/nestjs-query/issues/217)


### Features

* Make assemblers `convert*` methods async ([9f9af3b](https://github.com/TriPSs/nestjs-query/commit/9f9af3ba233be5faa25c95e713aa39e2c3110578)), closes [#215](https://github.com/TriPSs/nestjs-query/issues/215)


### BREAKING CHANGES

* **query-graphql:** Relation names are no longer automatically pluralized and respect the given name
* All `convert*` methods are now async.
`convertAsyncTo*` methods are dropped in favor of async `convertTo`.



# [4.4.0](https://github.com/TriPSs/nestjs-query/compare/v5.0.0-alpha.0...v4.4.0) (2024-01-11)


### Features

* **query-typeorm:** Support virtual columns in filtering ([0603562](https://github.com/TriPSs/nestjs-query/commit/06035623a783478c760946e801078dfdbbad7ea3)), closes [#67](https://github.com/TriPSs/nestjs-query/issues/67)
* **query-typeorm:** Support virtual columns in sorting ([cb997cf](https://github.com/TriPSs/nestjs-query/commit/cb997cfdea1984d351ec3f544c72dca48a1cf1c3)), closes [#67](https://github.com/TriPSs/nestjs-query/issues/67)



# [5.0.0-alpha.0](https://github.com/TriPSs/nestjs-query/compare/v4.3.3...v5.0.0-alpha.0) (2023-12-24)


### Bug Fixes

* **query-mongoose:** Fixed `count` changed to `countDocuments` ([fc2a899](https://github.com/TriPSs/nestjs-query/commit/fc2a89951613f349f75eac4e14d8cb597b1eada2))


### BREAKING CHANGES

* **query-mongoose:** `mongoose` has been updated to new major version.
 [See breaking changes](https://github.com/Automattic/mongoose/releases/tag/8.0.0-rc0)



## [4.3.3](https://github.com/TriPSs/nestjs-query/compare/v4.3.2...v4.3.3) (2023-12-06)


### Bug Fixes

* Resolve SQL Relationship Filtering ([25b892f](https://github.com/TriPSs/nestjs-query/commit/25b892fa19e4745d4d8fa51714e592921b10357e))



## [4.3.2](https://github.com/TriPSs/nestjs-query/compare/v4.3.1...v4.3.2) (2023-12-01)


### Bug Fixes

* Use the provided connection name ([96fd3e6](https://github.com/TriPSs/nestjs-query/commit/96fd3e6219c9df162156dc95d64d5ebbefdba681))



## [4.3.1](https://github.com/TriPSs/nestjs-query/compare/v4.3.0...v4.3.1) (2023-11-01)


### Bug Fixes

* **query-typeorm:** Fixed group by `WEEK`, `MONTH` and `YEAR` not working in Postgres ([7e60f09](https://github.com/TriPSs/nestjs-query/commit/7e60f097b35d72ad3bcc8178598800f751b360a8)), closes [#163](https://github.com/TriPSs/nestjs-query/issues/163)
* **query-typeorm:** Updated test for `createTypeOrmQueryServiceProviders` ([ea6ae5d](https://github.com/TriPSs/nestjs-query/commit/ea6ae5d218031800bc2504dbf67ed897f6c3bbd2))



# [4.3.0](https://github.com/TriPSs/nestjs-query/compare/v4.2.0...v4.3.0) (2023-10-30)


### Bug Fixes

* add `@apollo/subgraph` dep ([e22e3d6](https://github.com/TriPSs/nestjs-query/commit/e22e3d62c64342f52ed634a9bf8cdc1219ed7df5))
* **query-graphql:** Fixed `@FilterableRelation` not showing in aggregate filters ([23d9caf](https://github.com/TriPSs/nestjs-query/commit/23d9caf2225cb181543810569bb5437288aa5477))
* **query-graphql:** Fixed `@Relation`/`@FilterableRelation` exposing aggregate options ([2a5395d](https://github.com/TriPSs/nestjs-query/commit/2a5395d8b1da3370ead1a1f38c170e232087b85c))
* **query-graphql:** Fixed `FilterableField` not respecting `name` option ([95aebd7](https://github.com/TriPSs/nestjs-query/commit/95aebd7fd86c0072f81af05e67e24009c7391b98)), closes [#169](https://github.com/TriPSs/nestjs-query/issues/169)
* **query-graphql:** Fixed union types crashing `@GraphQLResultInfo` ([51cfe27](https://github.com/TriPSs/nestjs-query/commit/51cfe27647f999c84dd7c6ded558a7ca85d6e334))
* **query-typeorm:** Align mapRelations of one to many with many to many ([1c21c59](https://github.com/TriPSs/nestjs-query/commit/1c21c5929fe569bb466f9c3aea1db186f5ebbeea)), closes [#115](https://github.com/TriPSs/nestjs-query/issues/115) [#175](https://github.com/TriPSs/nestjs-query/issues/175)


### Features

* **query-core:** Added `mergeFilters` helper ([18d0f20](https://github.com/TriPSs/nestjs-query/commit/18d0f2048ed065840eead10c732a256e9010c206))
* **query-core:** Added `transformFilterComparisons` filter helper ([e81eceb](https://github.com/TriPSs/nestjs-query/commit/e81eceb9ab1f2a4d2cdf45ca65069262de6c85ef))



# [4.2.0](https://github.com/TriPSs/nestjs-query/compare/v4.1.0...v4.2.0) (2023-09-29)


### Bug Fixes

* querying for one-to-many or one-to-one relationships in typeorm would not return any entities because of an implementation error when filtering for the correct results after batch selecting all related entities. ([2fbf0b7](https://github.com/TriPSs/nestjs-query/commit/2fbf0b7bb68fa3318798c6f46bebcd8092cc2b07))
* renamed option ([f06b493](https://github.com/TriPSs/nestjs-query/commit/f06b4930d1ce2c220b2a9fdd6b477f0b446b79bf))


### Features

* added custom prefix ([5813ed7](https://github.com/TriPSs/nestjs-query/commit/5813ed7fef67a0c495b8b91a117b42ea86d9bd55))
* added test cases ([124e50b](https://github.com/TriPSs/nestjs-query/commit/124e50b8a361ecc0809a75b10f1ee4ca325041e8))
* custom decorators for filter ([5d803bd](https://github.com/TriPSs/nestjs-query/commit/5d803bd0ae590c6b649238bca98c85dd55728cba))



# [4.1.0](https://github.com/TriPSs/nestjs-query/compare/v4.0.0...v4.1.0) (2023-09-22)


### Bug Fixes

* added support for typegoose ([9494d97](https://github.com/TriPSs/nestjs-query/commit/9494d975683a8a6dcbe210033e465afb3d67061c))
* sub objects in mongoose are resolved ([27db7ee](https://github.com/TriPSs/nestjs-query/commit/27db7eea1d43cca9f8ac1968971454631c658e8b))
* test snapshots ([6a620ec](https://github.com/TriPSs/nestjs-query/commit/6a620ec30d7f336b4b8e55bc253b6a63c63ad05f))


### Features

* added test cases ([ccd897c](https://github.com/TriPSs/nestjs-query/commit/ccd897c48f9ecb5edb4c0c91084d71bc0bca1ddf))



# [4.0.0](https://github.com/TriPSs/nestjs-query/compare/v3.0.2...v4.0.0) (2023-08-02)


### Bug Fixes

* **query-graphql:** Fixed `GraphQLResultInfo` always returning info without paging ([89de5c7](https://github.com/TriPSs/nestjs-query/commit/89de5c700bf57ba271d592503b39482ee2b45027))
* **query-graphql:** Fixed `queryMany` not using `withDeleted` option ([27fe0f8](https://github.com/TriPSs/nestjs-query/commit/27fe0f8e566cda5b6d16e878882591d830989a79))
* **query-graphql:** Fixed `withDeleted` not being passed to count of the service ([25180b3](https://github.com/TriPSs/nestjs-query/commit/25180b32c47344e7b7ad19f80b68f7bce1b5dca8))


### Code Refactoring

* Drop support for older versions of `class-transformer` ([e282592](https://github.com/TriPSs/nestjs-query/commit/e282592807feb30ef44e045ac88f2a4e5c6b2fbb))


### Features

* **query-graphql:** Look ahead `totalCount` ([e4713a9](https://github.com/TriPSs/nestjs-query/commit/e4713a99d943cef4e69d89b31e002d6bad7910b8)), closes [#137](https://github.com/TriPSs/nestjs-query/issues/137)
* **query-graphql:** Look ahead `totalCount` ([#151](https://github.com/TriPSs/nestjs-query/issues/151)) ([03d648f](https://github.com/TriPSs/nestjs-query/commit/03d648f2227d59acea61874cb3c10dcc73ce519c)), closes [#137](https://github.com/TriPSs/nestjs-query/issues/137)


### Reverts

* **query-graphql:** Revert look ahead of `totalCount` as this was already done ([5c7e0c6](https://github.com/TriPSs/nestjs-query/commit/5c7e0c6dd63b0cafb7b5c9598ed24b5588944623))


### BREAKING CHANGES

* Versions of `class-transformer` older than 0.5 are no longer supported



## [3.0.2](https://github.com/TriPSs/nestjs-query/compare/v3.0.1...v3.0.2) (2023-07-20)



## [3.0.1](https://github.com/TriPSs/nestjs-query/compare/v3.0.0...v3.0.1) (2023-07-20)



# [3.0.0](https://github.com/TriPSs/nestjs-query/compare/v3.0.0-alpha.2...v3.0.0) (2023-06-23)


### Features

* Updated to `nestjs@10` ([489d32b](https://github.com/TriPSs/nestjs-query/commit/489d32b60ce352ba204cd3036e44a51f86d10e53))


### BREAKING CHANGES

* Dropped support for `nestjs@8`



# [3.0.0-alpha.2](https://github.com/TriPSs/nestjs-query/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2023-06-01)


### Bug Fixes

* `ILIKE` is no valid MySQL syntax ([8f86c1b](https://github.com/TriPSs/nestjs-query/commit/8f86c1bf3f832c3918055e1c59fd04e4baeea9bc))
* alias generation ([c2a44a3](https://github.com/TriPSs/nestjs-query/commit/c2a44a31b4dc30542fe393ace44f2c369c0b68e1))
* failing build ([fcc1ce0](https://github.com/TriPSs/nestjs-query/commit/fcc1ce0e88aaf7a166a27c6e1c91543058cbb74b))
* fallback DataLoaderOptions ([0ff87bb](https://github.com/TriPSs/nestjs-query/commit/0ff87bbcbe2f989cbd9fdd4368327add54a8e260))
* increment depth ([bfc9d49](https://github.com/TriPSs/nestjs-query/commit/bfc9d49dd88e0bf785fffaa7aca788440b581bd6))
* lint ([6341b4e](https://github.com/TriPSs/nestjs-query/commit/6341b4eff4fc04dc0d94e13e9be07bd12c19444e))
* make `dataLoaderOptionsToken` a const ([d6cb3ab](https://github.com/TriPSs/nestjs-query/commit/d6cb3abd43d327b02020d705c7a061fbcc3fefb6))
* name clashing and filter depth overriding ([827fe91](https://github.com/TriPSs/nestjs-query/commit/827fe915a7c31b625e0cec9a4cc6f2180aabd734))
* omit filterDepth from relation-decorators ([2444712](https://github.com/TriPSs/nestjs-query/commit/244471256f995c7a77c90e3b5fdddad9fc7c527b))
* only query for distinct entries ([654075e](https://github.com/TriPSs/nestjs-query/commit/654075efd5a18f6ac81f4a17cedd4059207b311f))
* **query-typeorm:** name collision on deeply nested filters ([327300e](https://github.com/TriPSs/nestjs-query/commit/327300e0a796ce9e52b9b6c50a0ecca1ca61ec19))
* revert ([3f5d8bf](https://github.com/TriPSs/nestjs-query/commit/3f5d8bfd186cc926402129c8b08b0a013df561c1))


### Features

* add configurable dataloader ([84d17d9](https://github.com/TriPSs/nestjs-query/commit/84d17d98e1dbb4b6e25775a668ef2df1ba3d2f64))
* **query-graphql:** Added support for `complexity` to queries and mutations ([c2699ab](https://github.com/TriPSs/nestjs-query/commit/c2699ab356f75e8ed39a9ffe940846141640f497))



# [3.0.0-alpha.1](https://github.com/TriPSs/nestjs-query/compare/v3.0.0-alpha.0...v3.0.0-alpha.1) (2023-04-21)



# [3.0.0-alpha.0](https://github.com/TriPSs/nestjs-query/compare/v2.4.0...v3.0.0-alpha.0) (2023-04-21)


### Bug Fixes

* **graphql:** fix lint issues ([03548b3](https://github.com/TriPSs/nestjs-query/commit/03548b3cd060aac568406f84bd9939123005ebdd))


### Features

* Added multi hooks support ([1d15f2d](https://github.com/TriPSs/nestjs-query/commit/1d15f2d15751ffa85496aaafb6027bf14eff323f))
* **query-graphql:** Implemented new `update` and `remove` for relations ([6241d48](https://github.com/TriPSs/nestjs-query/commit/6241d489d614521a0fd512dbe6344412465c34d5))


### BREAKING CHANGES

* **query-graphql:** `disableUpdate` and `disableRemove` are removed and default disabled.



# [2.4.0](https://github.com/TriPSs/nestjs-query/compare/v2.3.1...v2.4.0) (2023-04-13)


### Features

* **query-graphql:** Added further control of update/remove relations ([f86afb6](https://github.com/TriPSs/nestjs-query/commit/f86afb674170b6cea5f4ad19e566125b51e2ff74))



## [2.3.1](https://github.com/TriPSs/nestjs-query/compare/v2.3.0...v2.3.1) (2023-04-05)


### Bug Fixes

* **query-mongoose:** correct docker-compose file and e2e tests ([c661884](https://github.com/TriPSs/nestjs-query/commit/c6618848eec760c2b74a0a1b3283d0148b89a8cc))
* **query-typegoose:** add new enhanced type   ([ddb3ebc](https://github.com/TriPSs/nestjs-query/commit/ddb3ebc62167f4b18a34f7fb3e406d7850209bfe))
* **query-typegoose:** correct linting errors ([933cd5e](https://github.com/TriPSs/nestjs-query/commit/933cd5edb1f068adbf088fc76e2f60de2c51ba9e))
* **query-typegoose:** update peer dependencies ([9da118a](https://github.com/TriPSs/nestjs-query/commit/9da118aa1b5524adf90239d04669b023b5afddc7))



# [2.3.0](https://github.com/TriPSs/nestjs-query/compare/v2.2.0...v2.3.0) (2023-03-23)


### Bug Fixes

* Fixed looked ahead relations going through the assembler ([738e865](https://github.com/TriPSs/nestjs-query/commit/738e865ce4098249f2cb90cf2837bac67b1c6d86))


### Features

* Added `enableLookAhead` option to relations ([9efdc6f](https://github.com/TriPSs/nestjs-query/commit/9efdc6f3992a74fd50e4c05ea944eae6f389e5c5))


### Performance Improvements

* **query-typeorm:** Don't use skip/take when filtering for one to one and many to one relations ([cdd06b6](https://github.com/TriPSs/nestjs-query/commit/cdd06b6a9ae59b9e1de14e91facb166567e8562a))


### Reverts

* Revert "test: Re-enable the disabled tests that where stil ok for Mongoose" ([84670b2](https://github.com/TriPSs/nestjs-query/commit/84670b2fee2d21e671bbf2a9b7cf87b30499d064))



# [2.2.0](https://github.com/TriPSs/nestjs-query/compare/v2.1.1...v2.2.0) (2023-03-01)


### Bug Fixes

* failing proxy- and assembler-query-service tests ([84e4944](https://github.com/TriPSs/nestjs-query/commit/84e49447e758f931d40e818c1420efdca8085275))
* missing expect(200) ([34b14b0](https://github.com/TriPSs/nestjs-query/commit/34b14b072f0fd321da5b6c6c9e17a6ccf12ed44e))
* relation-query.builder.ts only withDeleted on root level ([dcdba48](https://github.com/TriPSs/nestjs-query/commit/dcdba483dbb36e92d95af176668bb70328146b62))


### Features

* withDelete for other typeorm-query-service operations ([965c35f](https://github.com/TriPSs/nestjs-query/commit/965c35f727a1de933f1e3d02c46bfbceea856852))



## [2.1.1](https://github.com/TriPSs/nestjs-query/compare/v2.1.0...v2.1.1) (2023-02-12)


### Bug Fixes

* **query-graphql:** Make the `imports` of `NestjsQueryGraphQLModule` optional ([4ef6574](https://github.com/TriPSs/nestjs-query/commit/4ef65743b221f4f9de7d603656b59db7ece07326))
* **query-typeorm:** Fix RelationQueryBuilder not properly naming aliases via DriverUtils.buildAlias ([c47f93e](https://github.com/TriPSs/nestjs-query/commit/c47f93e29b06071fb3842f4ab89375e1f531bfc0))



# [2.1.0](https://github.com/TriPSs/nestjs-query/compare/v2.0.1...v2.1.0) (2023-02-02)


### Bug Fixes

* **query-graphql:** Moved `dateloader` from `peerDependencies` to `dependencies` ([b4b2ea9](https://github.com/TriPSs/nestjs-query/commit/b4b2ea942c292b735f06f9849d85da5a628d67e0))
* **query-typeorm:** Escape the aggregated group by and sort by ([787889e](https://github.com/TriPSs/nestjs-query/commit/787889e5324a093ce9f12ca7b4a22dc638be6c02))


### Features

* Added `by` option to aggregated date fields so group by `DAY`, `MONTH` or `YEAR` (TypeORM) ([0993b93](https://github.com/TriPSs/nestjs-query/commit/0993b93bff0bdc5dee0c3394b4a6e3e60ae532b5))
* Added support for aggregated group by week ([70764a7](https://github.com/TriPSs/nestjs-query/commit/70764a72c2761067ccde728e787b129093aa3848))
* **query-graphql:** Added support to define different aggregate dto ([1569a58](https://github.com/TriPSs/nestjs-query/commit/1569a58e0c46bb9a905e3213a2ebbf653cf09160))
* **query-graphql:** Added support to name the aggregate endpoints ([da70f3b](https://github.com/TriPSs/nestjs-query/commit/da70f3b435631e354c89a884ce435a9a8703b975))



## [2.0.1](https://github.com/TriPSs/nestjs-query/compare/v2.0.0...v2.0.1) (2023-01-27)


### Bug Fixes

* **query-graphql:** Moved `dateloader` from `peerDependencies` to `dependencies` ([1f465c3](https://github.com/TriPSs/nestjs-query/commit/1f465c397fb0a73b8a2db2c9a51993bae35239e2))



# [2.0.0](https://github.com/TriPSs/nestjs-query/compare/v1.1.7...v2.0.0) (2023-01-25)


* refactor!: Make create DTO field types non nullable all the time ([71799ef](https://github.com/TriPSs/nestjs-query/commit/71799efa6fbc1638ca36407a7c8c64227708f23f))


### BREAKING CHANGES

* The autogenerated Create graphql type now will have non nullable fields for non nullable fields of the DTO



## [1.1.7](https://github.com/TriPSs/nestjs-query/compare/v1.1.6...v1.1.7) (2023-01-24)



## [1.1.6](https://github.com/TriPSs/nestjs-query/compare/v1.1.5...v1.1.6) (2023-01-16)



## [1.1.5](https://github.com/TriPSs/nestjs-query/compare/v1.1.4...v1.1.5) (2023-01-13)



## [1.1.4](https://github.com/TriPSs/nestjs-query/compare/v1.1.3...v1.1.4) (2022-12-04)


### Performance Improvements

* **query-typeorm:** Use `= TRUE` instead of `IS TRUE` so indexes on boolean fields can be used ([a4522ab](https://github.com/TriPSs/nestjs-query/commit/a4522abdfff7810168be10ed6bb5f532c110d791))



## [1.1.3](https://github.com/TriPSs/nestjs-query/compare/v1.1.2...v1.1.3) (2022-11-25)


### Bug Fixes

* **graphql,tripss#64:** fix of delete subscriptions ([8b56d21](https://github.com/TriPSs/nestjs-query/commit/8b56d21042a569535d55d236c16793cb08109127))



## [1.1.2](https://github.com/TriPSs/nestjs-query/compare/v1.1.1...v1.1.2) (2022-10-24)


### Bug Fixes

* **docs/lint:** update for new @ObjectId decorator - fix linting error ([63f8b94](https://github.com/TriPSs/nestjs-query/commit/63f8b94fde3267a55512f2182fda2adde00084e9))
* **docs:** update DTO docs too ([bd4a282](https://github.com/TriPSs/nestjs-query/commit/bd4a2825f40dfebcd40cb479586a4b2e9c2f6ee8))
* **query-typegoose:** update to new nestjs-typegoose package from m8a ([85a4748](https://github.com/TriPSs/nestjs-query/commit/85a4748e4cb12078cbd75e7783c63ca69d8496e5))



## [1.1.1](https://github.com/TriPSs/nestjs-query/compare/v1.1.0...v1.1.1) (2022-10-05)


### Bug Fixes

* **query-typegoose:** Fixed package.json ([b947f06](https://github.com/TriPSs/nestjs-query/commit/b947f06d920feb356815cc35be51520b38aefced))
* **query-typeorm:** Fixed some typings ([49709ce](https://github.com/TriPSs/nestjs-query/commit/49709cea9aa7bec3e855121404d4e9ca9bb4431b))



## [1.0.1](https://github.com/TriPSs/nestjs-query/compare/v2.0.0-alpha.1...v1.0.1) (2022-09-10)


### Bug Fixes

* align @apollo/gateway peer dependencies between @nestjs/graphql & @ptc-org/nestjs-query-graphql ([eb3f9a9](https://github.com/TriPSs/nestjs-query/commit/eb3f9a9157fe06f352eab9988cc535927ed55a58))
* **query-typeorm:** Align fetching of entity metadata with `@nestjs/typeorm` ([545074f](https://github.com/TriPSs/nestjs-query/commit/545074fa6511dea47d64ecbea84bf586a1c9ca0f))
* Remove incompatible class-transformer version from peer ([00f193d](https://github.com/TriPSs/nestjs-query/commit/00f193d0000c13e46b9a5868a7b213162f025ac3))



# [2.0.0-alpha.1](https://github.com/TriPSs/nestjs-query/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (2022-08-28)


### Features

* **query-typeorm:** Updated Typeorm to `0.3.8` ([de00f77](https://github.com/TriPSs/nestjs-query/commit/de00f77965d605ce34e96378a89794347677656c))



# [2.0.0-alpha.0](https://github.com/TriPSs/nestjs-query/compare/v1.0.0...v2.0.0-alpha.0) (2022-08-26)



# [1.0.0](https://github.com/TriPSs/nestjs-query/compare/v1.0.0-alpha.0...v1.0.0) (2022-08-26)


### Features

* Bump all packages ([1d36ee0](https://github.com/TriPSs/nestjs-query/commit/1d36ee0401c7f2a82f2ea06092139526ea879f7c))
* Updated some deps + cleanup incorrect changelogs ([f877a9c](https://github.com/TriPSs/nestjs-query/commit/f877a9c7e1c4f172ed9b94b33398da596e6222f7))


### BREAKING CHANGES

* We want the next major release
* Nothing really but we want to be version 2



# [1.0.0-alpha.0](https://github.com/TriPSs/nestjs-query/compare/v0.30.0...v1.0.0-alpha.0) (2022-08-26)


### Bug Fixes

* **core:** fixed filters merged incorrectly causing unexpected behavior ([588dbe5](https://github.com/TriPSs/nestjs-query/commit/588dbe5ebb166db4c5a35fa8d36a3a0ceb3a0836))
* **core:** Improved workings of `getFilterOmitting` ([28d7e6b](https://github.com/TriPSs/nestjs-query/commit/28d7e6b81f2a63a42331d0d4c5b8fb6ccd3a3d3c))
* **core:** Improved workings of `getFilterOmitting` ([cb06762](https://github.com/TriPSs/nestjs-query/commit/cb067622ae7d754706f50df8c59ac2d711688e40))
* **core:** Use correct return types for decorators ([d328d2b](https://github.com/TriPSs/nestjs-query/commit/d328d2beb8c0ebc3048631a97e5b2023b1891b25))
* **deps:** update dependency apollo-server-plugin-base to v3.3.0 ([26cff92](https://github.com/TriPSs/nestjs-query/commit/26cff9256b85e8a83469744e1852dd9d5092aa23))
* **deps:** update dependency apollo-server-plugin-base to v3.4.0 ([e3c95f2](https://github.com/TriPSs/nestjs-query/commit/e3c95f2e70382c863a6bdf7ab24a2cb1ab7266e5))
* **deps:** update dependency apollo-server-types to v3.3.0 ([794c7d0](https://github.com/TriPSs/nestjs-query/commit/794c7d005bc4d696e34f538d202c497b3d1018ac))
* **deps:** update dependency apollo-server-types to v3.4.0 ([a587a52](https://github.com/TriPSs/nestjs-query/commit/a587a52ff25412d1bae77dbc9a9b0ceca31070a9))
* **deps:** update dependency graphql-query-complexity to v0.10.0 ([d88ce81](https://github.com/TriPSs/nestjs-query/commit/d88ce81bad0552f1b099c2c86ee9d080d3f1e270))
* **deps:** update dependency graphql-query-complexity to v0.11.0 ([6ab330b](https://github.com/TriPSs/nestjs-query/commit/6ab330b69de031d8df472888f36754bd8db8b1e0))
* **deps:** update dependency mysql2 to v2.3.1 ([b41d55e](https://github.com/TriPSs/nestjs-query/commit/b41d55efdba7dd902158846cce52a00c33450e13))
* **deps:** update dependency mysql2 to v2.3.2 ([c67a172](https://github.com/TriPSs/nestjs-query/commit/c67a1728e2bd76b5e38bd5153735eab95525f543))
* **deps:** update dependency mysql2 to v2.3.3 ([098f83a](https://github.com/TriPSs/nestjs-query/commit/098f83a1a8ac2d069039468e774242e3f25db7be))
* **deps:** update dependency rxjs to v7.3.1 ([46e79d4](https://github.com/TriPSs/nestjs-query/commit/46e79d426bcfa85d6ba38080bc62944d7024937a))
* **deps:** update dependency rxjs to v7.4.0 ([5ffd717](https://github.com/TriPSs/nestjs-query/commit/5ffd717698d2e74a1d2e8efe83610c6e4ea4ffef))
* Fixed almost all tests ([f614f04](https://github.com/TriPSs/nestjs-query/commit/f614f04e4e75c87c3e72b1c30eb7899d3770a7c1))
* Fixed package.json files ([97cbfd2](https://github.com/TriPSs/nestjs-query/commit/97cbfd26ba05afae345e4e21442744a872899b0b))
* **mongoose,typegoose:** fix type errors from bad renovate bot merge ([46d9a6f](https://github.com/TriPSs/nestjs-query/commit/46d9a6f49c011c5bc40d00b92d2fa17059f2702c))
* **query-graphql:** Do not generate aggregate types if disabled ([abd62a5](https://github.com/TriPSs/nestjs-query/commit/abd62a52a8c1f32814d4477a97c269eb1c078771))
* **query-graphql:** Fixed `between` and `notBetween` types not generated ([be4bed6](https://github.com/TriPSs/nestjs-query/commit/be4bed6b60d9ac8fd2432b7f5e04ac1a2a596e29))
* **query-graphql:** Fixed `ResolveOneRelation` interface ([e768900](https://github.com/TriPSs/nestjs-query/commit/e768900ae33949cb89c7ab4039b7cb008617a0e9))
* **query-graphql:** Fixed default sorting/filtering for relations ([0877c23](https://github.com/TriPSs/nestjs-query/commit/0877c2374fe37725033ec14a7dc7b0a7d3f2e026))
* **query-graphql:** Fixed empty object accepted by required filters ([f162cf3](https://github.com/TriPSs/nestjs-query/commit/f162cf3f6dde3dd6b6cb7846251a010c9c9cd9f7)), closes [doug-martin/nestjs-query#1504](https://github.com/doug-martin/nestjs-query/issues/1504)
* **query-graphql:** Use `getById` instead of `findById` to correctly throw not found errors ([2b98581](https://github.com/TriPSs/nestjs-query/commit/2b9858164653dba552999ac1933ac256db09e4c8))
* **query-typeorm:** Fixed `deleteMany` throwing error when called with filter that contained relations ([53c6c6b](https://github.com/TriPSs/nestjs-query/commit/53c6c6b9f0533f311d0de56d78a1a95a61713438))
* **query-typeorm:** Fixed `deleteMany` throwing error when called with filter that contained relations ([6f8ac0b](https://github.com/TriPSs/nestjs-query/commit/6f8ac0b7960447e903c40635990addb66b46348c))
* **query-typeorm:** Fixed `getManyToManyOwnerMeta` ([887df20](https://github.com/TriPSs/nestjs-query/commit/887df206eca99a80e5f8b37b5f00711d1ee3ecec))
* **query-typeorm:** Fixed `updateMany` not supporting relations ([93ef5a9](https://github.com/TriPSs/nestjs-query/commit/93ef5a9002b1c2206a39770d6f8f59c5bfe26ecc))
* **query-typeorm:** Fixed group by for aggregated date fields ([7ffeaf6](https://github.com/TriPSs/nestjs-query/commit/7ffeaf6b9e400eb027298a3870712eb7124c88bb))
* **query-typeorm:** Use `qb` directly when adding additional fields ([5843ac4](https://github.com/TriPSs/nestjs-query/commit/5843ac4a7f0542efa9d33d1798e7ac3c2eaf16ca))
* **sequelize:** fix bad renovate bot merge revert to sequelize@6.6.2 ([9225c6f](https://github.com/TriPSs/nestjs-query/commit/9225c6fca55d47715dc4debf01a03b884ae16cf0))


### chore

* Update third batch of deps + linting rules ([acaff0f](https://github.com/TriPSs/nestjs-query/commit/acaff0fd56918a26cc108d6d98ef71b275400da4))


### Code Refactoring

* Move project to NX ([c70a022](https://github.com/TriPSs/nestjs-query/commit/c70a022671b84025bb10ba3db0a3e5a11ddcccd7))


### Features

* Added support for `withDeleted` in `Relation` decorator ([923d972](https://github.com/TriPSs/nestjs-query/commit/923d972660d06cc76065d90b4a46f8775669ff0b))
* allow for passing `useSoftDelete` in resolver opts ([4c59cd8](https://github.com/TriPSs/nestjs-query/commit/4c59cd82f87663a40634523101c7f511afe77e63))
* **query-graphql:** Added `disableFilter` and `disableSort` ([80cc8e9](https://github.com/TriPSs/nestjs-query/commit/80cc8e988b73d057812cba901e909e1774eea77c))
* **query-graphql:** allow descriptions to be defined ([568f228](https://github.com/TriPSs/nestjs-query/commit/568f2288efaefcbe0d3360284d626e6030165374))
* **query-graphql:** allow descriptions to be defined in relations ([0fe9580](https://github.com/TriPSs/nestjs-query/commit/0fe9580bae5c292f2760e123e88f569e60253df4))


### Performance Improvements

* **query-typeorm:** Rewrote `batchQueryRelations` to use one query ([c7aa255](https://github.com/TriPSs/nestjs-query/commit/c7aa255e11e86bf13e87e7d3cd26ef34d556bb1a))
* **query-typeorm:** Use existing join alias if there is one ([419d5b4](https://github.com/TriPSs/nestjs-query/commit/419d5b4f23efa111f698620e118b7168a1a594bd))


### Reverts

* Revert "chore(deps): update dependency @nestjs/mongoose to v9.0.1" ([9ea465e](https://github.com/TriPSs/nestjs-query/commit/9ea465e23a387b0b608cf07affe93e41af69e72d))
* Revert "fix(query-typeorm): Fixed `deleteOne` returning entity without its id" ([205fdd0](https://github.com/TriPSs/nestjs-query/commit/205fdd01e0361ff3da2f1d63fb56ed4686a21427))


### BREAKING CHANGES

* Nothing special, just want the major version bump as we updated a lot of deps
* Project is moved to NX, deps may still be incorrect



# [0.30.0](https://github.com/tripss/nestjs-query/compare/v0.29.0...v0.30.0) (2021-09-30)


### Bug Fixes

* **deps:** update apollo graphql packages ([6d40b9d](https://github.com/tripss/nestjs-query/commit/6d40b9d10de522d7950fca8279ee2d763c17e3a5))
* **deps:** update dependency passport to v0.5.0 ([a8a05d1](https://github.com/tripss/nestjs-query/commit/a8a05d1d91c0c50aa0140c8709c9ea75b1aca05f))
* **deps:** update docusaurus monorepo to v2.0.0-beta.6 ([9015c71](https://github.com/tripss/nestjs-query/commit/9015c7162181fcc5362baf9c26efe079d0c22476))
* **query-graphql:** Custom authorizers now behave like auth decorators ([ff92b9a](https://github.com/tripss/nestjs-query/commit/ff92b9ae7a0ae4fb9585bead9b778e26fbd6b95a))
* **query-graphql:** fix eslint errors ([73acbc3](https://github.com/tripss/nestjs-query/commit/73acbc3557d3e8cccbe7cb7e8e01dde9d4218208))
* **query-typeorm:** import jest-extended into typeorm query service ([f539b29](https://github.com/tripss/nestjs-query/commit/f539b29fad60c070e8736f872d547fd498eb3c4f))
* **tests:** fix jest-extended typings and eslint problems ([6af8af1](https://github.com/tripss/nestjs-query/commit/6af8af13a33faaa1585561e7b426b125a6368b6b))
* **typeorm:** revert uneeded change to test entity ([86f7fd9](https://github.com/tripss/nestjs-query/commit/86f7fd9abb101eb40af2cf66009d50cb8c173eea))


### Features

* **query-typeorm:** allow deeply nested filters ([0bd6b76](https://github.com/tripss/nestjs-query/commit/0bd6b76c4dbd876df7f9a991803843405d24fdb9))





# [0.29.0](https://github.com/tripss/nestjs-query/compare/v0.28.1...v0.29.0) (2021-09-09)


### Bug Fixes

* **deps:** update dependency @nestjs/passport to v8.0.1 ([4ce73e8](https://github.com/tripss/nestjs-query/commit/4ce73e857fcc89a8f6b6827057901144ac7f6ad7))
* **deps:** update dependency graphql-query-complexity to v0.9.0 ([e34d870](https://github.com/tripss/nestjs-query/commit/e34d870af3e0c1d0b4ce778db216387fc152ae42))
* **deps:** update dependency graphql-tools to v8 ([5dd27b8](https://github.com/tripss/nestjs-query/commit/5dd27b8f688bf2b67620775075365c12fd7c1d43))
* **deps:** update dependency graphql-tools to v8.1.0 ([52f4595](https://github.com/tripss/nestjs-query/commit/52f45955f0300fd7728e74411eb03bfa00ac3594))
* **deps:** update dependency graphql-tools to v8.2.0 ([a31316b](https://github.com/tripss/nestjs-query/commit/a31316b37b49457e10c4f7e5ebc8648b793fe006))
* **deps:** update dependency mysql2 to v2.3.0 ([0b243bb](https://github.com/tripss/nestjs-query/commit/0b243bb8f59ad45b91bf11d8ea6e41ac010cab0d))
* **deps:** update dependency pg to v8.7.0 ([b6c0d42](https://github.com/tripss/nestjs-query/commit/b6c0d42022e09967f6adfc8055f82c3db744ffc7))
* **deps:** update dependency pg to v8.7.1 ([dee5981](https://github.com/tripss/nestjs-query/commit/dee59812f0865380d285021e2afff7e68e726117))
* **deps:** update dependency rxjs to v7.3.0 ([70d08c9](https://github.com/tripss/nestjs-query/commit/70d08c982765c3594e7c3f1b4dc0488a9ad43722))
* **query-graphql:** adapt createFromPromise typings and add tests for passing additional query params ([d81e531](https://github.com/tripss/nestjs-query/commit/d81e5315cbc6e2d665256fd6dcfa09689cadd2b1))
* **query-graphql:** pass original query in keyset pager strategy ([07f9e7b](https://github.com/tripss/nestjs-query/commit/07f9e7b78cccc788c772776a4ced336eec016164))


### Features

* **graphql:** propagate correct query types throughout paging ([348044f](https://github.com/tripss/nestjs-query/commit/348044f8509d8aef21e4a5f55b93bd28793b0fcc))
* **query-typegoose:** Adds the ability to use discriminators ([#1321](https://github.com/tripss/nestjs-query/issues/1321)) ([2a7da59](https://github.com/tripss/nestjs-query/commit/2a7da59c3c857acedbd786d6df5772645c00f543)), closes [#1320](https://github.com/tripss/nestjs-query/issues/1320)





## [0.28.1](https://github.com/tripss/nestjs-query/compare/v0.28.0...v0.28.1) (2021-07-27)


### Bug Fixes

* **deps:** update docusaurus monorepo to v2.0.0-beta.3 ([65bafa7](https://github.com/tripss/nestjs-query/commit/65bafa7222044d2631d2fd91c2ed8c406e6abafa))
* **query-typegoose:** ignore undefined id field in creation dto ([#1165](https://github.com/tripss/nestjs-query/issues/1165)) ([db5bf44](https://github.com/tripss/nestjs-query/commit/db5bf447bdf0095b01791b694785ecd3fb723c0f))
* **typegoose:** allow undefined id field when updating or creating ([c2031aa](https://github.com/tripss/nestjs-query/commit/c2031aaf8c65fe7f2440f5b434329662c02296e4))


### Features

* **graphql,#958,#1160:** Enable authorizers on subscriptions ([d2f857f](https://github.com/tripss/nestjs-query/commit/d2f857f73540ee400f5dcc79cbb25dfba81c2963)), closes [#958](https://github.com/tripss/nestjs-query/issues/958) [#1160](https://github.com/tripss/nestjs-query/issues/1160)





# [0.28.0](https://github.com/tripss/nestjs-query/compare/v0.27.0...v0.28.0) (2021-07-19)


### Bug Fixes

* fix highlight and duplicate example ([50b09a0](https://github.com/tripss/nestjs-query/commit/50b09a0f749aca596f99874968e95819338e2b1c))
* fix module name ([28800dc](https://github.com/tripss/nestjs-query/commit/28800dc1a6517f44c890d6df3b91e6086dca2b81))
* used the relevant example ([c9e4875](https://github.com/tripss/nestjs-query/commit/c9e48750c94730fab7162e24c6930c1b217a2aab))
* **deps:** update dependency @nestjs/jwt to v8 ([b3eeed3](https://github.com/tripss/nestjs-query/commit/b3eeed30c45d9cfb22d2ebe8c9dfcf94f66a007e))
* **deps:** update dependency @nestjs/passport to v7.1.6 ([5f02632](https://github.com/tripss/nestjs-query/commit/5f02632ff73965063ef6ad29764d586e7bd33a16))
* **deps:** update dependency @nestjs/passport to v8 ([f861bf8](https://github.com/tripss/nestjs-query/commit/f861bf85da858c1f9087c735e01a382d0475ec10))
* **deps:** update dependency apollo-server-express to v2.24.1 ([8f549e5](https://github.com/tripss/nestjs-query/commit/8f549e5fbbf3e1c4fcf8952d4a0bb1cf2e76f93c))
* **deps:** update dependency apollo-server-express to v2.25.0 ([1e14523](https://github.com/tripss/nestjs-query/commit/1e1452385767281275f9f165a583049c9fe521b9))
* **deps:** update dependency apollo-server-express to v2.25.1 ([3ddf4ce](https://github.com/tripss/nestjs-query/commit/3ddf4cee097f2f964b33baa6c7e8af75b591b8ee))
* **deps:** update dependency apollo-server-express to v2.25.2 ([5b4e960](https://github.com/tripss/nestjs-query/commit/5b4e9608707b37747def496dba193840da9d31de))
* **deps:** update dependency apollo-server-plugin-base to v0.13.0 ([aaef654](https://github.com/tripss/nestjs-query/commit/aaef6543a2e833f29ce89e9e078b08de6be1b128))
* **deps:** update dependency rxjs to v7.2.0 ([276df90](https://github.com/tripss/nestjs-query/commit/276df909e516814172c5f4c626c4ad320997f9b5))
* NestjsQueryGraphqlModuleOpts ([984f591](https://github.com/tripss/nestjs-query/commit/984f5917db5971a336054186f8a7fddc522745cc))
* **deps:** update dependency rxjs to v7.1.0 ([99e564d](https://github.com/tripss/nestjs-query/commit/99e564d78204aad43891ebae15b98fc5a9e07587))
* **deps:** update docusaurus monorepo to v2.0.0-beta.0 ([3370384](https://github.com/tripss/nestjs-query/commit/3370384a1b16b623c96c233c261efbeeb71bd063))





# [0.27.0](https://github.com/tripss/nestjs-query/compare/v0.26.0...v0.27.0) (2021-05-12)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.23.0 ([29b4b6c](https://github.com/tripss/nestjs-query/commit/29b4b6cb261a21ff66ba93feaf901c2232255fb9))
* **deps:** update dependency apollo-server-express to v2.24.0 ([174fd38](https://github.com/tripss/nestjs-query/commit/174fd3843cacabf4e460bc9d0f2424095a61b1aa))
* **deps:** update dependency apollo-server-plugin-base to v0.12.0 ([7265251](https://github.com/tripss/nestjs-query/commit/7265251f7fac7c3b69fc9b7adbd5f1f13f621ee1))
* **deps:** update dependency classnames to v2.3.1 ([a94dded](https://github.com/tripss/nestjs-query/commit/a94ddedce5ac0cd0befd0fca9e7023a3c1642a50))
* **deps:** update dependency graphql-query-complexity to v0.8.1 ([a8b4764](https://github.com/tripss/nestjs-query/commit/a8b4764190e5df7c15704fe8319c7ccc691a42bf))
* **deps:** update dependency graphql-tools to v7.0.5 ([1afde63](https://github.com/tripss/nestjs-query/commit/1afde6338f8db83f568856a79015fb04fdc19fc4))
* **deps:** update dependency pg to v8.6.0 ([1b51a6b](https://github.com/tripss/nestjs-query/commit/1b51a6bbd7bbbf289ab5d779048c7994fb41a60b))
* **deps:** update dependency rxjs to v7 ([5c54794](https://github.com/tripss/nestjs-query/commit/5c5479433838de97bfdb519c111b56531a8b91aa))
* **deps:** update dependency rxjs to v7.0.1 ([c9ce5a6](https://github.com/tripss/nestjs-query/commit/c9ce5a64a04c95eb0d18edbdac5acbc213999aec))
* Update examples to use new generated input type names ([f987dcd](https://github.com/tripss/nestjs-query/commit/f987dcd1192d71df038cdf1d7259ea2f0861f428))


### Features

* **graphql,#1058:** Allow declaration of custom ID scalar type ([fb2ed7a](https://github.com/tripss/nestjs-query/commit/fb2ed7aca59d66fa8827522cf81b6e31e77161d3)), closes [#1058](https://github.com/tripss/nestjs-query/issues/1058)





# [0.26.0](https://github.com/tripss/nestjs-query/compare/v0.25.1...v0.26.0) (2021-04-13)


### Bug Fixes

* **graphql,auth,#1026:** Fixed auth context on deleteMany ([3d4efd4](https://github.com/tripss/nestjs-query/commit/3d4efd44fae7e2ee119e53884519e5b2700e9e72))
* **graphql,auth,#1026:** Fixed renamed export ([24b1193](https://github.com/tripss/nestjs-query/commit/24b11936014312d435b0d7f17c4237fd48c5dc52))
* **graphql,federation,#1051:** check for undefined as well ([298150a](https://github.com/tripss/nestjs-query/commit/298150a73571e08b9d4c3d24278a24b8aec8e62b)), closes [#1051](https://github.com/tripss/nestjs-query/issues/1051)
* **graphql,federation,#1051:** return null for references ([6cb832e](https://github.com/tripss/nestjs-query/commit/6cb832ebe03c4b4cc1ec133e93a39c4637c87685)), closes [#1051](https://github.com/tripss/nestjs-query/issues/1051)


### Features

* **core:** Add new `setRelations` to set oneToMany/manyToMany relations ([4c73591](https://github.com/tripss/nestjs-query/commit/4c7359168c0713723d18ae2dc302366fd820dc7b))
* **graphql:** Expose setRelations mutation ([676a4d5](https://github.com/tripss/nestjs-query/commit/676a4d5fc16717ae10c8f9f8e71550f1a42d6b2e))
* **graphql,#1048:** added filter-only option to filterable fields ([55cb010](https://github.com/tripss/nestjs-query/commit/55cb0105a11224db1e61023762f030d5c2dae6bc)), closes [#1048](https://github.com/tripss/nestjs-query/issues/1048)
* **graphql,auth:** Pass operation name to authorizer [#1026](https://github.com/tripss/nestjs-query/issues/1026) ([4343821](https://github.com/tripss/nestjs-query/commit/43438218d286791059a7a5f8eb40110320bdcfca))
* **graphql,auth,#1026:** Added convenience fields to auth context ([32df50e](https://github.com/tripss/nestjs-query/commit/32df50e502483bd3492a2d3481786d8931556438)), closes [#1026](https://github.com/tripss/nestjs-query/issues/1026)
* **graphql,auth,#1026:** Enable authorization on create methods as well ([4c7905e](https://github.com/tripss/nestjs-query/commit/4c7905e2c96bf3aab1841091d44599b917ecdd56)), closes [#1026](https://github.com/tripss/nestjs-query/issues/1026)
* **mongoose:** Implement `setRelations` to set many references ([3dc8a84](https://github.com/tripss/nestjs-query/commit/3dc8a84ffdaf0e092871c280ac5264c4ab38104a))
* **sequelize:** Implement `setRelations` to set many relations ([b0c2d2f](https://github.com/tripss/nestjs-query/commit/b0c2d2f419ba2782f6b6e1290548cc8bf2afc699))
* **typegoose:** Implement `setRelations` to set many references ([4ec5fe0](https://github.com/tripss/nestjs-query/commit/4ec5fe07689eacb0456f531d69368b0451ce69a1))
* **typeorm:** Implement `setRelations` to set many relations ([d1109b7](https://github.com/tripss/nestjs-query/commit/d1109b70f961cf59d7cbc8b8a85c401980a2b6c4))





## [0.25.1](https://github.com/tripss/nestjs-query/compare/v0.25.0...v0.25.1) (2021-04-07)


### Bug Fixes

* **mongoose,typegoose,#881:** Allow string objectId filters ([11098c4](https://github.com/tripss/nestjs-query/commit/11098c441de41462fe6c45742bc317f52ea09711)), closes [#881](https://github.com/tripss/nestjs-query/issues/881)





# [0.25.0](https://github.com/tripss/nestjs-query/compare/v0.24.5...v0.25.0) (2021-03-31)


### Bug Fixes

* Add consistent sorting for aggregate queries ([4ac7a14](https://github.com/tripss/nestjs-query/commit/4ac7a1485c7dcd83569951298606f487608806b1))
* **deps:** update dependency apollo-server-express to v2.22.1 ([0a342bd](https://github.com/tripss/nestjs-query/commit/0a342bd3a57acdf919f5a8fb8bbd09db52cdf04c))
* **deps:** update dependency apollo-server-express to v2.22.2 ([48bafef](https://github.com/tripss/nestjs-query/commit/48bafef9e1b3254f642c2d2cc93b33938bf17216))
* **deps:** update dependency apollo-server-plugin-base to v0.11.0 ([a6387ce](https://github.com/tripss/nestjs-query/commit/a6387ce3880adc5dbea645ff6536c8cb6db33120))
* **deps:** update dependency rxjs to v6.6.7 ([4708635](https://github.com/tripss/nestjs-query/commit/4708635ab00136ca82ab9fb1373ca435172ea897))
* **deps:** update react monorepo to v17.0.2 ([11819da](https://github.com/tripss/nestjs-query/commit/11819da926f4753743cbb0322a63b5ad00f8a897))


### Features

* **core:** Add aggregate group by ([d5eb73b](https://github.com/tripss/nestjs-query/commit/d5eb73b9e7a193f664f46486435b7d8d76087b55))
* **graphql:** Add new aggregate groupBy ([922e696](https://github.com/tripss/nestjs-query/commit/922e696df1c56d5d0181cbb769ffbfba943157dd))
* **mongoose:** Update to support new aggregate with groupBy ([ccd0438](https://github.com/tripss/nestjs-query/commit/ccd04382de6ece10dd03db76052741ea1d7083a4))
* **sequelize:** Update to support new aggregate with groupBy ([81fdef1](https://github.com/tripss/nestjs-query/commit/81fdef17304ad28a043f6a8e9a9496158e61022e))
* **typegoose:** Update to support new aggregate with groupBy ([90992e1](https://github.com/tripss/nestjs-query/commit/90992e1a1dcc4e4e888e5946ab639535932f8f52))
* **typeorm:** Update to support new aggregate with groupBy ([e2a4f30](https://github.com/tripss/nestjs-query/commit/e2a4f3066834ae7fddf0239ab647a0a9de667149))





## [0.24.5](https://github.com/tripss/nestjs-query/compare/v0.24.4...v0.24.5) (2021-03-19)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.21.2 ([8b3b3ec](https://github.com/tripss/nestjs-query/commit/8b3b3ecc90877a615d9ab65b90daec0622eb19c8))
* **deps:** update dependency graphql-query-complexity to v0.8.0 ([99c93e6](https://github.com/tripss/nestjs-query/commit/99c93e64776f8308e04510e67c4b50d7696031d7))
* **deps:** update docusaurus monorepo to v2.0.0-alpha.ffe8b6106 ([6672092](https://github.com/tripss/nestjs-query/commit/66720929848fc48be873b141fa4ea406b5faaf9f))





## [0.24.4](https://github.com/tripss/nestjs-query/compare/v0.24.3...v0.24.4) (2021-03-18)

**Note:** Version bump only for package nestjs-query





## [0.24.3](https://github.com/tripss/nestjs-query/compare/v0.24.2...v0.24.3) (2021-03-17)


### Features

* **graphql,#609:** Allow disabling maxResultSize ([a3cd664](https://github.com/tripss/nestjs-query/commit/a3cd664eb3cd2ebf81a110b7218fb69d4b4a3955)), closes [#609](https://github.com/tripss/nestjs-query/issues/609)





## [0.24.2](https://github.com/tripss/nestjs-query/compare/v0.24.1...v0.24.2) (2021-03-17)


### Bug Fixes

* **graphql,hooks,#957:** Fix HookInterceptor not working with custom resolvers ([c947b3a](https://github.com/tripss/nestjs-query/commit/c947b3a509d9ba12310680baf8382d8ec7116fd7))





## [0.24.1](https://github.com/tripss/nestjs-query/compare/v0.24.0...v0.24.1) (2021-03-16)


### Bug Fixes

* **typeorm, #954:** Filtering on relations with pagination  ([#977](https://github.com/tripss/nestjs-query/issues/977)) ([f5a6374](https://github.com/tripss/nestjs-query/commit/f5a6374f6e22470f63ef6257f7271c818ed09321)), closes [#954](https://github.com/doug-martin/nestjs-query/issues/954) [#954](https://github.com/doug-martin/nestjs-query/issues/954) [#954](https://github.com/doug-martin/nestjs-query/issues/954) [#954](https://github.com/doug-martin/nestjs-query/issues/954)





# [0.24.0](https://github.com/tripss/nestjs-query/compare/v0.23.1...v0.24.0) (2021-03-15)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.21.1 ([cb43994](https://github.com/tripss/nestjs-query/commit/cb43994ed6f0bf998c0365cc5193bf80b8162d3f))


### Features

* **graphql:** Allow disabling `and`/`or` filters ([c20fdbd](https://github.com/tripss/nestjs-query/commit/c20fdbd9774a541cf4ada8df1c5981e12ede7e8d))
* **typegoose:** Add typegoose package ([#846](https://github.com/tripss/nestjs-query/issues/846)) ([73cf5cd](https://github.com/tripss/nestjs-query/commit/73cf5cdbf11496ad3a3ce3f6bb69975510de26e2))





## [0.23.1](https://github.com/tripss/nestjs-query/compare/v0.23.0...v0.23.1) (2021-02-26)


### Bug Fixes

* **typeorm,#895:** Wrap all OR and AND expressions in brackets ([838ab16](https://github.com/tripss/nestjs-query/commit/838ab16befe7a53f5fb11e84624c3b30811f61c6)), closes [#895](https://github.com/tripss/nestjs-query/issues/895)





# [0.23.0](https://github.com/tripss/nestjs-query/compare/v0.22.0...v0.23.0) (2021-02-26)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.20.0 ([ac3fb92](https://github.com/tripss/nestjs-query/commit/ac3fb923be63e2bf1185eb8bfb14fee73d7b8658))
* **deps:** update dependency apollo-server-express to v2.21.0 ([e3039c3](https://github.com/tripss/nestjs-query/commit/e3039c379ad5be513c5b1e10c49e9becac05b270))
* **deps:** update dependency graphql-tools to v7.0.3 ([8e2ef1c](https://github.com/tripss/nestjs-query/commit/8e2ef1c48be0d7f4e91a84861c638b4bda64e337))
* **deps:** update dependency graphql-tools to v7.0.4 ([cba3d4d](https://github.com/tripss/nestjs-query/commit/cba3d4da5f2ed18e03cb6c8188597c78d2ec28d6))
* **deps:** update dependency rxjs to v6.6.6 ([13e251b](https://github.com/tripss/nestjs-query/commit/13e251b0f5bbdb77a0e1bcfaf35a3585234dbf49))


### Features

* **graphql:** Added new offset connection with totalCount ([2780e7e](https://github.com/tripss/nestjs-query/commit/2780e7ebfefbcee010797b244fcb46a182a4102e))
* **graphql:** Enabling registering DTOs without auto-generating a resolver ([2f18142](https://github.com/tripss/nestjs-query/commit/2f18142edf5a0dc0563099b532d54f4a44ac7e56))
* **graphql,hooks:** Provide support for injectable hooks ([d100de8](https://github.com/tripss/nestjs-query/commit/d100de8306113c044bcbbdc0ceb373c977354255))
* **graphql,relations:** Revert back to unPagedRelation ([cb3dc62](https://github.com/tripss/nestjs-query/commit/cb3dc624328077267eded288f7cfbd5a6e9b7806))





# [0.22.0](https://github.com/tripss/nestjs-query/compare/v0.21.2...v0.22.0) (2021-02-08)


### Bug Fixes

* **deps:** update dependency @nestjs/jwt to v7.2.0 ([a8845c2](https://github.com/tripss/nestjs-query/commit/a8845c2f1473792f11828d99c7c6b0dd697189b6))
* **deps:** update dependency @nestjs/passport to v7.1.1 ([2be7848](https://github.com/tripss/nestjs-query/commit/2be78489b6c73652de998f2c5364b63a6a937f2f))
* **deps:** update dependency @nestjs/passport to v7.1.2 ([4a38d0c](https://github.com/tripss/nestjs-query/commit/4a38d0c25032bd24131378e861e205fdc50c8615))
* **deps:** update dependency @nestjs/passport to v7.1.3 ([a74b544](https://github.com/tripss/nestjs-query/commit/a74b544a067c5a678479f8b9aaa091fb6c6a3aeb))
* **deps:** update dependency @nestjs/passport to v7.1.4 ([84471a4](https://github.com/tripss/nestjs-query/commit/84471a4210a104d6b344f26d3bd87b83405a1b44))
* **deps:** update dependency @nestjs/passport to v7.1.5 ([2bc9164](https://github.com/tripss/nestjs-query/commit/2bc91644004df4cda83c968f95e9ff45d8de328c))
* **deps:** update dependency apollo-server-express to v2.19.0 ([1624f4e](https://github.com/tripss/nestjs-query/commit/1624f4e99a64258ff381972e5ad5cce1aec146a5))
* **deps:** update dependency apollo-server-express to v2.19.1 ([63cc89f](https://github.com/tripss/nestjs-query/commit/63cc89f0b98d1164a9bf201489d996b74700444f))
* **deps:** update dependency apollo-server-express to v2.19.2 ([6035bdd](https://github.com/tripss/nestjs-query/commit/6035bdd0f76f743a43facf658ea4f7baed13e15d))
* **deps:** update dependency apollo-server-plugin-base to v0.10.2 ([b39da69](https://github.com/tripss/nestjs-query/commit/b39da690428eaabe39ac184bdc654b54565130e1))
* **deps:** update dependency apollo-server-plugin-base to v0.10.3 ([12093ae](https://github.com/tripss/nestjs-query/commit/12093ae5dd579ab94f42ab0209e199d5afcad32a))
* **deps:** update dependency apollo-server-plugin-base to v0.10.4 ([7c0e391](https://github.com/tripss/nestjs-query/commit/7c0e3917e24081cf5bfcb596840038adef61b7e9))
* **deps:** update dependency graphql-query-complexity to v0.7.1 ([8bd196d](https://github.com/tripss/nestjs-query/commit/8bd196d017ab7452ce3b7f1ca1f3ef2f0d1e6325))
* **deps:** update dependency graphql-query-complexity to v0.7.2 ([905f0f5](https://github.com/tripss/nestjs-query/commit/905f0f51a9db801f76e9f4581fc95eadd6e39841))
* **deps:** update dependency graphql-tools to v6.2.6 ([c1bba6d](https://github.com/tripss/nestjs-query/commit/c1bba6d4011085929ec5f733a4d6ac640428ee88))
* **deps:** update dependency graphql-tools to v7.0.2 ([6b204dc](https://github.com/tripss/nestjs-query/commit/6b204dc83988ad8be730fe83df0cf3c707895664))
* **deps:** update dependency pg to v8.4.2 ([be2dd88](https://github.com/tripss/nestjs-query/commit/be2dd884377b3eaff21a8adaf8f05f08b2ef505f))
* **deps:** update dependency pg to v8.5.0 ([52e4258](https://github.com/tripss/nestjs-query/commit/52e4258bd5912b4ef5eff53943d291269dc89101))
* **deps:** update dependency pg to v8.5.1 ([b435a7f](https://github.com/tripss/nestjs-query/commit/b435a7fc04f29f5433374e24dff6c67771c2d819))
* **deps:** update dependency uuid to v8.3.2 ([289f1ed](https://github.com/tripss/nestjs-query/commit/289f1ed5610781792d3c1efa5492376095084ac0))
* **deps:** update docusaurus monorepo to v2.0.0-alpha.68 ([31ec621](https://github.com/tripss/nestjs-query/commit/31ec6216d2896d3afac42af6711558ec4bd447d1))
* **deps:** update docusaurus monorepo to v2.0.0-alpha.69 ([6430d84](https://github.com/tripss/nestjs-query/commit/6430d840d5185a34a95fefd2d3fce33f847f6d28))
* **deps:** update docusaurus monorepo to v2.0.0-alpha.fd17476c3 ([c34ebf2](https://github.com/tripss/nestjs-query/commit/c34ebf229d3d8681a4015b0817773fd396a76998))
* **deps:** Update mongoose and @nestjs/mongoose to latest versions ([ca575cf](https://github.com/tripss/nestjs-query/commit/ca575cfce5634233dfefa93c6c9347db91086b39))
* **deps:** update react monorepo to v17 ([b9a6339](https://github.com/tripss/nestjs-query/commit/b9a6339fd1656ebeb3eeafaa93a08ab6664935f8))





## [0.21.2](https://github.com/tripss/nestjs-query/compare/v0.21.1...v0.21.2) (2020-10-23)


### Bug Fixes

* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.66 ([0f323ec](https://github.com/tripss/nestjs-query/commit/0f323ec6085465437fd83d437a0d9ba2bdbc3526))
* **deps:** update dependency graphql-tools to v6.2.5 ([4b491b2](https://github.com/tripss/nestjs-query/commit/4b491b226dc5e85bbc4c446556fe66dc622905c0))
* dataloader cacheKeyFn bigint problem ([92171dc](https://github.com/tripss/nestjs-query/commit/92171dcc76563c563e2586809aec6f12f00aadfa))
* **codeql:** Use language auto-detect ([63e4632](https://github.com/tripss/nestjs-query/commit/63e463266238042a797a1322ec6c21bffae9c098))
* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.66 ([5546a6c](https://github.com/tripss/nestjs-query/commit/5546a6cf288b55d3600b41b5008e558e71f139c7))


### Features

* **core:** added two new filter helpers ([031012e](https://github.com/tripss/nestjs-query/commit/031012e96bf99e1eb08c155059fd5106b38e9faf))





## [0.21.1](https://github.com/tripss/nestjs-query/compare/v0.21.0...v0.21.1) (2020-10-18)


### Bug Fixes

* **deps:** update dependency uuid to v8.3.1 ([a2b7555](https://github.com/tripss/nestjs-query/commit/a2b7555c1186e48999d44aa8af9b792f32b18b7e))
* **deps:** update react monorepo to v16.14.0 ([60e55d7](https://github.com/tripss/nestjs-query/commit/60e55d7de4dbb9a25f4441ce48df03cc1038fd0d))


### Features

* **graphql, #586:** Allow overriding endpoint name ([1634e71](https://github.com/tripss/nestjs-query/commit/1634e71e7d8eca5b3a2422b7514fea8c2f72220e)), closes [#586](https://github.com/tripss/nestjs-query/issues/586)





# [0.21.0](https://github.com/tripss/nestjs-query/compare/v0.20.2...v0.21.0) (2020-10-16)


### Bug Fixes

* **core:** Look up the proper assembler with inheritance ([8bd22c5](https://github.com/tripss/nestjs-query/commit/8bd22c5a40974c9011d0b472dc1ebe1328ba83f6))
* **deps:** update dependency apollo-server-express to v2.18.2 ([cb9d708](https://github.com/tripss/nestjs-query/commit/cb9d70873e957bfc0c806f1bf7ec9aa4259b3c4b))
* **deps:** update dependency pg to v8.4.0 ([d8a76bd](https://github.com/tripss/nestjs-query/commit/d8a76bd671cd91aeedcc24d990b80ef1d3e8f6f8))
* **deps:** update dependency pg to v8.4.1 ([d04537b](https://github.com/tripss/nestjs-query/commit/d04537be3fc48c59bb78fc374d3f2390d6499372))
* **eslint:** Fix eslint to recognize sub packages ([13fdd2b](https://github.com/tripss/nestjs-query/commit/13fdd2b31289dbc80316cbdb5aa32edbe596bad4))
* **mongodb:** Delete unsupported MongoDB soft deletion ([22decdf](https://github.com/tripss/nestjs-query/commit/22decdfadad7a79ff77f33ab022bb6e7a5f52e73))


### Features

* **mongodb:** Add basic support for MongoDB ([ce4c5e9](https://github.com/tripss/nestjs-query/commit/ce4c5e95e02fe36a89302ce97fbb7d2b0ef86717))
* **mongodb:** Add support for all filter operators ([9420036](https://github.com/tripss/nestjs-query/commit/9420036d8d24e825c08b60bd9773404e26968ea5))
* **mongodb:** Add support for find relations with MongoDB ([f4190e6](https://github.com/tripss/nestjs-query/commit/f4190e65a4379fd53018dc9809b017dccd0152c4))
* **mongodb:** Add support for list of references ([bc926a4](https://github.com/tripss/nestjs-query/commit/bc926a4f089fd790b8bc37ee126bfcc2f70fc145))
* **mongodb:** Allow to customize mongoose document options ([46db24a](https://github.com/tripss/nestjs-query/commit/46db24ac2b424b9379d380792328ee670fb281e3))
* **mongodb:** Allow to override filter operators ([24e7c0a](https://github.com/tripss/nestjs-query/commit/24e7c0a6146ca37598b73577bd772e0e79dea823))
* **mongodb:** Include virtuals on document responses ([bc407a0](https://github.com/tripss/nestjs-query/commit/bc407a0f7100a741d8a4084227e3767fcf36dd4a))
* **mongodb:** Use new filter on typegoose query service ([de34e92](https://github.com/tripss/nestjs-query/commit/de34e9240055b0f1cfbb360b66c37f216f115ddb))
* **mongodb:** Use typegoose for MongoDB support ([702dc83](https://github.com/tripss/nestjs-query/commit/702dc839638afd6b781dbb0f75f725d7286eb580))
* **mongoose:** Add mongo support ([ba21ed4](https://github.com/tripss/nestjs-query/commit/ba21ed4dee5202781a7a42ca0609b22a0c0afbdd))
* **mongoose:** Hardening reference support ([107bba0](https://github.com/tripss/nestjs-query/commit/107bba040a2b1d423deb4f1e428a43cecab48e79))
* **mongoose:** Remove unused code ([7715ce7](https://github.com/tripss/nestjs-query/commit/7715ce70982078db2bbc7fbfe0cdf89c4591d04a))
* **mongoose:** Switch to native mongoose support ([5cdfa39](https://github.com/tripss/nestjs-query/commit/5cdfa39b7d91cf0f8438ef3387a89aac850f4452))





## [0.20.2](https://github.com/tripss/nestjs-query/compare/v0.20.1...v0.20.2) (2020-10-01)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.2.4 ([d363cbc](https://github.com/tripss/nestjs-query/commit/d363cbc49944fa89d3dc13ab784c7f7be41edc05))
* **filters:** Fix bug with incorect parameters in filter ([6ada4f4](https://github.com/tripss/nestjs-query/commit/6ada4f4a12633d41c60de9540dfc28ed0985ca62))
* **filters:** Fix bug with incorect parameters in filters ([9f4e93b](https://github.com/tripss/nestjs-query/commit/9f4e93b7726d85cb4febe86d2caf941dc957463a))
* **typeorm:** fix unit tests after fix filters bug ([5f50419](https://github.com/tripss/nestjs-query/commit/5f5041906694ae7c4aa799f52049d0981b97ccfc))


### Features

* **core:** parallelize queries within relation query service ([b339a2a](https://github.com/tripss/nestjs-query/commit/b339a2a9a3d1ad315d92eec67ab31af18617f6ca))





## [0.20.1](https://github.com/tripss/nestjs-query/compare/v0.20.0...v0.20.1) (2020-09-28)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.18.0 ([ca28fda](https://github.com/tripss/nestjs-query/commit/ca28fdaca52d8a16da917d2584665361726f8aa1))
* **deps:** update dependency apollo-server-express to v2.18.1 ([b5f9378](https://github.com/tripss/nestjs-query/commit/b5f93780752aace1c70745c2750b6596715cca7a))
* **deps:** update dependency apollo-server-plugin-base to v0.10.1 ([735032a](https://github.com/tripss/nestjs-query/commit/735032ab70f04840a9011d604db791fb0299767a))
* **deps:** update dependency graphql-tools to v6.2.3 ([642c11f](https://github.com/tripss/nestjs-query/commit/642c11f8b5f720b60557def07d498132f2e55748))
* **deps:** update dependency mysql2 to v2.2.1 ([5159077](https://github.com/tripss/nestjs-query/commit/5159077ad56d2f5ba3ca4d1f1d8190ee83be78a5))
* **deps:** update dependency mysql2 to v2.2.2 ([f9235b2](https://github.com/tripss/nestjs-query/commit/f9235b249abb5155c3ebce0858173614b1415cad))
* **deps:** update dependency mysql2 to v2.2.3 ([a2a5afc](https://github.com/tripss/nestjs-query/commit/a2a5afc6869de5767f2712b434f1babfadaee77f))
* **deps:** update dependency mysql2 to v2.2.5 ([b66e6e6](https://github.com/tripss/nestjs-query/commit/b66e6e6f15cb8440b4e837b6f04523fc0d9ec340))
* **graphql:** Fix assemblers type for module passthrough ([713c41c](https://github.com/tripss/nestjs-query/commit/713c41cd770068f2242a380593e4a22601d6560b))





# [0.20.0](https://github.com/tripss/nestjs-query/compare/v0.19.4...v0.20.0) (2020-09-17)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.64 ([ea0a202](https://github.com/tripss/nestjs-query/commit/ea0a202fa8834faf319471143188a1bc46d04a53))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.64 ([3d3dd96](https://github.com/tripss/nestjs-query/commit/3d3dd965350669a6e38fe1a600c08ed0f858c6a7))


### Features

* **core:** Update assemblers to allow transforming create/update dtos ([5085d11](https://github.com/tripss/nestjs-query/commit/5085d1193a84396c9016821347c04f0e15eb04da))
* **core:** Update query service decorator to have correct generics ([74dc618](https://github.com/tripss/nestjs-query/commit/74dc618b61d1ce5575843accf5ea01066020f073))





## [0.19.4](https://github.com/tripss/nestjs-query/compare/v0.19.3...v0.19.4) (2020-09-15)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.2.2 ([8a2253b](https://github.com/tripss/nestjs-query/commit/8a2253b4ceb602422864f2a79bfed0c5dfcb7819))


### Features

* **graphql:** Add keyset connections ([36bdbdd](https://github.com/tripss/nestjs-query/commit/36bdbdd9fda8b1db531ceb65c3a7c604c3da23fe))





## [0.19.3](https://github.com/tripss/nestjs-query/compare/v0.19.2...v0.19.3) (2020-09-09)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.63 ([631e922](https://github.com/tripss/nestjs-query/commit/631e9225a3ac94f1f29158bc24285de31c0ad5d6))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.63 ([aa95f40](https://github.com/tripss/nestjs-query/commit/aa95f4094952ccb5c63df7d8d1b4ccce571e1990))
* **deps:** update dependency graphql-tools to v6.2.1 ([b1e0833](https://github.com/tripss/nestjs-query/commit/b1e083335df10efe76ceef88f752b45392a8a911))
* **deps:** update dependency rxjs to v6.6.3 ([addf2e2](https://github.com/tripss/nestjs-query/commit/addf2e2b4b4f909a96d452850385ae6a72d0a087))
* **examples:** Fix nest-cli.json to reference correct tsconfig ([a49d063](https://github.com/tripss/nestjs-query/commit/a49d0639a4699de4bfde6228744ea9e1e5b6ee16))
* **graphql,hooks:** Allow getting hooks from parent classes ([59a0aeb](https://github.com/tripss/nestjs-query/commit/59a0aebc3dabd7d23ffde576a94bc588e768efbe))





## [0.19.2](https://github.com/tripss/nestjs-query/compare/v0.19.1...v0.19.2) (2020-09-03)


### Bug Fixes

* **graphql, #505:** Less restrictive readResolverOpts for auto crud ([b4e6862](https://github.com/tripss/nestjs-query/commit/b4e68620a973caf4a6bc9ddc9947c0be7464fb11)), closes [#505](https://github.com/tripss/nestjs-query/issues/505)





## [0.19.1](https://github.com/tripss/nestjs-query/compare/v0.19.0...v0.19.1) (2020-09-02)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.2.0 ([1183fa3](https://github.com/tripss/nestjs-query/commit/1183fa345da9230c07b2bebaabe29647bb498f6d))
* **typeorm,#493:** Fix uni-directional relation SQL ([7887b8c](https://github.com/tripss/nestjs-query/commit/7887b8c94516194840df03139fecd0d5a0f38f65))





# [0.19.0](https://github.com/tripss/nestjs-query/compare/v0.18.1...v0.19.0) (2020-09-01)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.62 ([dc773f4](https://github.com/tripss/nestjs-query/commit/dc773f48996b1208b1f1c17c34977bbf6838e108))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.62 ([ad5c2d2](https://github.com/tripss/nestjs-query/commit/ad5c2d21146aab5fd9ddc3982ec2cce547b58ffd))
* **deps:** update dependency apollo-server-express to v2.17.0 ([53398fe](https://github.com/tripss/nestjs-query/commit/53398fe9f2e879499892066b9a6bb90879afc8bf))
* **deps:** update dependency graphql-tools to v6.1.0 ([2394310](https://github.com/tripss/nestjs-query/commit/23943101d4fb52e3ba94018df4b902acf6adb2fe))
* **deps:** update dependency pg to v8.3.2 ([1a03710](https://github.com/tripss/nestjs-query/commit/1a037100ce497c319bd9d0be3c17088f48fa893e))
* **deps:** update dependency pg to v8.3.3 ([f471395](https://github.com/tripss/nestjs-query/commit/f471395a782eeabe679936c104fdb14521623441))
* **example,auth:** Fix auth example ([b26e1c6](https://github.com/tripss/nestjs-query/commit/b26e1c62e1f3264f68dfaf637239e409145b3106))


### Features

* **auth:** Initial Investigation ([8d40636](https://github.com/tripss/nestjs-query/commit/8d4063620cee52be41b7847d99bdfa8a5a2f75b7))
* **core:** Update QueryService to allow additional filtering ([474369b](https://github.com/tripss/nestjs-query/commit/474369bd46ee82e3c8510f0564019627367d467c))
* **graphql,auth:** Add authorization to resolvers and relations ([9d76787](https://github.com/tripss/nestjs-query/commit/9d76787d031e6a731f28877c0df46cf4472b2faf))
* **sequelize:** Add additional filter options to QueryService ([29fdfa7](https://github.com/tripss/nestjs-query/commit/29fdfa724ec199835a6493b5f9cccb6bec58f074))
* **typeorm:** Add additional filter options to QueryService ([64241dc](https://github.com/tripss/nestjs-query/commit/64241dc9c4565c3bb2d4f168c837578bd706c48c))





## [0.18.1](https://github.com/tripss/nestjs-query/compare/v0.18.0...v0.18.1) (2020-08-14)


### Bug Fixes

* **core:** Fix potential stack overflow with filter comparison ([f498802](https://github.com/tripss/nestjs-query/commit/f49880274a32e681d9072253135a8669bec7b3b2))
* **deps:** update dependency graphql-query-complexity to v0.7.0 ([d47bba1](https://github.com/tripss/nestjs-query/commit/d47bba1def07445f3e6e190d4382653f0d21ceaf))
* **deps:** update dependency graphql-tools to v6.0.17 ([b0d1648](https://github.com/tripss/nestjs-query/commit/b0d1648509daeb63ec3973ae598de4529ac093d8))
* **deps:** update dependency graphql-tools to v6.0.18 ([9678548](https://github.com/tripss/nestjs-query/commit/9678548965217ecf63151ff72f75d1358a06c181))
* **tests:** Make subTask connections tests order consistently ([ab8bab2](https://github.com/tripss/nestjs-query/commit/ab8bab23d1679b06e60966999a0d4e2e1f258e78))


### Features

* **core:** refactor null compares and improve tests ([3582ed2](https://github.com/tripss/nestjs-query/commit/3582ed2f6b4aa5e3fa78bd9986621b9816566156))
* refactored filter builder to support nested object filters ([1ee8dbf](https://github.com/tripss/nestjs-query/commit/1ee8dbf5a0ae1a1258b203da1e68901e2b8d20f8))





# [0.18.0](https://github.com/tripss/nestjs-query/compare/v0.17.10...v0.18.0) (2020-08-11)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.61 ([c2f03b8](https://github.com/tripss/nestjs-query/commit/c2f03b872d8ac111f257ef280a51ade4a5ea7ddb))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.61 ([e052793](https://github.com/tripss/nestjs-query/commit/e0527932cfd52a4096441805b076b42ad739c525))
* **deps:** update dependency graphql-tools to v6.0.16 ([df3784d](https://github.com/tripss/nestjs-query/commit/df3784d33d0e6db04a2a160b60edf49ce52dc2ba))
* **e2e:** Making tests deterministic ([175cc2e](https://github.com/tripss/nestjs-query/commit/175cc2edc02a2bb58db4557812c00b657f708ca6))
* **tests:** Fix tests to be deterministic ([5dd6dac](https://github.com/tripss/nestjs-query/commit/5dd6dacc2ccace913c64343726474b51f814a1e4))
* **type:** Pin dev dependencies ([442db4c](https://github.com/tripss/nestjs-query/commit/442db4cd9b9d48d0c6a20209f0b44c4a314660ac))
* **workflow:** Fix github actions matrix reference ([a4d9447](https://github.com/tripss/nestjs-query/commit/a4d9447e863f0663385c652b9a1d34752d47817a))


### Features

* **typeorm:** Switch to use unioned queries for relations ([327c676](https://github.com/tripss/nestjs-query/commit/327c6760e3e1a7db6bb0f872928d0502345c925f))





## [0.17.10](https://github.com/tripss/nestjs-query/compare/v0.17.9...v0.17.10) (2020-08-01)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.60 ([8982a12](https://github.com/tripss/nestjs-query/commit/8982a125ca013e824554a3313d63710d77cf3cad))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.60 ([3663b9b](https://github.com/tripss/nestjs-query/commit/3663b9b96557d6fe190578d41d62ac2540121e88))
* **deps:** update dependency rxjs to v6.6.2 ([7062be9](https://github.com/tripss/nestjs-query/commit/7062be9df416ed3d6e5dca96cbeef98a835a3a6c))





## [0.17.9](https://github.com/tripss/nestjs-query/compare/v0.17.8...v0.17.9) (2020-07-29)


### Features

* **graphql:** Allow specifying fields that are required when querying ([a425ba7](https://github.com/tripss/nestjs-query/commit/a425ba73b0fc5a184db5b10a709ed78fd234ba7a))





## [0.17.8](https://github.com/tripss/nestjs-query/compare/v0.17.7...v0.17.8) (2020-07-28)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.59 ([ffe2ae9](https://github.com/tripss/nestjs-query/commit/ffe2ae926bb43edcd970fd7618bcb5a62a8d43c4))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.59 ([7a80894](https://github.com/tripss/nestjs-query/commit/7a8089499e402163383a53ce51fbee590f633c76))
* **deps:** update dependency apollo-server-express to v2.16.1 ([4989294](https://github.com/tripss/nestjs-query/commit/49892946b7b2d6f67ec7402946c07cee7b9bee44))


### Features

* **graphql:** Allow specifying allowed comparisons on filterable fields ([ced2792](https://github.com/tripss/nestjs-query/commit/ced27920e5c2278c2a04c027a692e25b3306f6cb))





## [0.17.7](https://github.com/tripss/nestjs-query/compare/v0.17.6...v0.17.7) (2020-07-27)


### Features

* **core:** Added applySort, applyPaging and applyQuery [#405](https://github.com/tripss/nestjs-query/issues/405) ([9f9ae0d](https://github.com/tripss/nestjs-query/commit/9f9ae0d0722c685483f1b2e1bd501a0f3df3ff85))





## [0.17.6](https://github.com/tripss/nestjs-query/compare/v0.17.5...v0.17.6) (2020-07-24)


### Bug Fixes

* **graphql:** Include inherited references and relations ([26dd6f9](https://github.com/tripss/nestjs-query/commit/26dd6f972379cad736f483912c7a2cf44d0ba966))





## [0.17.5](https://github.com/tripss/nestjs-query/compare/v0.17.4...v0.17.5) (2020-07-24)


### Bug Fixes

* **graphql,aggregations:** Exclude __typename in aggregations ([3897673](https://github.com/tripss/nestjs-query/commit/3897673681b30425debc329ad5d5bb442b3838fe))





## [0.17.4](https://github.com/tripss/nestjs-query/compare/v0.17.3...v0.17.4) (2020-07-23)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.0.15 ([a45ece7](https://github.com/tripss/nestjs-query/commit/a45ece763127793d97dbe1bbff150309962abf62))


### Features

* **graphql,hooks:** Add before hooks to graphql mutations ([3448955](https://github.com/tripss/nestjs-query/commit/3448955331ae24f3b08c1d8b459b13e0ae96c79f))





## [0.17.3](https://github.com/tripss/nestjs-query/compare/v0.17.2...v0.17.3) (2020-07-17)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.16.0 ([0870afe](https://github.com/tripss/nestjs-query/commit/0870afe470e90ddeb02da79a3b06bb27b1787c3a))
* **graphql:** Fix filters to transform to expected type [#317](https://github.com/tripss/nestjs-query/issues/317) ([0d28b0b](https://github.com/tripss/nestjs-query/commit/0d28b0b968468f821e9b6cf7d53e6d95af22e710))





## [0.17.2](https://github.com/tripss/nestjs-query/compare/v0.17.1...v0.17.2) (2020-07-17)


### Bug Fixes

* **typeorm:** Ensure record is entity instance when saving ([3cdbbaf](https://github.com/tripss/nestjs-query/commit/3cdbbaff11b18bcc5e6fd29fd182e2bd66b14f17)), closes [#380](https://github.com/tripss/nestjs-query/issues/380)





## [0.17.1](https://github.com/tripss/nestjs-query/compare/v0.17.0...v0.17.1) (2020-07-17)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.0.14 ([acb7e48](https://github.com/tripss/nestjs-query/commit/acb7e48a052829d847f8d406123857bf411959d8))


### Features

* **complexity:** Add complexity support for relations ([aa85325](https://github.com/tripss/nestjs-query/commit/aa853257e693cc656d6ef00d08d547f1988f16c5))





# [0.17.0](https://github.com/tripss/nestjs-query/compare/v0.16.2...v0.17.0) (2020-07-16)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.0.13 ([802bb5b](https://github.com/tripss/nestjs-query/commit/802bb5bae9a19ba87366a363aab70480f2c3d213))


### Features

* **aggregations:** Add aggregation support to sequelize ([c37b7ae](https://github.com/tripss/nestjs-query/commit/c37b7aeb00fc60e7dc55893fe712dcad454edddb))
* **aggregations:** Add aggregations interfaces ([d67e733](https://github.com/tripss/nestjs-query/commit/d67e73393d2cb8d2f0dc131a8455bb798a270e14))
* **aggregations:** Add aggregations to graphql ([af075d2](https://github.com/tripss/nestjs-query/commit/af075d2e93b6abbbfbe32afcc917350f803fadaa))
* **aggregations,relations:** Add relation aggregation graphql enpoints ([56bb7e0](https://github.com/tripss/nestjs-query/commit/56bb7e0be3298ebe76159327ce54229818a6067b))
* **aggregations,relations,core:** Add relation aggregation to core ([a489588](https://github.com/tripss/nestjs-query/commit/a4895881a1e9ff76811b264cc58eeea116b3edfd))
* **aggregations,sequelize:** Add relation aggregation to sequelize ([93e7c1b](https://github.com/tripss/nestjs-query/commit/93e7c1ba3d03b222b08f39bbbfaf4365ce50204e))
* **aggregations,sequelize:** Fix aggregation on many-to-many relations ([db6ecb2](https://github.com/tripss/nestjs-query/commit/db6ecb2527a96ba232c8af911e4eb2f6ab9f8a65))
* **aggregations,typeorm:** Add relation aggregation to typeorm ([2bf35a9](https://github.com/tripss/nestjs-query/commit/2bf35a92ce80b1f3026fd87cb62cad17eb6eff03))
* **aggretations:** Add aggregations support to typeorm ([7233c23](https://github.com/tripss/nestjs-query/commit/7233c2397d0ac332e5209ab87ae62f5f555609d6))





## [0.16.2](https://github.com/tripss/nestjs-query/compare/v0.16.1...v0.16.2) (2020-07-09)


### Bug Fixes

* **deps:** update dependency pg to v8.2.2 ([cd7fbb5](https://github.com/tripss/nestjs-query/commit/cd7fbb51227a64e18c348f2e0050553c18c0815c))
* **deps:** update dependency pg to v8.3.0 ([25c8dcb](https://github.com/tripss/nestjs-query/commit/25c8dcb2d00ec94b6f8b5d6c6074ee4d44c115bb))
* **imports:** Remove additional /src references ([9528772](https://github.com/tripss/nestjs-query/commit/9528772fd4f9b4448112d912e913d07fddf4b619))





## [0.16.1](https://github.com/tripss/nestjs-query/compare/v0.16.0...v0.16.1) (2020-07-07)


### Bug Fixes

* **typeorm:** Fix import path in relation service [#363](https://github.com/tripss/nestjs-query/issues/363) ([0e6d484](https://github.com/tripss/nestjs-query/commit/0e6d484920960ed1966360a89af979230667b5f7))





# [0.16.0](https://github.com/tripss/nestjs-query/compare/v0.15.1...v0.16.0) (2020-07-05)


### Bug Fixes

* **deps:** update dependency apollo-server-express to v2.15.1 ([29f2b72](https://github.com/tripss/nestjs-query/commit/29f2b72dcf324bf87ed0e4ff49a1e4f2e26e956c))
* **deps:** update dependency graphql-tools to v6.0.12 ([3048277](https://github.com/tripss/nestjs-query/commit/30482777ef592bd4d3a8b0d41d8b4a9e8e60c9f7))
* **deps:** update dependency rxjs to v6.6.0 ([cc356f9](https://github.com/tripss/nestjs-query/commit/cc356f9f51f2ccf0931539798dd4a0c8138e989a))
* **deps:** update dependency sequelize to v5.22.2 ([c04d1fc](https://github.com/tripss/nestjs-query/commit/c04d1fc762a435dfdee99a8d6a8ee9f163df851f))
* **deps:** update dependency sequelize to v5.22.3 ([ac288e3](https://github.com/tripss/nestjs-query/commit/ac288e323f01608cb2fed4bce0a6bdc86ecc3921))
* **sequelize:** Change query to not use sub queries ([80c69d6](https://github.com/tripss/nestjs-query/commit/80c69d6b285725eb99dc05675044185d2f4343a8))


### Features

* **core:** Add type support for nest objects in filter ([cd9d0b5](https://github.com/tripss/nestjs-query/commit/cd9d0b524c1f4c384dc9e5ac6baeb5a49bc068e7))
* **graphql:** Enable filtering on ORM relations ([60229b8](https://github.com/tripss/nestjs-query/commit/60229b8fe981a863e8f31f1734c0b9a1aa001cf2))
* **sequelize:** Add support for querying for nested relations ([92a51c1](https://github.com/tripss/nestjs-query/commit/92a51c120aa2bf6da915037628aad041fa0fc34c))
* **typeorm:** Add support for filtering on relations ([aa8788c](https://github.com/tripss/nestjs-query/commit/aa8788cbbc0c95465e1633b57ca48c91b160038a))





## [0.15.1](https://github.com/tripss/nestjs-query/compare/v0.15.0...v0.15.1) (2020-06-27)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6.0.11 ([14416c4](https://github.com/tripss/nestjs-query/commit/14416c41dbd0dffab105415ee45b2d7fa389a86b))
* **deps:** update dependency sequelize to v5.22.1 ([6ff765d](https://github.com/tripss/nestjs-query/commit/6ff765d2c8d01d99d20920f370d90d9959b183ff))





# [0.15.0](https://github.com/tripss/nestjs-query/compare/v0.14.3...v0.15.0) (2020-06-23)


### Features

* **graphql,connection:** Add totalCount to connections ([ed1e84a](https://github.com/tripss/nestjs-query/commit/ed1e84a2feb6f89c3b270fcbc1d0eaf6aec5e575))





## [0.14.3](https://github.com/tripss/nestjs-query/compare/v0.14.2...v0.14.3) (2020-06-20)


### Bug Fixes

* **deps:** update dependency @apollo/federation to v0.16.9 ([28ac98c](https://github.com/tripss/nestjs-query/commit/28ac98c2b3efbda8267dd20354009e67439cbb04))
* **graphql,subscriptions:** Expose InjectPubSub decorator ([867022e](https://github.com/tripss/nestjs-query/commit/867022e1967e63659b5df24b13eb04c829569372))





## [0.14.2](https://github.com/tripss/nestjs-query/compare/v0.14.1...v0.14.2) (2020-06-19)


### Bug Fixes

* **typeorm:** Allow using string based typeorm relations ([55c157d](https://github.com/tripss/nestjs-query/commit/55c157dbea9ce8c1186a2c2ea17f847857fd2226))





## [0.14.1](https://github.com/tripss/nestjs-query/compare/v0.14.0...v0.14.1) (2020-06-19)


### Bug Fixes

* **graphql:** Allow custom scalars for comparisons ([57cbe38](https://github.com/tripss/nestjs-query/commit/57cbe38cdd941bafab75a660803be6ae5c0afb2c))





# [0.14.0](https://github.com/tripss/nestjs-query/compare/v0.13.2...v0.14.0) (2020-06-18)


### Bug Fixes

* **deps:** update dependency @apollo/federation to v0.16.8 ([01d05c1](https://github.com/tripss/nestjs-query/commit/01d05c1f9739485373153acf0ecee85346ca4738))
* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.58 ([1060e05](https://github.com/tripss/nestjs-query/commit/1060e05f4f09ab66a508385de232ac2c83f91935))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.58 ([236cd18](https://github.com/tripss/nestjs-query/commit/236cd18f54855e3bb7f2f733f3c900de59a669df))
* **deps:** update dependency apollo-server-express to v2.15.0 ([355d22b](https://github.com/tripss/nestjs-query/commit/355d22b2995888de4383bf3867daa3f8e982971b))
* **deps:** update dependency graphql-tools to v6.0.10 ([005ee15](https://github.com/tripss/nestjs-query/commit/005ee15c79ed921520c07f21d54bb50859e2e7ef))


### Features

* **graphql,paging:** Add NONE paging strategy ([216d926](https://github.com/tripss/nestjs-query/commit/216d926a11bb7f4929fe9394c04af826cd3fa52f))





## [0.13.2](https://github.com/tripss/nestjs-query/compare/v0.13.1...v0.13.2) (2020-06-14)


### Bug Fixes

* **graphl,filters:** Allow for enums when filtering ([60dcc30](https://github.com/tripss/nestjs-query/commit/60dcc3074b36a2aeffbf4e30b04d0af3631ae02a))





## [0.13.1](https://github.com/tripss/nestjs-query/compare/v0.13.0...v0.13.1) (2020-06-12)


### Bug Fixes

* **graphql,paging:** Fix for [#281](https://github.com/tripss/nestjs-query/issues/281) paging backwards windowing ([c319344](https://github.com/tripss/nestjs-query/commit/c3193440504f55ef8b8b08b486ae01c1b54595bc))





# [0.13.0](https://github.com/tripss/nestjs-query/compare/v0.12.0...v0.13.0) (2020-06-12)


### Bug Fixes

* **deps:** update dependency @apollo/federation to v0.16.6 ([e51bb37](https://github.com/tripss/nestjs-query/commit/e51bb376f5b704947130da88275cb6b9d6a4a1f0))
* **deps:** update dependency apollo-server-express to v2.14.4 ([ae31896](https://github.com/tripss/nestjs-query/commit/ae31896f3f62db23f8ae1f3a16a3af59956ed5df))
* **deps:** update dependency graphql to v15.1.0 ([e6362fe](https://github.com/tripss/nestjs-query/commit/e6362fee9ba787fb8db2a15884aae5ce5db154d9))
* **deps:** update dependency graphql-tools to v6.0.9 ([4d7ccc9](https://github.com/tripss/nestjs-query/commit/4d7ccc92bbef2df29a7a63fb9554bbbb79c918d4))


### Features

* **graphql:** Add limit offset paging without connections ([5fc3e90](https://github.com/tripss/nestjs-query/commit/5fc3e90c0c738cc653eab57eb0be3c98dae51c3e))





# [0.12.0](https://github.com/tripss/nestjs-query/compare/v0.11.8...v0.12.0) (2020-06-07)


### Bug Fixes

* **deps:** update dependency @apollo/federation to v0.16.4 ([e000230](https://github.com/tripss/nestjs-query/commit/e00023069c2d6006cc8f3cc4920efdd5ae0dc859))
* **deps:** update dependency apollo-server-express to v2.14.2 [security] ([36c9649](https://github.com/tripss/nestjs-query/commit/36c964914ef8d75968d3649de5e9fe9d2af22f4e))
* **deps:** update dependency graphql-tools to v6.0.4 ([aaa6233](https://github.com/tripss/nestjs-query/commit/aaa62331b0894bd9d0d3f7b35dbc9c0b3d5425c0))
* **deps:** update dependency graphql-tools to v6.0.5 ([fe181ae](https://github.com/tripss/nestjs-query/commit/fe181ae67a10599974a58246cbababbb07ff32e5))
* **deps:** update dependency graphql-tools to v6.0.8 ([27cb278](https://github.com/tripss/nestjs-query/commit/27cb2789834c37dc4974d335aa7a435ca6850de0))


### Features

* **graphql:** Add graphql subscriptions ([5dc987f](https://github.com/tripss/nestjs-query/commit/5dc987f435e0680192313e208359839f9c21d70b))





## [0.11.8](https://github.com/tripss/nestjs-query/compare/v0.11.7...v0.11.8) (2020-05-30)

**Note:** Version bump only for package nestjs-query





## [0.11.7](https://github.com/tripss/nestjs-query/compare/v0.11.6...v0.11.7) (2020-05-29)


### Bug Fixes

* **deps:** update dependency @apollo/federation to v0.16.1 ([1fd84e1](https://github.com/tripss/nestjs-query/commit/1fd84e1fab37011be4a02f6181a1d965c523a8f1))
* **deps:** update dependency @apollo/federation to v0.16.2 ([ad047b3](https://github.com/tripss/nestjs-query/commit/ad047b35674219fd7907ddafdb66cf8ffbcb4640))
* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.56 ([811d26d](https://github.com/tripss/nestjs-query/commit/811d26de4881caf4b816dce6f9d27395f3948a73))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.56 ([b7fd2af](https://github.com/tripss/nestjs-query/commit/b7fd2af37ac6bb262d335a7bee9e6ac186161f1f))
* **deps:** update dependency apollo-server-express to v2.14.0 ([8ca9ee5](https://github.com/tripss/nestjs-query/commit/8ca9ee5a5f4a62502a064ce1e3e27dceea0b58b0))
* **deps:** update dependency apollo-server-express to v2.14.1 ([4776e70](https://github.com/tripss/nestjs-query/commit/4776e7052e7c7a777f332b601c9922bf1487d5e6))
* **deps:** update dependency graphql-tools to v6.0.3 ([15429a5](https://github.com/tripss/nestjs-query/commit/15429a5230fe983b8e91d6559deab099070eec62))





## [0.11.6](https://github.com/tripss/nestjs-query/compare/v0.11.5...v0.11.6) (2020-05-26)


### Bug Fixes

* **deps:** update dependency graphql-tools to v6 ([b1aeba1](https://github.com/tripss/nestjs-query/commit/b1aeba1411e097f4484f7beca2b05eab99e9d586))





## [0.11.5](https://github.com/tripss/nestjs-query/compare/v0.11.4...v0.11.5) (2020-05-21)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.55 ([8926e12](https://github.com/tripss/nestjs-query/commit/8926e1253cbc01f3c7cf9cc074d76fe47f5bb9d2))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.55 ([1ed906f](https://github.com/tripss/nestjs-query/commit/1ed906f9ff80302b27754f114f2578a3948bf305))





## [0.11.4](https://github.com/tripss/nestjs-query/compare/v0.11.3...v0.11.4) (2020-05-19)

**Note:** Version bump only for package nestjs-query





## [0.11.3](https://github.com/tripss/nestjs-query/compare/v0.11.2...v0.11.3) (2020-05-16)


### Bug Fixes

* **deps:** update dependency pg to v8.2.1 ([4603b85](https://github.com/tripss/nestjs-query/commit/4603b85280f98b34fd4e3e58ef6b32a43701110b))





## [0.11.2](https://github.com/tripss/nestjs-query/compare/v0.11.1...v0.11.2) (2020-05-14)


### Bug Fixes

* Fix lint issues ([c3407c0](https://github.com/tripss/nestjs-query/commit/c3407c0abfebe2ed6563cf754bab646af124a661))
* **deps:** update dependency @apollo/federation to v0.16.0 ([5a5acd6](https://github.com/tripss/nestjs-query/commit/5a5acd6edaeee96a0a1344ed52500522c10fd129))
* **deps:** update dependency apollo-server-express to v2.13.1 ([49d214f](https://github.com/tripss/nestjs-query/commit/49d214f47cc2e8ebda56bdf17c052b69ba626ccd))
* **deps:** update dependency pg to v8.1.0 ([42c7d01](https://github.com/tripss/nestjs-query/commit/42c7d01949d339f199b5fb35376a134393f6f4c4))
* **deps:** update dependency pg to v8.2.0 ([6e20417](https://github.com/tripss/nestjs-query/commit/6e2041797f69cd214b59c3ec5c3f4f9068ad9961))


### Features

* **graphql,core:** Add support for custom services and assemblers ([85e8658](https://github.com/tripss/nestjs-query/commit/85e8658c6acd495233cabb576c3458afcb8fff12))





## [0.11.1](https://github.com/tripss/nestjs-query/compare/v0.11.0...v0.11.1) (2020-05-11)


### Features

* **graphql:** Add support for auto-generated federations ([238f641](https://github.com/tripss/nestjs-query/commit/238f641967ea6668dfb7bd9034fec732da7fe38b))





# [0.11.0](https://github.com/tripss/nestjs-query/compare/v0.10.2...v0.11.0) (2020-05-09)


### Bug Fixes

* **deps:** update dependency @apollo/federation to v0.15.0 ([b534056](https://github.com/tripss/nestjs-query/commit/b5340567221624dc5bd096e2c1e7097ac3bcc522))
* **deps:** update dependency apollo-server-express to v2.13.0 ([7525af5](https://github.com/tripss/nestjs-query/commit/7525af5ad2cde82ebb684c75226b4818e7b068fc))


### Features

* **graphql:** Add graphql module ([282c421](https://github.com/tripss/nestjs-query/commit/282c421d0e6f67fe750fa6005f6cb7d960c8fbd0))
* **graphql:** Add relation/connection decorators ([a75cf96](https://github.com/tripss/nestjs-query/commit/a75cf96c18dcc3fb1f8899933959753f66b68d7e))





## [0.10.2](https://github.com/tripss/nestjs-query/compare/v0.10.1...v0.10.2) (2020-05-04)


### Bug Fixes

* **sequelize:** Update sequelize package deps to match hoisted ([c7f5190](https://github.com/tripss/nestjs-query/commit/c7f5190ad1ae3d099cf9709eee36da188a455d13))





## [0.10.1](https://github.com/tripss/nestjs-query/compare/v0.10.0...v0.10.1) (2020-05-02)


### Bug Fixes

* **graphql:** Fix paging to properly check next/previous page ([13c7bd9](https://github.com/tripss/nestjs-query/commit/13c7bd90dae9e5d6ffd33a8813b2cdfcc75ae131))





# [0.10.0](https://github.com/tripss/nestjs-query/compare/v0.9.0...v0.10.0) (2020-04-29)


### Bug Fixes

* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.54 ([d6b7e6c](https://github.com/tripss/nestjs-query/commit/d6b7e6c0b812f637fdc22e5a26e34d1c4b0dc8b3))
* **deps:** update dependency @docusaurus/preset-classic to v2.0.0-alpha.54 ([fae7683](https://github.com/tripss/nestjs-query/commit/fae7683fd8dc845dccf4422cbb518aa1ed954bdf))


### Features

* **sequelize:** Initial Sequelize support ([bfcf436](https://github.com/tripss/nestjs-query/commit/bfcf4368b96617113c0334cd78a8881e4952eb99))
* **sequelize:** More clean up of code ([a72bce5](https://github.com/tripss/nestjs-query/commit/a72bce583862ed1902ee81974d7b530e7caac4d1))





# [0.9.0](https://github.com/tripss/nestjs-query/compare/v0.8.9...v0.9.0) (2020-04-26)


### Bug Fixes

* **docs:** remove unused imports in example page ([a67ac24](https://github.com/tripss/nestjs-query/commit/a67ac24a141953dda0eac4912485e6f79022078a))


### Features

* **typeorm:** Add support for soft deletes ([2ab42fa](https://github.com/tripss/nestjs-query/commit/2ab42faee2802abae4d8496e2529b8eb23860ed4))





## [0.8.9](https://github.com/tripss/nestjs-query/compare/v0.8.8...v0.8.9) (2020-04-24)

**Note:** Version bump only for package nestjs-query





## [0.8.8](https://github.com/tripss/nestjs-query/compare/v0.8.7...v0.8.8) (2020-04-23)

**Note:** Version bump only for package nestjs-query





## [0.8.7](https://github.com/tripss/nestjs-query/compare/v0.8.6...v0.8.7) (2020-04-23)


### Bug Fixes

* **deps:** update dependency pg to v8.0.3 ([6a726e9](https://github.com/tripss/nestjs-query/commit/6a726e9804835a0f512773f918efe4e0c08dded8))





## v0.8.6

* chore(renovate): Renovate to include examples
* chore(renovate): Renovate set ignorePaths to empty
* fix(deps): pin dependencies
* chore(deps): Update package-lock.json
* chore(deps): Update postgres backing app to 11.7
* docs(): Update Federation Docs
* chore(lerna): add hoist to lerna.json
* chore(deps): update dependency @nestjs/graphql to v7.3.4
* chore(deps): update dependency @types/node to v13.13.2
* chore(renovate): Update to automerge devDeps
* chore(deps): update dependency coveralls to v3.0.13
* chore(deps): update dependency eslint-config-prettier to v6.11.0

## v0.8.5

* feat(graphql): basic federation support. 
* docs(graphql): federation docs.

## v0.8.4

* docs(typeorm): Call out foreign keys in entity and DTO [#84](https://github.com/tripss/nestjs-query/issues/84)
* docs(typeorm): Relations on an entity/dto [#85](https://github.com/tripss/nestjs-query/issues/85)
* chore(): upgrade dependencies.

## v0.8.3

* [FIXED]  Add support for extending abstract object types [#82](https://github.com/tripss/nestjs-query/issues/82)

## v0.8.2

* [TESTS] Updated graphql types tests to check schema rather than spies.

## v0.8.1

* [FIXED] Mysql error "LIMIT in subquery" [#77](https://github.com/tripss/nestjs-query/issues/77)
    * Changed `nestjs-query/query-typeorm` to not use subqueries to fetch relations.

## v0.8.0

* [FIXED] Defining additional UpdateDtos breaks Schema. [#72](https://github.com/tripss/nestjs-query/issues/72)

## v0.7.5

* [FIXED] Tables with composite primary keys are not quoted properly.
* [DOCS] Added docs for working with multiple connections [#73](https://github.com/tripss/nestjs-query/pull/73) - [@johannesschobel](https://github.com/johannesschobel)

## v0.7.4

* Fix code formatting
* Update root package.json with common dependencies

## v0.7.3

* [DOCS] Update docs to include a complete example of custom methods [#64](https://github.com/tripss/nestjs-query/issues/64)
* [FIXED] Issue where creating or updating allows specifying primary keys [#65](https://github.com/tripss/nestjs-query/issues/65)

## v0.7.2

* [CHORE] Updated to `@nestjs/graphql` `v7.1.3`
* Removed `PartialType` and `PartialInputType` in favor of `@nestjs/graphql` implementation.

## v0.7.1

* [FIXED] Issue where update input DTO was not automatically created

## v0.7.0

* Updated to `@nestjs/graphql` `v7.x`.
    * This was a passive change for the library usage however you should still follow the migration guide [found here](https://docs.nestjs.com/migration-guide)

## v0.6.0

* [FIXED] Get Underlying Entity Object [#41](https://github.com/tripss/nestjs-query/issues)
    * Changed `TypeOrmQueryService` to operate on the `Entity`
    * Added new `AssemblerQueryService` to translate between the `DTO` and `Entity`
* [ADDED] New `InjectTypeOrmQueryService` decorator to auto-create a TypeOrm query service. 

## v0.5.1

* [DOCS] Added clarification around individual resolvers and relations with examples [#42](https://github.com/tripss/nestjs-query/issues/42)
* [ADDED] Exposed `Relatable` mixin from `@nestjs-query/graphql` [#42](https://github.com/tripss/nestjs-query/issues/42)

## v0.5.0

* Added `decorators` option to resolver options to allow providing custom decorators to endpoints [#36](https://github.com/tripss/nestjs-query/issues/36)

## v0.4.0

* Updated all mutations to take a single `input` argument with custom fields.
    *   `createOne(input: DTO)` -> `createOne(input: { [dtoName]: DTO })`
    *   `createMany(input: DTO[])` -> `createOne(input: { [pluralDTOName]: DTO[] })`
    *   `updateOne(id: ID, input: UpdateDTO)` -> `createOne(input: { id: ID, update: UpdateDTO })`
    *   `updateMany(filter: Filter<DTO>, input: UpdateDTO)` -> `createOne(input: { filter: Filter<DTO>, update: UpdateDTO })`
    *   `deleteOne(input: ID)` -> `deleteOne(input: {id: ID})`
    *   `deleteMany(input: Filter<DTO>)` -> `createOne(input: { filter: Filter<DTO> })`
* Updated docs to reflect changes.

## v0.3.5

* [FIXED] Validate Input for Create & Update [#19](https://github.com/tripss/nestjs-query/issues/19)

## v0.3.4

* [FIXED] Can't remove on Many-To-Many relations [#31](https://github.com/tripss/nestjs-query/issues/31)

## v0.3.3

* Update typescript to 3.8.
* Update dependency versions. 

## v0.3.2

* Switched to github actions 

## v0.3.1

* Hardened TypeORM querying
    * Added filter for entity ids on relations to prevent querying for too many rows.
    * Qualify all filter and sorting columns, to prevent column name collisions. 

## v0.3.0

* Added dataloader support!
* Fixed issue with loading of many-to-many relations [#22](https://github.com/tripss/nestjs-query/issues/22)

## v0.2.1

* Fixed case where `@FilterableField` decorator was not passing arguments correctly to `@Field` decorator [#20](https://github.com/tripss/nestjs-query/issues/20)

## v0.2.0

* Add `Assemblers` to convert DTOs and Entities that are a different shape. See https://tripss.github.io/nestjs-query/docs/concepts/advanced/assemblers

## v0.1.0

* Add `relations` to resolvers. See https://tripss.github.io/nestjs-query/docs/graphql/relations

## v0.0.6

* Dont allow empty filters with `updateMany` or `deleteMany` operations.

## v0.0.5

* Add ability to specify query defaults.
   * `defaultResultSize` -  the default number of results to return from a query
   * `maxResultsSize` -  the maximum number of results to return from a query
   * `defaultSort` -  The default sort to apply to queries
   * `defaultFilter` -  The default filter to apply to queries

## v0.0.4

* Add files field to `@nestjs-query/core` `package.json`

## v0.0.3

* Fix package READMEs
* Add security scanning on sub modules.

## v0.0.2

* Add MIT license

## v0.0.1

* Initial Release
