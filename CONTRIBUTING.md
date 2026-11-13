# Contributing to Nestjs-Query

Thank you for taking the time to contribute! Before opening an issue or pull request, please review the [Code of Conduct](CODE_OF_CONDUCT.md). Be considerate: this project is maintained by people contributing their time.

## Issues

Use [GitHub Issues](https://github.com/TriPSs/nestjs-query/issues) for bug reports and feature requests. Search existing issues first, then provide one bug or feature per issue.

Bug reports should include:

- A concise description of the problem.
- Steps to reproduce and a minimal reproducible example.
- The NestJS, Nestjs-Query, Node.js, and package versions involved.
- The expected and actual behavior.

Feature requests should explain the use case, proposed behavior, and why it belongs in the library. A feature may be declined if it does not fit the project’s direction.

## Development setup

The repository is a Yarn 4 workspace managed with Isox. Use Node.js 24+ and run:

```bash
yarn install --immutable
```

Use `yarn isox plan --all --target=build` to list available projects. Common package names include `core`, `query-graphql`, `query-rest`, `query-mikro-orm`, `query-mongoose`, `query-sequelize`, `query-typegoose`, and `query-typeorm`.

## Tests and checks

Run the smallest relevant checks while developing:

```bash
yarn isox lint <project>
yarn isox test <project>
yarn isox build <project>
```

TypeScript projects share `tsconfig.base.json` with ES2022, NodeNext, and strict checking. Each library uses `tsconfig.json` for editor checks, `tsconfig.build.json` to compile `src/` into `dist/packages/<project>`, and `tsconfig.spec.json` for tests. Nest decorator metadata is enabled in the shared base; Vitest reads the same compiler settings.

To typecheck all library source, examples, and tests without emitting files:

```bash
yarn tsc --project tsconfig.spec.json
```

For all packages:

```bash
yarn isox run-many --target=lint
yarn isox run-many --target=test
yarn isox run-many --target=build
```

The standard E2E suite requires Docker services:

```bash
yarn docker up -d
yarn isox e2e examples
```

Stop the services when finished with `yarn docker down`.

Unit tests belong in the matching `__tests__/` path and use the `*.spec.ts` naming convention. They should not depend on persistent external storage; use an E2E test for full-stack behavior.

## Pull requests

Before opening a pull request:

- Link the issue, or include the context normally requested in a bug report or feature request.
- Keep the change focused and update tests for production-code changes.
- Update documentation for user-facing changes. New Mintlify pages must be added to `docs/docs.json`.
- Run the relevant lint, test, and build checks.
- Explain the behavior changed and any compatibility or migration considerations.

Pull requests should be opened against `master`. Automated checks must pass before a change can be merged.

## Adding an E2E example

Only add a new example when an existing example cannot cover the behavior. New examples belong in `examples/`, must be registered in `examples/nest-cli.json`, and should include their modules and tests. Database-backed examples may also need initialization scripts under `examples/init-scripts/mysql` or `examples/init-scripts/postgres`.

## Documentation

Documentation is built with [Mintlify](https://mintlify.com/). To preview changes locally:

```bash
cd docs
yarn dlx mint dev
```

Place pages in the directory matching their subject (`introduction`, `concepts`, `graphql`, `rest`, `persistence`, `utilities`, or `migration-guides`) and add every new page to `docs/docs.json`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>(<scope>): <subject>
```

Common types are `feat`, `fix`, `docs`, `refactor`, `test`, `style`, and `chore`. Use a `BREAKING CHANGE` footer when applicable.
