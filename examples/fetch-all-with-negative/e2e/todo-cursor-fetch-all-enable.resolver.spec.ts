import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { CursorConnectionType } from '@souagrosolucoes/nestjs-query-graphql'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { TodoItemCursorFetchWithNegativeEnableDTO } from '../src/todo-item/dto/todo-item-cursor-fetch-all-enable.dto'
import { refresh, todoItems } from './fixtures'
import { cursorPageInfoField, edgeNodes, todoItemFields } from './graphql-fragments'

describe('TodoItemResolver (cursor pagination - fetch all with negative enabled)', () => {
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
    await refresh(app.get(DataSource))
  })

  afterAll(() => refresh(app.get(DataSource)))

  describe('query', () => {
    describe('paging', () => {
      it('should return all the nodes', () =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            operationName: null,
            variables: {},
            query: `{
            todoItemCursorFetchWithNegativeEnables(paging: {first: -1}) {
            ${cursorPageInfoField}
            ${edgeNodes(todoItemFields)}
          }
        }`
          })
          .expect(200)
          .then(({ body }) => {
            const { edges, pageInfo }: CursorConnectionType<TodoItemCursorFetchWithNegativeEnableDTO> =
              body.data.todoItemCursorFetchWithNegativeEnables
            expect(pageInfo).toEqual({
              endCursor: 'YXJyYXljb25uZWN0aW9uOjk5',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
            })
            expect(edges).toHaveLength(100)

            expect(edges.map((e) => e.node)).toEqual(todoItems)
          }))

      describeIf(process.env.NESTJS_QUERY_DB_TYPE == 'postgres')('postgres', () => {
        it('should return all the nodes after the given cursor', () =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              operationName: null,
              variables: {},
              query: `{
            todoItemCursorFetchWithNegativeEnables(paging: {first: -1, after: "YXJyYXljb25uZWN0aW9uOjE="}) {
            ${cursorPageInfoField}
            ${edgeNodes(todoItemFields)}
          }
        }`
            })
            .expect(200)
            .then(({ body }) => {
              const { edges, pageInfo }: CursorConnectionType<TodoItemCursorFetchWithNegativeEnableDTO> =
                body.data.todoItemCursorFetchWithNegativeEnables
              expect(pageInfo).toEqual({
                endCursor: 'YXJyYXljb25uZWN0aW9uOjk5',
                hasNextPage: false,
                hasPreviousPage: true,
                startCursor: 'YXJyYXljb25uZWN0aW9uOjI='
              })
              expect(edges).toHaveLength(98)

              expect(edges.map((e) => e.node)).toEqual(todoItems.slice(2))
            }))
      })

      describeIf(process.env.NESTJS_QUERY_DB_TYPE == 'mysql')('mysql', () => {
        it('should return an error when requesting all the nodes after the given cursor', () =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              operationName: null,
              variables: {},
              query: `{
            todoItemCursorFetchWithNegativeEnables(paging: {first: -1, after: "YXJyYXljb25uZWN0aW9uOjE="}) {
            ${cursorPageInfoField}
            ${edgeNodes(todoItemFields)}
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
    it('should return an error when request all the nodes before the given cursor', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
        todoItemCursorFetchWithNegativeEnables(paging: {last: -1, before: "YXJyYXljb25uZWN0aW9uOjk4"}) {
        ${cursorPageInfoField}
        ${edgeNodes(todoItemFields)}
      }
    }`
        })
        .expect(200)
        .then(({ body }) => {
          const { edges, pageInfo }: CursorConnectionType<TodoItemCursorFetchWithNegativeEnableDTO> =
            body.data.todoItemCursorFetchWithNegativeEnables
          expect(pageInfo).toEqual({
            endCursor: 'YXJyYXljb25uZWN0aW9uOjk3',
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
          })
          expect(edges).toHaveLength(98)

          expect(edges.map((e) => e.node)).toEqual(todoItems.slice(0, 98))
        }))
  })

  afterAll(async () => {
    await app.close()
  })
})
