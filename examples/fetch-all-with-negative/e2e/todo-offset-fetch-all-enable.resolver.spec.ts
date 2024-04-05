import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { OffsetConnectionType } from '@ptc-org/nestjs-query-graphql'
import request from 'supertest'
import { Connection } from 'typeorm'

import { AppModule } from '../src/app.module'
import { TodoItemOffsetFetchWithNegativeEnableDTO } from '../src/todo-item/dto/todo-item-offset-fetch-all-enable.dto'
import { refresh, todoItems } from './fixtures'
import { nodes as graphqlNodes, offsetPageInfoField, todoItemFields } from './graphql-fragments'

describe('TodoItemResolver (offset pagination - fetch all with negative enabled)', () => {
  let app: INestApplication

  const describeIf = (condition: boolean) => (condition ? describe : describe.skip)

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
        forbidUnknownValues: true
      })
    )

    await app.init()
    await refresh(app.get(Connection))
  })

  afterAll(() => refresh(app.get(Connection)))

  describe('query', () => {
    describe('paging', () => {
      it('should return all the nodes', () =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            operationName: null,
            variables: {},
            query: `{
            todoItemOffsetFetchWithNegativeEnables(paging: {limit: -1}) {
            ${offsetPageInfoField}
            ${graphqlNodes(todoItemFields)}
          }
        }`
          })
          .expect(200)
          .then(({ body }) => {
            const { nodes, pageInfo }: OffsetConnectionType<TodoItemOffsetFetchWithNegativeEnableDTO> =
              body.data.todoItemOffsetFetchWithNegativeEnables
            expect(pageInfo).toEqual({
              hasNextPage: false,
              hasPreviousPage: false
            })
            expect(nodes).toHaveLength(100)

            expect(nodes).toEqual(todoItems)
          }))
      describeIf(process.env.NESTJS_QUERY_DB_TYPE == 'postgres')('postgres', () => {
        it('should return all the nodes after the given offset', () =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              operationName: null,
              variables: {},
              query: `{
            todoItemOffsetFetchWithNegativeEnables(paging: {limit: -1, offset: 2}) {
            ${offsetPageInfoField}
            ${graphqlNodes(todoItemFields)}
          }
        }`
            })
            .expect(200)
            .then(({ body }) => {
              const { nodes, pageInfo }: OffsetConnectionType<TodoItemOffsetFetchWithNegativeEnableDTO> =
                body.data.todoItemOffsetFetchWithNegativeEnables
              expect(pageInfo).toEqual({
                hasNextPage: false,
                hasPreviousPage: true
              })
              expect(nodes).toHaveLength(98)

              expect(nodes).toEqual(todoItems.slice(2))
            }))
      })
      describeIf(process.env.NESTJS_QUERY_DB_TYPE == 'mysql')('mysql', () => {
        it('should return an error when fetching all the nodes after the given offset', () =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              operationName: null,
              variables: {},
              query: `{
            todoItemOffsetFetchWithNegativeEnables(paging: {limit: -1, offset: 2}) {
            ${offsetPageInfoField}
            ${graphqlNodes(todoItemFields)}
          }
        }`
            })
            .expect(200)
            .then(({ body }) => {
              expect(body.errors).toBeDefined()
              expect(body.errors).toHaveLength(1)
              expect(body.errors[0].message).toContain('RDBMS does not support OFFSET without LIMIT in SELECT statements')
              expect(body.data).toBeNull()
            }))
      })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
