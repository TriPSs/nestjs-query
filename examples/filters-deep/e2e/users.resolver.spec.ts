import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { default as request } from 'supertest'
import { Connection } from 'typeorm'

import { AppModule } from '../src/app.module'
import { refresh } from './fixtures'

describe('UsersResolver (filters-deep - e2e)', () => {
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
    it('should query with infinite-depth', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
            users(
              filter: {
                posts: {
                  categories: {
                    name: {
                      eq: "News"
                    }
                  }
                }
              }
            ) {
              id
              firstName
              lastName
            }
          }`
        })
        .expect(200)
        .then(({ body }) => {
          const users = body.data.users

          expect(users).toHaveLength(5)
          expect(users).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                firstName: 'John',
                lastName: 'Doe'
              }),

              expect.objectContaining({
                firstName: 'Jane',
                lastName: 'Doe'
              }),

              expect.objectContaining({
                firstName: 'Post 1',
                lastName: 'Only'
              }),

              expect.objectContaining({
                firstName: 'Post 4',
                lastName: 'Only'
              }),

              expect.objectContaining({
                firstName: 'Post 5',
                lastName: 'Only'
              })
            ])
          )
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
