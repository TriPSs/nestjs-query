import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { default as request } from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { refresh } from './fixtures'

describe('PostsResolver (filters-deep - e2e)', () => {
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
    it('should query with 2-level-depth', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
            posts(
              filter: {
                categories: {
                  posts: {
                    title: {
                      eq: "Post 1"
                    }
                  }
                }
              }
            ) {
              id
              title
            }
          }`
        })
        .expect(200)
        .then(({ body }) => {
          // all posts with categories containing posts with title "Post 1"
          // --> categories containing posts with title "Post 1"
          //     - News, Sports
          // --> posts in categories News, Sports
          //     - "News": Post 1, Post 4, Post 5
          //     - "Sports": Post 1, Post 2, Post 6

          const posts = body.data.posts
          expect(posts).toHaveLength(5)
          expect(posts).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ title: 'Post 1' }),
              expect.objectContaining({ title: 'Post 4' }),
              expect.objectContaining({ title: 'Post 5' }),

              expect.objectContaining({ title: 'Post 2' }),
              expect.objectContaining({ title: 'Post 6' })
            ])
          )
        })
    })

    it('should fail with 3-level-depth', async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
            posts(
              filter: {
                categories: {
                  posts: {
                    authors: {
                      firstName: {
                        eq: "User 1"
                      }
                    }
                  }
                }
              }
            ) {
              id
              title
            }
          }`
        })
        .expect(400)
        .then(({ body }) => {
          const errors = body.errors

          expect(errors).toHaveLength(1)
          expect(errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: 'Field "authors" is not defined by type "PostFilterCategoryFilterPostFilter".'
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
