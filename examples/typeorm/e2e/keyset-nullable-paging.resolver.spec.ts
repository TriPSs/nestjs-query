import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { CursorConnectionType } from '@ptc-org/nestjs-query-graphql'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { TodoItemDTO } from '../src/todo-item/dto/todo-item.dto'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'
import { refresh, truncate } from './fixtures'
import { edgeNodes, pageInfoField } from './graphql-fragments'

const PAGE_SIZE = 2

/**
 * @description
 * A mix of null and non-null descriptions, including a repeated value, seeded in an order that does
 * not match the sort so paging cannot accidentally succeed by following the primary key.
 */
const seededDescriptions = [undefined, 'aaa', undefined, 'ccc', 'bbb', undefined, 'bbb']

describe('Keyset paging over a nullable sort field (typeorm - e2e)', () => {
  let app: INestApplication
  let seededIds: string[]

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

    await app.init()

    const dataSource = app.get(DataSource)
    await truncate(dataSource)

    const todoItems = await dataSource.getRepository(TodoItemEntity).save(
      seededDescriptions.map((description, index) => ({
        title: `Nullable Sort Item ${index + 1}`,
        description,
        completed: false,
        priority: index
      }))
    )
    seededIds = todoItems.map(({ id }) => `${id}`)
  })

  afterAll(() => refresh(app.get(DataSource)))

  const fetchPage = (direction: string, after?: string): Promise<CursorConnectionType<TodoItemDTO>> =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `{
          todoItems(
            paging: { first: ${PAGE_SIZE}${after ? `, after: "${after}"` : ''} }
            sorting: [{ field: description, direction: ${direction} }]
          ) {
            ${pageInfoField}
            ${edgeNodes('id')}
          }
        }`
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.errors).toBeUndefined()
        return body.data.todoItems as CursorConnectionType<TodoItemDTO>
      })

  const pageThroughIds = async (direction: string): Promise<string[]> => {
    const collectedIds: string[] = []
    let after: string | undefined
    for (let requests = 0; requests <= seededDescriptions.length; requests += 1) {
      const { edges, pageInfo } = await fetchPage(direction, after)
      collectedIds.push(...edges.map(({ node }) => `${node.id}`))
      if (!pageInfo.hasNextPage) {
        return collectedIds
      }
      after = pageInfo.endCursor
    }
    throw new Error(`paging never reported the last page sorting ${direction}`)
  }

  const numerically = (ids: string[]): string[] => [...ids].sort((a, b) => Number(a) - Number(b))

  it.each(['ASC', 'DESC'])('should return every row exactly once when paging %s over a nullable sort', async (direction) => {
    const pagedIds = await pageThroughIds(direction)

    expect(pagedIds).toHaveLength(seededIds.length)
    expect(numerically(pagedIds)).toEqual(numerically(seededIds))
  })
})
