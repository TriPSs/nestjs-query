# Mercurius subscriptions support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove and document that nestjs-query subscriptions work with the Mercurius driver without library changes, via a runnable example app with a WS e2e spec.

**Architecture:** No changes to `packages/query-graphql`. Add an example app (`examples/subscriptions-mercurius`) using Fastify + `@nestjs/mercurius` with `subscription: true` and the library's default pubsub. An e2e spec drives mutations over HTTP and asserts events over a raw WebSocket client speaking Mercurius's `graphql-ws` protocol. Docs cover config, the two-bus pitfall, and Redis.

**Tech Stack:** NestJS 11, `@nestjs/graphql` 13, `@nestjs/mercurius` 13.4.5, `mercurius` 16, `@nestjs/platform-fastify` 11, TypeORM + postgres (docker), jest 30, `ws`.

## Global Constraints

- Worktree: `/Users/zacharyvolpi/dev/perso/nestjs-query/.worktrees/feat-mercurius-subscriptions` (branch `feat/mercurius-subscriptions`).
- Node: `export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 24.16.0` before every yarn/nx/jest command (native builds fail on Node 20).
- Package manager: Yarn 4 only (`yarn nx <target> <project>`), never npm.
- TypeScript style: no semicolons, no default exports; let ESLint/Prettier enforce the rest.
- Commit identity is already configured worktree-scoped: `Goopil <hello@zvolpi.ch>`, GPG off. Use Conventional Commits.
- Example e2e DB: postgres via `docker compose -f examples/docker-compose.yml up -d postgres` (host port 5436).
- E2E specs live under `examples/<app>/e2e/*.spec.ts` (matched by `jest.e2e.ts`). Run a single example's e2e with: `yarn nx e2e examples --testPathPatterns=subscriptions-mercurius`.
- The library `GraphQLPubSub` interface (`packages/query-graphql/src/subscription/pub-sub.interface.ts`) requires `publish(trigger, payload)`, `subscribe`, `unsubscribe`, `asyncIterableIterator(triggers)`.

---

### Task 1: Mercurius dependencies + example app source

**Files:**

- Modify: `package.json` (root, devDependencies)
- Create: `examples/subscriptions-mercurius/src/todo-item/todo-item.entity.ts`
- Create: `examples/subscriptions-mercurius/src/todo-item/dto/todo-item.dto.ts`
- Create: `examples/subscriptions-mercurius/src/todo-item/dto/todo-item-input.dto.ts`
- Create: `examples/subscriptions-mercurius/src/todo-item/dto/todo-item-update.dto.ts`
- Create: `examples/subscriptions-mercurius/src/todo-item/todo-item.module.ts`
- Create: `examples/subscriptions-mercurius/src/app.module.ts`
- Create: `examples/subscriptions-mercurius/src/main.ts`

**Interfaces:**

- Consumes: `formatGraphqlError`, `typeormOrmConfig` from `examples/helpers` (postgres on port 5436); `NestjsQueryGraphQLModule.forFeature` with `enableSubscriptions` (same contract as `examples/subscriptions`).
- Produces: `AppModule` (examples/subscriptions-mercurius) bootable under Fastify + Mercurius with WS subscriptions enabled — consumed by Task 2's e2e.

- [ ] **Step 1: Add devDependencies to root `package.json`**

Add to `devDependencies` (keep alphabetical placement):

```json
"@nestjs/mercurius": "^13.4.5",
"@nestjs/platform-fastify": "^11.1.0",
"mercurius": "^16.10.0",
"ws": "^8.18.0",
```

(`@types/ws` 8.18.1 already present.)

- [ ] **Step 2: Install**

```bash
export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 24.16.0
yarn install
```

Expected: completes without native build errors (fastify/mercurius are pure JS).

- [ ] **Step 3: Create the todo-item module (simplified, no relations)**

`examples/subscriptions-mercurius/src/todo-item/todo-item.entity.ts`:

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'todo_item' })
export class TodoItemEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({ nullable: true })
  description?: string

  @Column()
  completed!: boolean

  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  updated!: Date
}
```

`examples/subscriptions-mercurius/src/todo-item/dto/todo-item.dto.ts`:

```ts
import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'

@ObjectType('TodoItem')
export class TodoItemDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField()
  completed!: boolean

  @FilterableField(() => GraphQLISODateTime)
  created!: Date

  @FilterableField(() => GraphQLISODateTime)
  updated!: Date
}
```

`examples/subscriptions-mercurius/src/todo-item/dto/todo-item-input.dto.ts`:

```ts
import { Field, InputType } from '@nestjs/graphql'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

