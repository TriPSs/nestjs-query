# AGENTS.md

## Repository overview

`nestjs-query` is a TypeScript monorepo for NestJS query libraries. It uses Yarn 4 workspaces and Nx. Reusable libraries live in `packages/`; runnable and end-to-end examples live in `examples/`; the Mintlify documentation site lives in `docs/`.

## Working conventions

- Use Yarn, not npm, for dependency and Nx commands: `yarn nx <target> <project>`.
- Keep changes narrowly scoped. Do not overwrite or revert unrelated working-tree changes.
- Follow the existing TypeScript style: no semicolons and no default exports. Let Prettier and ESLint enforce formatting and import ordering.
- Add or update tests with production-code changes. Unit tests belong in the matching `test/` path and use `*.spec.ts`.
- Update documentation for user-facing features. New documentation pages must also be added to `docs/docs.json`.
- Use Conventional Commits when creating commits, for example `fix(core): handle empty filters`.

## Validation

Prefer the smallest relevant check before broader validation:

```sh
yarn nx lint <project>
yarn nx test <project>
yarn nx build <project>
```

Common projects include `core`, `query-graphql`, `query-rest`, `query-typeorm`, `query-mongoose`, `query-sequelize`, `query-mikro-orm`, and `query-typegoose`. Use `yarn nx show projects` if the applicable project is unclear. E2E checks may require backing services from `examples/docker-compose.yml`.

## Project structure

- `packages/core`: framework-independent query, service, and DTO primitives.
- `packages/query-*`: GraphQL, REST, and persistence-adapter integrations.
- `examples`: integration and end-to-end applications.
- `docs`: Mintlify documentation.
- `tools`: shared tooling and custom ESLint rules.
