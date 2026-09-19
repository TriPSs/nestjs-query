# Mercurius subscriptions support — design

Date: 2026-09-19
Package: `@ptc-org/nestjs-query-graphql`
Status: approved

## Problem

`@ptc-org/nestjs-query-graphql` works with the Mercurius driver (`@nestjs/mercurius`) for queries and mutations, but users report subscriptions as incompatible. The observed failure is an exception because Mercurius's `PubSub` has no `asyncIterableIterator()` method, unlike Apollo's `graphql-subscriptions` `PubSub` that the library's `GraphQLPubSub` interface expects.

## Research findings (verified against sources)

- `@nestjs/graphql` generates subscription resolvers driver-agnostically (`resolvers-explorer.service.ts`): the field callback is `{ resolve?, subscribe }`. With a `filter` option, `subscribe` comes from the driver's `subscriptionWithFilter`, implemented by both the Apollo and Mercurius drivers (`MercuriusDriver.subscriptionWithFilter` wraps `mercurius.withFilter`).
- Mercurius executes subscriptions through standard graphql-js `subscribe()` (`mercurius/lib/subscription-connection.js`, `_executeSubscription`). Any async iterable returned by the subscription resolver works, regardless of its origin.
- The library's subscription machinery (publish in `create.resolver.ts`/`update.resolver.ts`/`delete.resolver.ts`, iterator in `*Subscription()`, auth topic suffixing in `helpers.ts`) is self-consistent: it publishes and subscribes on the same injected `GraphQLPubSub` and never touches the server's own pubsub.
- The incompatibility comes from mixing buses: following the NestJS Mercurius docs pattern (`@Context('pubsub')` + `pubSub.subscribe(topic)` / `pubSub.publish({ topic, payload })`) and injecting that instance into the library's `pubSub` option breaks the `GraphQLPubSub` contract.

## Decision

Reach parity with the Apollo experience with zero library code changes, proven end-to-end:

1. Example app `examples/subscriptions-mercurius`: Fastify + `@nestjs/mercurius` + `subscription: true` in `MercuriusDriverConfig`, the library's default pubsub, `enableSubscriptions: true`. Includes an e2e spec exercising mutation → WebSocket event delivery, with and without client `filter`.
2. Docs: a Mercurius section in `docs/graphql/subscriptions.mdx` covering the required config, the two-bus pitfall, multi-instance Redis via the existing `pubSub` option (`graphql-redis-subscriptions`, same pattern as Apollo), and the federation limitation.
3. Conditional fallback: if (and only if) the e2e proves an actual incompatibility, add a `MercuriusPubSubAdapter` to `packages/query-graphql/src/subscription/` implementing the existing `GraphQLPubSub` interface over an mqemitter-compatible emitter (structural typing, no new peer dependency), shared between Mercurius (`subscription: { emitter }`) and the library's `pubSub` option.
4. Cleanup: delete the superseded, premise-flawed `MERCURIUS_INTEGRATION_PLAN.md` (it wrongly claims `GqlExecutionContext` is Apollo-specific and over-plans driver adapters).

## Out of scope

- Federation support under Mercurius (Mercurius federation uses `@mercuriusjs/gateway`; Apollo-specific resolver code stays as is).
- Bridging to `app.graphql.pubsub` (lazy resolution, fragile timing, no Redis benefit over `graphql-redis-subscriptions`).
- Any change to the default pubsub or resolver generation.

## Risks

- Interceptors (`AuthorizerInterceptor`, `HookInterceptor`) run during WS subscription setup under Mercurius; context shape differs slightly from Apollo WS (`request` vs `req`). The e2e validates this; default authorizers do not depend on the HTTP request.
- The e2e WS client must speak Mercurius's `graphql-ws` subprotocol (`connection_init` / `subscribe` / `next` messages).

## Validation

- `yarn nx test query-graphql` (baseline green; `federation-reference.spec.ts` is a known pre-existing flake).
- Example e2e spec passing (mutation → subscription delivery, filter applied).
- Lint/build of touched projects.
