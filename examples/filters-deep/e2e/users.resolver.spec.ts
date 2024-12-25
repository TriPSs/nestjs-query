import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { default as request } from 'supertest'
import { DataSource } from 'typeorm'

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
    await refresh(app.get(DataSource))
  })

  afterAll(() => refresh(app.get(DataSource)))

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

    it('should not fail if the same property-name occurs twice', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
            # "John Doe", "Jane Doe", "Post 1 Only", "Post 2 Only", "Post 3 Only", "Post 4 Only", "Post 6 Only"
            users(
              filter: {
                # "John Doe", "Jane Doe", "Post 1 Only", "Post 2 Only", "Post 3 Only", "Post 4 Only", "Post 5 Only", "Post 6 Only"
                firstName: {
                  like: "%"
                }

                # "John Doe", "Jane Doe", "Post 1 Only", "Post 2 Only", "Post 3 Only", "Post 4 Only", "Post 5 Only", "Post 6 Only"
                and: [
                  {
                    lastName: {
                      like: "%"
                    }
                  },

                  {
                    firstName: {
                      like: "%"
                    }
                  }
                ]

                # "John Doe", "Jane Doe", "Post 1 Only", "Post 2 Only", "Post 3 Only", "Post 4 Only", "Post 6 Only"
                # "Post 1", "Post 2", "Post 3", "Post 4", "Post 6"
                posts: {
                  or: [
                    # "Post 1"
                    {
                      title: {
                        eq: "Post 1"
                      }
                    },

                    # "Post 1", "Post 2", "Post 6", "Post 3", "Post 4"
                    {
                      # "Sports", "Politics"
                      categories: {
                        # "Post 2"
                        posts: {
                          and: [
                            {
                              title: {
                                eq: "Post 2"
                              }
                            },

                            {
                              description: {
                                eq: "Post 2 Description"
                              }
                            }
                          ]
                        }
                      }

                      # "John Doe", "Jane Doe", "Post 1 Only"
                      authors: {
                        # "Post 1"
                        posts: {
                          and: [
                            {
                              title: {
                                eq: "Post 1"
                              }
                            },

                            {
                              description: {
                                eq: "Post 1 Description"
                              }
                            }
                          ]
                        }
                      }
                    }
                  ]
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

          expect(users).toHaveLength(7)
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
                firstName: 'Post 2',
                lastName: 'Only'
              }),

              expect.objectContaining({
                firstName: 'Post 3',
                lastName: 'Only'
              }),

              expect.objectContaining({
                firstName: 'Post 4',
                lastName: 'Only'
              }),

              expect.objectContaining({
                firstName: 'Post 6',
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