@InputType('TodoItemInput')
export class TodoItemInputDTO {
  @IsString()
  @MaxLength(20)
  @Field()
  title!: string

  @IsBoolean()
  @Field()
  completed!: boolean

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  description?: string
}
```

`examples/subscriptions-mercurius/src/todo-item/dto/todo-item-update.dto.ts`:

```ts
import { Field, InputType } from '@nestjs/graphql'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

@InputType('TodoItemUpdate')
export class TodoItemUpdateDTO {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Field({ nullable: true })
  title?: string

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  completed?: boolean
}
```

`examples/subscriptions-mercurius/src/todo-item/todo-item.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemEntity } from './todo-item.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          CreateDTOClass: TodoItemInputDTO,
          UpdateDTOClass: TodoItemUpdateDTO,
          enableSubscriptions: true,
          update: { many: { enableSubscriptions: false } },
          delete: { many: { enableSubscriptions: false } }
        }
      ]
    })
  ]
})
export class TodoItemModule {}
```

- [ ] **Step 4: Create app.module.ts and main.ts**

`examples/subscriptions-mercurius/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { typeormOrmConfig } from '../../helpers'
import { TodoItemModule } from './todo-item/todo-item.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('subscription_mercurius')),
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      subscription: true,
      autoSchemaFile: 'examples/subscriptions-mercurius/schema.gql'
    }),
    TodoItemModule
  ]
})
export class AppModule {}
```

`examples/subscriptions-mercurius/src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true
    })
  )

  await app.listen(3001)
}

// eslint-disable-next-line no-void
void bootstrap()
```

- [ ] **Step 5: Lint the examples project and fix style issues**

```bash
yarn nx lint examples
```

Expected: no errors (no semicolons, ordered imports).

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock examples/subscriptions-mercurius
git commit -m "feat(examples): add mercurius subscriptions example app"
```

---

### Task 2: E2E spec — mutation → WS event delivery (the proof)

**Files:**

- Create: `examples/subscriptions-mercurius/e2e/ws.helper.ts`
- Create: `examples/subscriptions-mercurius/e2e/fixtures.ts`
- Create: `examples/subscriptions-mercurius/e2e/todo-item.resolver.spec.ts`

**Interfaces:**

- Consumes: `AppModule` from Task 1; `executeTruncate` from `examples/helpers`; postgres on 5436.
- Produces: e2e proof that the default pubsub delivers events under Mercurius, including client `filter`. If these tests fail for reasons other than spec bugs → trigger Plan B (appendix).

- [ ] **Step 1: Start postgres**

```bash
docker compose -f examples/docker-compose.yml up -d postgres
```

Verify: `nc -z localhost 5436` succeeds.

- [ ] **Step 2: Write the WS client helper**

`examples/subscriptions-mercurius/e2e/ws.helper.ts`:

```ts
import WebSocket from 'ws'

export interface SubscriptionClient {
  subscribe(query: string, variables?: Record<string, unknown>): string
  next(timeoutMs?: number): Promise<{ id: string; payload: { data?: Record<string, unknown>; errors?: unknown[] } }>
  expectNoEvents(timeoutMs?: number): Promise<void>
  close(): Promise<void>
}

export const createSubscriptionClient = async (httpUrl: string): Promise<SubscriptionClient> => {
  const socket = new WebSocket(`${httpUrl.replace('http', 'ws')}/graphql`, 'graphql-ws')

  await new Promise<void>((resolve, reject) => {
    socket.on('open', () => socket.send(JSON.stringify({ type: 'connection_init', payload: {} })))

    const onInit = (raw: WebSocket.RawData): void => {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'connection_ack') {
        socket.off('message', onInit)
        resolve()
      } else if (msg.type === 'connection_error') {
        reject(new Error(JSON.stringify(msg.payload)))
      }
    }
    socket.on('message', onInit)
    socket.on('error', reject)
  })

  const received: Array<{ id: string; payload: { data?: Record<string, unknown>; errors?: unknown[] } }> = []
  const waiters: Array<(msg: { id: string; payload: { data?: Record<string, unknown>; errors?: unknown[] } }) => void> = []
  let subscriptionCount = 0

  socket.on('message', (raw: WebSocket.RawData) => {
    const msg = JSON.parse(raw.toString())
    if (msg.type === 'data') {
      if (waiters.length > 0) {
        waiters.shift()(msg)
      } else {
        received.push(msg)
      }
    }
  })

  return {
    subscribe(query, variables) {
      const id = `sub-${++subscriptionCount}`
      socket.send(JSON.stringify({ type: 'start', id, payload: { query, variables } }))
      return id
    },
    next(timeoutMs = 5000) {
      if (received.length > 0) {
        return Promise.resolve(received.shift())
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for subscription event')), timeoutMs)
        waiters.push((msg) => {
          clearTimeout(timer)
          resolve(msg)
        })
      })
    },
    async expectNoEvents(timeoutMs = 500) {
      await new Promise((resolve) => setTimeout(resolve, timeoutMs))
      expect(received).toHaveLength(0)
    },
    close() {
      return new Promise((resolve) => {
        socket.on('close', resolve)
        socket.close()
      })
    }
  }
}
```

