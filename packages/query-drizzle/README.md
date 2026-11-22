# @ptc-org/nestjs-query-drizzle

Drizzle ORM adapter for `@ptc-org/nestjs-query-core`.

This package is a proof of concept. It provides a `DrizzleQueryService` that implements
the core `QueryService` contract on top of a Drizzle database instance and table.

```ts
import { DrizzleQueryService } from '@ptc-org/nestjs-query-drizzle'

const service = new DrizzleQueryService({ db, table: users })
```

The database instance is the one you create with `drizzle()` (or receive from
`@nestjs/drizzle` via `@InjectDrizzle()`). Pass `relationsKey` when you want to use
the relational query API for reading relations; the value is the key of the table in
your `defineRelations()` schema.

- Supported: CRUD, basic filters, sorting, offset paging, read relations.
- Not supported yet: relation mutations (`addRelations`/`setRelations`/`removeRelations`)
  and aggregations; both throw `NotImplementedException`.
