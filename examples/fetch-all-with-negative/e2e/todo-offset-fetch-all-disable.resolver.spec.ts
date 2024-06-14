import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { OffsetConnectionType } from '@ptc-org/nestjs-query-graphql'
import request from 'supertest'
import { Connection } from 'typeorm'

import { AppModule } from '../src/app.module'
import { TodoItemOffsetFetchWithNegativeDisableDTO } from '../src/todo-item/dto/todo-item-offset-fetch-all-disable.dto'
import { refresh } from './fixtures'
import { nodes as graphqlNodes, offsetPageInfoField, todoItemFields } from './graphql-fragments'

describe('TodoItemResolver (offset pagination - fetch all with negative disabled)', () => {
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
            todoItemOffsetFetchWithNegativeDisables(paging: {limit: -1, offset: 2}) {
            ${offsetPageInfoField}
            ${graphqlNodes(todoItemFields)}
          }
        }`
          })
          .expect(200)
          .then(({ body }) => {
            const { nodes, pageInfo }: OffsetConnectionType<TodoItemOffsetFetchWithNegativeDisableDTO> =
              body.data.todoItemOffsetFetchWithNegativeDisables
            expect(pageInfo).toEqual({
              hasNextPage: false,
              hasPreviousPage: false
            })
            expect(nodes).toHaveLength(0)
          }))
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