- [ ] **Step 3: Write fixtures**

`examples/subscriptions-mercurius/e2e/fixtures.ts`:

```ts
import { DataSource } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'

const tables = ['todo_item']

export const truncate = async (connection: DataSource): Promise<void> => executeTruncate(connection, tables)

export const refresh = async (connection: DataSource): Promise<void> => {
  await truncate(connection)

  await connection.getRepository(TodoItemEntity).save([
    { title: 'Seed One', completed: true },
    { title: 'Seed Two', completed: false }
  ])
}
```

- [ ] **Step 4: Write the e2e spec**

`examples/subscriptions-mercurius/e2e/todo-item.resolver.spec.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { createSubscriptionClient } from './ws.helper'
import { refresh } from './fixtures'

describe('TodoItemResolver subscriptions (mercurius - e2e)', () => {
  let app: INestApplication
  let url: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
        forbidUnknownValues: true
      })
    )

    await app.listen(0)
    url = await app.getUrl()
  })

  afterAll(async () => {
    await refresh(app.get(DataSource))
    await app.close()
  })

  const createTodo = (input: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { input },
        query: `mutation createTodo($input: TodoItemInput!) {
          createOneTodoItem(input: { todoItem: $input }) { id title completed }
        }`
      })
      .expect(200)

  it('should deliver created events over the websocket', async () => {
    await refresh(app.get(DataSource))
    const client = await createSubscriptionClient(url)

    client.subscribe(`subscription {
      createdTodoItem { id title completed }
    }`)

    const response = await createTodo({ title: 'Ws Created', completed: false })

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.createdTodoItem.title).toBe('Ws Created')
    expect(response.body.data.createOneTodoItem.title).toBe('Ws Created')

    await client.close()
  })

  it('should apply the client filter to created events', async () => {
    await refresh(app.get(DataSource))
    const client = await createSubscriptionClient(url)

    client.subscribe(`subscription {
      createdTodoItem(input: { filter: { title: { eq: "Matching" } } }) { id title completed }
    }`)

    await createTodo({ title: 'Not Matching', completed: false })
    await client.expectNoEvents()

    await createTodo({ title: 'Matching', completed: false })

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.createdTodoItem.title).toBe('Matching')

    await client.close()
  })

  it('should apply authorization scoping through the subscription resolvers', async () => {
    await refresh(app.get(DataSource))
    const client = await createSubscriptionClient(url)

    client.subscribe(`subscription {
      updatedOneTodoItem { id title }
    }`)

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { id: 1, input: { completed: true } },
        query: `mutation updateTodo($id: ID!, $input: TodoItemUpdate!) {
          updateOneTodoItem(input: { id: $id, update: $input }) { id completed }
        }`
      })
      .expect(200)

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.updatedOneTodoItem.id).toBe('1')

    client.subscribe(`subscription { deletedOneTodoItem { id } }`)
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { id: 1 },
        query: `mutation deleteTodo($id: ID!) { deleteOneTodoItem(input: { id: $id }) { id } }`
      })
      .expect(200)

    const deletedEvent = await client.next()
    expect(deletedEvent.payload.errors).toBeUndefined()

    await client.close()
  })
})
```

Notes for the implementer:

- `updateOneTodoItem`/`deleteOneTodoItem` arg shapes follow the generated CRUD SDL (`input: { id, update }` / `input: { id }`). If the mutation errors, inspect `response.body.errors` first — do not guess shapes.
- `deleteManyTodoItem`/`updateManyTodoItem` subscriptions are disabled in the module; only `one` subscriptions exist for update/delete.
- ID fields serialize as strings over GraphQL.

- [ ] **Step 5: Run the e2e and iterate**

```bash
yarn nx e2e examples --testPathPatterns=subscriptions-mercurius
```

Expected: all 3 tests PASS. This is the hypothesis proof.

