import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Connection } from 'typeorm'

import { AppModule } from '../src/app.module'
import { refresh } from './fixtures'
import { edgeNodes, jsonTaskFields, pageInfoField } from './graphql-fragments'

describe('JsonTask (typeorm - e2e)', () => {
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

  it(`should allow querying`, () =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `{
          jsonTasks{
            ${edgeNodes(jsonTaskFields)}
          }
      }`
      })
      .then((response) => {
        console.log(response.body.data.jsonTasks.edges[0])
      })
      .catch((error) => {
        console.error(error)
      }))

  afterAll(async () => {
    await app.close()
  })
})
