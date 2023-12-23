import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { OffsetConnectionType } from '@ptc-org/nestjs-query-rest'
import request from 'supertest'
import { Connection } from 'typeorm'

import { generateOpenapiSpec } from '../../helpers/generate-openapi-spec'
import { AppModule } from '../src/app.module'
import { TagDTO } from '../src/tag/dto/tag.dto'
import { refresh } from './fixtures'

describe('TagResolver (basic rest - e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false
      })
    )

    generateOpenapiSpec(app, __dirname)

    await app.init()
    await refresh(app.get(Connection))
  })

  afterAll(() => refresh(app.get(Connection)))

  const tags = [
    { id: 1, name: 'Urgent' },
    { id: 2, name: 'Home' },
    { id: 3, name: 'Work' },
    { id: 4, name: 'Question' },
    { id: 5, name: 'Blocked' }
  ]

  describe('query', () => {
    it(`should return a connection`, () =>
      request(app.getHttpServer())
        .get('/tag-dtos')
        .expect(200)
        .then(({ body }) => {
          const { nodes, pageInfo }: OffsetConnectionType<TagDTO> = body
          expect(nodes).toHaveLength(5)
          expect(nodes.map((e) => e)).toMatchObject(tags)
        }))
  })

  afterAll(async () => {
    await app.close()
  })
})