- If `connection_error`/400 on subscribe: inspect the SDL (add `?` on generated names) — the subscription field names are `createdTodoItem`, `updatedOneTodoItem`, `deletedOneTodoItem`.
- If events never arrive or the filter is ignored → document the exact failure in the task report and trigger Plan B (appendix).
- If lint fails on the spec, fix style (no semicolons, import order).

- [ ] **Step 6: Commit**

```bash
git add examples/subscriptions-mercurius/e2e
git commit -m "test(examples): add mercurius subscriptions e2e spec"
```

---

### Task 3: Docs — Mercurius section in subscriptions.mdx

**Files:**

- Modify: `docs/graphql/subscriptions.mdx`

**Interfaces:**

- Consumes: nothing.
- Produces: user documentation matching the validated example. `docs/docs.json` needs NO change (section within the existing `graphql/subscriptions` page).

- [ ] **Step 1: Add a "Subscriptions with Mercurius" section**

Append at the end of `docs/graphql/subscriptions.mdx` (match the existing heading level and tone):

````markdown
## Subscriptions with Mercurius

The library's subscriptions work with the [Mercurius](https://mercurius.dev/) driver without any changes. Mercurius consumes the async iterable returned by the subscription resolvers directly, so the same publish/subscribe flow used with Apollo applies.

Enable subscriptions on the Mercurius driver:

```typescript
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius'

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      subscription: true, // required to enable the WebSocket endpoint
      autoSchemaFile: 'schema.gql'
    }),
    NestjsQueryGraphQLModule.forFeature({
      /* ... */
      resolvers: [{ DTOClass: TodoItemDTO, EntityClass: TodoItemEntity, enableSubscriptions: true }]
    })
  ]
})
export class AppModule {}
```

Run your app with the Fastify adapter:

```typescript
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())
await app.listen(3000)
```

> warning **Note** Do not inject Mercurius's own pubsub (`@Context('pubsub')`) into the module's `pubSub` option. Its API differs from `graphql-subscriptions` (`publish({ topic, payload })`, `subscribe(topic)` returning a queue, no `asyncIterableIterator`), which causes runtime exceptions. The library's default in-memory pubsub — or any `GraphQLPubSub`-compatible implementation such as `graphql-redis-subscriptions` — works as is, because the library publishes and subscribes on its own bus.

