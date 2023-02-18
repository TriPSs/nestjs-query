import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { CursorConnectionType } from '@ptc-org/nestjs-query-graphql'
import request from 'supertest'
import { Connection } from 'typeorm'

import { AppModule } from '../src/app.module'
import { TodoItemCursorFetchWithNegativeDisableDTO } from '../src/todo-item/dto/todo-item-cursor-fetch-all-disable.dto'
import { refresh } from './fixtures'
import { cursorPageInfoField, edgeNodes, todoItemFields } from './graphql-fragments'

describe('TodoItemResolver (cursor paginatino - fetch all with negative disabled)', () => {
  let app: INestApplication

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
      it('should not allow to fetch all the nodes', () =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            operationName: null,
            variables: {},
            query: `{
            todoItemCursorFetchWithNegativeDisables(paging: {first: -1, after: "YXJyYXljb25uZWN0aW9uOjE="}) {
            ${cursorPageInfoField}
            ${edgeNodes(todoItemFields)}
          }
        }`
          })
          .expect(200)
          .then(({ body }) => {
            const { edges, pageInfo }: CursorConnectionType<TodoItemCursorFetchWithNegativeDisableDTO> =
              body.data.todoItemCursorFetchWithNegativeDisables
            expect(pageInfo).toEqual({
              endCursor: null,
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null
            })
            expect(edges).toHaveLength(0)
          }))
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
