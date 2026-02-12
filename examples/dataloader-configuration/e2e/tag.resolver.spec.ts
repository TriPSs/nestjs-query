import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { CursorConnectionType } from '@ptc-org/nestjs-query-graphql'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { refresh } from '../e2e/fixtures'
import { AppModule } from '../src/app.module'
import { batchScheduleFn } from '../src/batch-schedule-fn'
import { TagDTO } from '../src/tag/dto/tag.dto'
import { edgeNodes, pageInfoField, tagFields } from './graphql-fragments'

jest.mock('../src/batch-schedule-fn', () => ({
  batchScheduleFn: jest.fn((callback: () => void) => {
    return setTimeout(callback, 250)
  })
}))

describe('TagResolver (dataloader-configuration - e2e)', () => {
  let app: INestApplication
  const batchScheduleFnMock = batchScheduleFn as jest.Mock

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

  afterAll(async () => {
    await app.close()
  })

  const tags = [
    { id: '1', name: 'Urgent' },
    { id: '2', name: 'Home' },
    { id: '3', name: 'Work' },
    { id: '4', name: 'Question' },
    { id: '5', name: 'Blocked' }
  ]

  describe('query', () => {
    it(`should return a connection`, () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
            tags {
              ${pageInfoField}
              ${edgeNodes(tagFields)}
            }
          }`
        })
        .expect(200)
        .then(({ body }) => {
          const { edges }: CursorConnectionType<TagDTO> = body.data.tags

          const receivedTagIds = edges.map((e) => e.node.id)
          const receivedTodoItemIds = [...new Set(edges.flatMap((e) => e.node.todoItems).map((e) => e.id))]
          const receivedSubTaskIds = [
            ...new Set(
              edges
                .flatMap((e) => e.node.todoItems)
                .flatMap((e) => e.subTasks)
                .map((e) => e.id)
            )
          ]

          expect(edges).toHaveLength(5)
          expect(receivedTagIds).toEqual(tags.map((t) => t.id))
          expect(receivedTodoItemIds).toHaveLength(5)
          expect(receivedSubTaskIds).toHaveLength(15)

          expect(batchScheduleFnMock).toHaveBeenCalled()
        }))
  })
})