For multi-instance deployments, provide a Redis-backed pubsub through the existing `pubSub` option, the same way as with the Apollo driver (see [the custom pubsub section](#custom-pubsub)).

> warning **Note** Apollo Federation resolvers (`@ResolveReference`) are not supported with the Mercurius driver. Federation requires the Apollo drivers.

A complete runnable example lives in [`examples/subscriptions-mercurius`](https://github.com/tripss/nestjs-query/tree/master/examples/subscriptions-mercurius).
````

- [ ] **Step 2: Verify the anchor and tone**

Read the final file: the new section must follow an existing `##` heading, and the `#custom-pubsub` anchor must exist in the page (adjust the anchor to the page's actual "custom pubsub" heading id if it differs).

- [ ] **Step 3: Commit**

```bash
git add docs/graphql/subscriptions.mdx
git commit -m "docs: document mercurius subscriptions support"
```

---

### Task 4: Cleanup + final validation

**Files:**

- Delete (main checkout, untracked file): `/Users/zacharyvolpi/dev/perso/nestjs-query/MERCURIUS_INTEGRATION_PLAN.md`

**Interfaces:**

- Consumes: all previous tasks green.
- Produces: clean branch ready for PR.

- [ ] **Step 1: Delete the superseded plan file**

```bash
rm /Users/zacharyvolpi/dev/perso/nestjs-query/MERCURIUS_INTEGRATION_PLAN.md
```

(The file is untracked in the main checkout — no commit needed.)

- [ ] **Step 2: Run final validation in the worktree**

```bash
export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 24.16.0
yarn nx lint examples query-graphql
yarn nx test query-graphql
yarn nx e2e examples --testPathPatterns=subscriptions-mercurius
```

Expected: green (the `federation-reference.spec.ts` flake may need one retry — it is a known pre-existing flake, unrelated).

- [ ] **Step 3: Summarize branch state**

```bash
git log --oneline master..HEAD
git status --short
```

Report the commit list to the user; do not push.

---

## Appendix — Plan B (ONLY if Task 2 proves a real incompatibility)

Do NOT implement unless the e2e fails with events not delivered / filter ignored. Adds a `MercuriusPubSubAdapter` to `packages/query-graphql`.

**Files:**

- Create: `packages/query-graphql/src/subscription/mercurius-pubsub.adapter.ts`
- Create: `packages/query-graphql/__tests__/subscription/mercurius-pubsub.adapter.spec.ts`
- Modify: `packages/query-graphql/src/subscription/index.ts` and `packages/query-graphql/src/index.ts` (re-exports)

**Adapter code** (structural typing on the mqemitter contract — no new peer dependency):

```ts
import { GraphQLPubSub } from './pub-sub.interface'

export interface MercuriusEmitter {
  emit(event: { topic: string; payload: unknown }, done: (err?: Error | null) => void): void
  on(
    topic: string,
    listener: (message: { topic: string; payload: unknown }, done: () => void) => void,
    done: (err?: Error | null) => void
  ): void
  removeListener(topic: string, listener: (message: { topic: string; payload: unknown }, done: () => void) => void): void
}

type MercuriusMessage = { topic: string; payload: unknown }
type MercuriusListener = (message: MercuriusMessage, done: () => void) => void

export class MercuriusPubSubAdapter implements GraphQLPubSub {
  private readonly emitter: MercuriusEmitter
  private readonly listeners = new Map<string, Set<MercuriusListener>>()

  constructor(emitter: MercuriusEmitter) {
    this.emitter = emitter
  }

  publish(triggerName: string, payload: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emitter.emit({ topic: triggerName, payload }, (err) => (err ? reject(err) : resolve()))
    })
  }

  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    const triggerNames = Array.isArray(triggers) ? triggers : [triggers]
    const queue: T[] = []
    const waiters: Array<(result: IteratorResult<T>) => void> = []
    let done = false

    const listeners = triggerNames.map((trigger) => {
      const listener: MercuriusListener = (message, cb) => {
        if (done) return cb()
        if (waiters.length > 0) {
          waiters.shift()({ value: message.payload as T, done: false })
        } else {
          queue.push(message.payload as T)
        }
        cb()
      }
      this.addListener(trigger, listener)
      return listener
    })

    const cleanup = (): void => {
      if (done) return
      done = true
      listeners.forEach((listener, index) => this.removeListener(triggerNames[index], listener))
      waiters.forEach((resolve) => resolve({ value: undefined as unknown as T, done: true }))
      waiters.length = 0
    }

    return {
      next: () => {
        if (queue.length > 0) return Promise.resolve({ value: queue.shift() as T, done: false })
        if (done) return Promise.resolve({ value: undefined as unknown as T, done: true })
        return new Promise((resolve) => waiters.push(resolve))
      },
      return: () => {
        cleanup()
        return Promise.resolve({ value: undefined as unknown as T, done: true })
      },
      [Symbol.asyncIterator]: () => this.asyncIterableIterator<T>(triggerNames)
    }
  }

  subscribe(triggerName: string, onMessage: (message: { topic: string; payload: unknown }) => void): () => void {
    const listener: MercuriusListener = (message, cb) => {
      onMessage(message)
      cb()
    }
    this.addListener(triggerName, listener)
    return () => this.removeListener(triggerName, listener)
  }

  unsubscribe(): void {
    // tracked via the returned unsubscribe functions from subscribe()
  }

  private addListener(trigger: string, listener: MercuriusListener): void {
    const set = this.listeners.get(trigger) ?? new Set<MercuriusListener>()
    set.add(listener)
    this.listeners.set(trigger, set)
    this.emitter.on(trigger, listener, () => undefined)
  }

  private removeListener(trigger: string, listener: MercuriusListener): void {
    const set = this.listeners.get(trigger)
    if (!set) return
    set.delete(listener)
    this.emitter.removeListener(trigger, listener)
    if (set.size === 0) this.listeners.delete(trigger)
  }
}
```

**Wiring in the example (Plan B case):** create one emitter, share it:

```ts
// app.module.ts additions
import { mq } from 'mqemitter'
import { MercuriusPubSubAdapter } from '@ptc-org/nestjs-query-graphql'
import { pubSubToken } from '@ptc-org/nestjs-query-graphql'

const emitter = mq()

GraphQLModule.forRoot<MercuriusDriverConfig>({
  driver: MercuriusDriver,
  subscription: { emitter }
}),
```

and in the feature module: `NestjsQueryGraphQLModule.forFeature({ ..., pubSub: { provide: pubSubToken(), useValue: new MercuriusPubSubAdapter(emitter) } })`. Adds `mqemitter` as a root devDependency.

**Plan B tests:** unit spec publishing through `mq()` and asserting `asyncIterableIterator` yields payloads across multiple triggers and ends on `return()`.
