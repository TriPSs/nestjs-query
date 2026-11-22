import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { spawn } from 'child_process'
import path from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

import { executeTruncate, typeormOrmConfig } from '../../helpers'
import { GATEWAY_PORT, TODO_ITEM_PORT, USER_PORT } from '../ports'
import { TodoItemEntity } from '../todo-item-graphql/src/todo-item/todo-item.entity'
import { UserEntity } from '../user-graphql/src/user/user.entity'

export interface TestApplications {
  gatewayApp: NestFastifyApplication
  todoItemProcess: ReturnType<typeof spawn>
  userProcess: ReturnType<typeof spawn>
  todoItemDataSource: DataSource
  userDataSource: DataSource
}

// Subgraphs run as child processes: GraphQL type metadata is process-wide and the federated
// `User` type is declared by both subgraphs (real DTO on the user side, reference stub on the
// todo-item side), so they cannot share the jest module registry.
const REPO_ROOT = path.resolve(__dirname, '../../..')

const subgraphEntrypoints: Array<[number, string]> = [
  [TODO_ITEM_PORT, path.join('examples/federation-mercurius/todo-item-graphql/src/main.ts')],
  [USER_PORT, path.join('examples/federation-mercurius/user-graphql/src/main.ts')]
]

const startSubgraph = (port: number, entrypoint: string): ReturnType<typeof spawn> =>
  spawn(process.execPath, ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register', path.join(REPO_ROOT, entrypoint)], {
    cwd: REPO_ROOT,
    // pin CJS: the root tsconfig declares `module: esnext`, and node's native ESM loading of the
    // entry fails on extensionless relative imports depending on the node version/environment
    env: { ...process.env, PORT: String(port), TS_NODE_TRANSPILE_ONLY: '1', TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}' },
    stdio: 'inherit'
  })

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitForSubgraph = async (port: number, child: ReturnType<typeof spawn>): Promise<void> => {
  let exited = false
  child.once('exit', () => {
    exited = true
  })
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`subgraph on port ${port} exited before becoming ready (e.g. port already in use)`)
    }
    try {
      const res = await fetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' })
      })
      if (res.ok) {
        return
      }
    } catch {
      // subgraph not up yet
    }
    await sleep(250)
  }
  throw new Error(`subgraph on port ${port} did not become ready`)
}

export const truncateApplications = async (apps: TestApplications): Promise<void> => {
  await executeTruncate(apps.todoItemDataSource, ['todo_item'])
  await executeTruncate(apps.userDataSource, ['user'])
}

export const startApplications = async (): Promise<TestApplications> => {
  const processes = subgraphEntrypoints.map(([port, entrypoint]) => startSubgraph(port, entrypoint))
  let gatewayApp: NestFastifyApplication | undefined
  let dataSources: DataSource[] = []
  try {
    await Promise.all(subgraphEntrypoints.map(([port], index) => waitForSubgraph(port, processes[index])))

    gatewayApp = (
      await Test.createTestingModule({ imports: [(await import('../gateway/src/app.module')).AppModule] }).compile()
    ).createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    await gatewayApp.listen(GATEWAY_PORT)

    dataSources = await Promise.all(
      [
        ['federation_mercurius_todo_item', [TodoItemEntity]],
        ['federation_mercurius_user', [UserEntity]]
      ].map(async ([database, entities]) =>
        new DataSource({
          ...(typeormOrmConfig(database as string, undefined, {
            synchronize: false,
            dropSchema: false
          }) as DataSourceOptions),
          entities: entities as never[]
        }).initialize()
      )
    )

    return {
      gatewayApp,
      todoItemProcess: processes[0],
      userProcess: processes[1],
      todoItemDataSource: dataSources[0],
      userDataSource: dataSources[1]
    }
  } catch (err) {
    // roll back everything started so far so a failed beforeAll never leaks children or ports
    processes.forEach((p) => p.kill())
    if (gatewayApp) {
      await gatewayApp.close()
    }
    await Promise.allSettled(dataSources.map((ds) => ds.destroy()))
    throw err
  }
}

export const stopApplications = async (apps: TestApplications): Promise<void> => {
  await apps.gatewayApp.close()
  apps.todoItemProcess.kill()
  apps.userProcess.kill()
  await apps.todoItemDataSource.destroy()
  await apps.userDataSource.destroy()
}

export const seedUser = async (apps: TestApplications, name: string): Promise<UserEntity> =>
  apps.userDataSource.getRepository(UserEntity).save({ name, email: `${name.toLowerCase()}@example.com` })

export const seedTodoItem = async (apps: TestApplications, title: string, assigneeId?: number): Promise<TodoItemEntity> =>
  apps.todoItemDataSource.getRepository(TodoItemEntity).save({ title, completed: false, assigneeId })
