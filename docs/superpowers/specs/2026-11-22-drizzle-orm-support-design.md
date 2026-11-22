# Drizzle ORM support — feasibility design

Date: 2026-11-22
Status: POC validated (40 tests green: lint, test, build via isox)
Worktree: `.worktrees/feat-drizzle-orm` (branch `feat/drizzle-orm-support`, based on `feat/nestjs-12-support`)

## Verdict

A `query-drizzle` adapter for `@ptc-org/nestjs-query-core` is feasible. The POC implements
CRUD, the full filter surface (18 operators, nested `and`/`or`) and read relations
(`findRelation`, `queryRelations`, `countRelations`) against SQLite in memory, on top of
Drizzle 1.0.0-rc.5. It ships as `packages/query-drizzle` (~600 lines of src, ~700 of tests).

## Architecture of the POC

- `DrizzleQueryService<DTO, C, U> extends NoOpQueryService` — only implements what it
  supports; everything else (relation mutations, aggregates) rejects with
  `NotImplementedException` for free from the NoOp base.
- Constructed with `{ db, table, relationsKey? }`:
  - `db`: any drizzle instance (deliberate `any` boundary — drizzle generics are
    dialect-specific). Works with the db from `@nestjs/drizzle` `@InjectDrizzle()`.
  - `table`: the drizzle table object. No `forFeature()`, no decorators, no entity
    metadata: primary key is auto-detected via `getTableColumns(table)`.
  - `relationsKey`: the key of the table in the `defineRelations()` schema, required only
    for relation reads through the relational query API (`db.query.<key>`).
- Two filter mappers:
  - `Filter<DTO>` → SQL expressions (drizzle `eq/gt/like/...`) for the main table CRUD.
  - `Filter<DTO>` → RQB v2 object filter for relation reads (see findings).

## Findings that shape the design

1. **`drizzle()` positional API silently breaks with rc.5.** Passing a `Database`
   instance positionally (`drizzle(client)`) is destructured as a config object, so
   drizzle builds a *new* client — with `:memory:` that means an empty database and
   `no such table` errors. The supported call is `drizzle({ client, relations })`.
   Document this in the package README and docs.
2. **The `rc` dist-tag points to a version that is not published** (`1.0.0-rc.6`); the
   newest published release is `1.0.0-rc.5-ab785fc` (rc.5 published 3× with hashes).
   Pin exact versions in devDependencies; keep the peer range loose (`^1.0.0-rc.5`).
3. **RQB v2 `where` rejects SQL and callbacks in practice** (runtime error
   `Unknown relational filter field: "decoder"` — the parser walks the SQL object).
   Object filters are the only supported form. Grouping keys are **uppercase**
   `AND` / `OR` / `NOT` (Prisma-style), plus a `RAW` escape hatch.
4. **No `between` operator at field level in RQB v2 object filters**; compose it:
   `between: [a, b]` → `{ AND: [{ gte: a }, { lte: b }] }`,
   `notBetween` → `{ OR: [{ lt: a }, { gt: b }] }`.
5. **SQL NULL semantics for negated operators**: `neq`, `notIn`, `notBetween` exclude
   rows where the column is NULL (`NULL != x` is NULL). This matches the TypeORM
   adapter; tests encode it explicitly. `is: null` / `isNot: null` map to
   `IS NULL` / `IS NOT NULL` (RQB: `{ isNull: true }` / `{ isNotNull: true }`).
6. **No cross-dialect `ILIKE`**: mapped to `LIKE` for both builders. `LIKE` is already
   ASCII case-insensitive on SQLite and MySQL; a Postgres build needs a per-dialect
   `lower()` mapping (see `shortcut` comments in `drizzle-query.service.ts`).
7. **Relation reads are cheap to implement** (the `defineRelations()` object is reused
   as-is through `db.query`), but `countRelations` currently loads the related rows and
   counts them (`shortcut` comment) — upgrade to a SQL COUNT aggregate in phase 2+.
8. **`@nestjs/drizzle` integration is trivial**: the adapter takes the injected db; no
   connection management, no module wiring needed.

## Not implemented (by design)

- `addRelations`, `setRelations`, `removeRelations`: Drizzle offers nothing for relation
  mutation; it requires manual FK/junction-table SQL. This is the biggest remaining
  chunk (the TypeORM relation service is ~520 lines). Core's NoOp base already rejects
  these calls.
- `aggregate` / `aggregateRelations`: SQL `count/sum/avg/min/max` + `groupBy` are
  available in drizzle; straightforward but out of POC scope.
- Soft delete / `withDeleted`, `SortNulls` in ORDER BY, cursor paging: later phases.

## Phasing (full adapter, estimated from the TypeORM adapter's ~2.7k src / ~4.3k test)

| Phase | Content | Notes |
| --- | --- | --- |
| 1 — POC (done) | CRUD, filters, read relations | this branch |
| 2 | Aggregates + SQL COUNT for countRelations + SortNulls + cursor paging | mechanical |
| 3 | Relation mutations (FK first, then junction tables) | the big one, pure SQL |
| 4 | e2e example (`examples/drizzle/`, Postgres + docker-compose) | copies existing patterns |
| 5 | Docs page (`docs/` + `docs/docs.json`), README, publish alpha | |

## Risks

- **Drizzle v1 is release-candidate**: the RQB v2 object-filter rules (uppercase
  grouping keys, no SQL in `where`) are recent and may still move. Phasing keeps the
  blast radius small; the POC pins rc.5 to make drift visible.
- **`any` boundary**: the db handle is intentionally loose. Fine for the POC; if the
  package grows, consider a minimal structural interface per dialect instead.
- **Dialect coverage**: tests run on SQLite only. Postgres should work unchanged
  (the builders are dialect-agnostic) but is unproven until phase 4.
