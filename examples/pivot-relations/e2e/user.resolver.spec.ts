import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { refresh } from './fixtures'

describe('UserResolver (pivot-relations - e2e)', () => {
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

  beforeEach(() => refresh(app.get(DataSource)))

  afterAll(async () => {
    await refresh(app.get(DataSource))
    await app.close()
  })

  const graphql = (query: string, variables: Record<string, unknown> = {}) =>
    request(app.getHttpServer()).post('/graphql').send({ operationName: null, variables, query }).expect(200)

  describe('reading the properties', () => {
    it('should expose the properties of the relationship on each edge', () =>
      graphql(`
        {
          user(id: 1) {
            name
            groups {
              edges {
                node {
                  name
                }
                properties {
                  since
                  role
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        expect(body.data.user).toEqual({
          name: 'Alice',
          groups: {
            edges: [
              { node: { name: 'Admins' }, properties: { since: '2020-01-01T00:00:00.000Z', role: 'owner' } },
              { node: { name: 'Engineers' }, properties: { since: '2021-06-15T00:00:00.000Z', role: 'member' } }
            ]
          }
        })
      }))

    it('should return null properties when the relationship carries none', () =>
      graphql(`
        {
          user(id: 2) {
            groups(sorting: [{ field: id, direction: ASC }]) {
              edges {
                node {
                  name
                }
                properties {
                  since
                  role
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        expect(body.data.user.groups.edges).toEqual([
          { node: { name: 'Engineers' }, properties: { since: '2022-03-10T00:00:00.000Z', role: 'member' } },
          { node: { name: 'Guests' }, properties: { since: null, role: null } }
        ])
      }))

    it('should resolve the properties of every user in a single batch', () =>
      graphql(`
        {
          users(sorting: [{ field: id, direction: ASC }]) {
            edges {
              node {
                name
                groups(sorting: [{ field: id, direction: ASC }]) {
                  edges {
                    node {
                      name
                    }
                    properties {
                      role
                    }
                  }
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        const edges = body.data.users.edges as { node: { groups: { edges: unknown[] } } }[]
        expect(edges.map((edge) => edge.node.groups.edges)).toEqual([
          [
            { node: { name: 'Admins' }, properties: { role: 'owner' } },
            { node: { name: 'Engineers' }, properties: { role: 'member' } }
          ],
          [
            { node: { name: 'Engineers' }, properties: { role: 'member' } },
            { node: { name: 'Guests' }, properties: { role: null } }
          ]
        ])
      }))

    it('should not query the pivot when the properties are not selected', () =>
      graphql(`
        {
          user(id: 1) {
            groups {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        expect(body.data.user.groups.edges).toEqual([{ node: { name: 'Admins' } }, { node: { name: 'Engineers' } }])
      }))
  })

  describe('filtering by the properties', () => {
    it('should only return the relations whose properties match', () =>
      graphql(`
        {
          user(id: 1) {
            groups(filter: { properties: { role: { eq: "owner" } } }) {
              edges {
                node {
                  name
                }
                properties {
                  role
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        expect(body.data.user.groups.edges).toEqual([{ node: { name: 'Admins' }, properties: { role: 'owner' } }])
      }))

    it('should stay correlated to the parent', () =>
      graphql(`
        {
          user(id: 2) {
            groups(filter: { properties: { role: { eq: "owner" } } }) {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        // Bob is not an owner of anything, even though Admins does have an owner.
        expect(body.data.user.groups.edges).toEqual([])
      }))

    it('should combine with a filter on the node', () =>
      graphql(`
        {
          user(id: 1) {
            groups(filter: { name: { like: "Eng%" }, properties: { role: { eq: "member" } } }) {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        expect(body.data.user.groups.edges).toEqual([{ node: { name: 'Engineers' } }])
      }))

    it('should report the total count of the filtered relations', () =>
      graphql(`
        {
          user(id: 1) {
            groups(filter: { properties: { role: { eq: "member" } } }) {
              totalCount
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `).then(({ body }) => {
        expect(body.errors).toBeUndefined()
        expect(body.data.user.groups).toEqual({
          totalCount: 1,
          edges: [{ node: { name: 'Engineers' } }]
        })
      }))
  })

  describe('writing the properties', () => {
    it('should write the properties of the relations added', () =>
      graphql(`
        mutation {
          addGroupsToUser(input: { id: 2, relationIds: [1], properties: { role: "guest", since: "2023-01-01T00:00:00.000Z" } }) {
            id
          }
        }
      `)
        .then(({ body }) => expect(body.errors).toBeUndefined())
        .then(() =>
          graphql(`
            {
              user(id: 2) {
                groups(filter: { id: { eq: 1 } }) {
                  edges {
                    node {
                      name
                    }
                    properties {
                      since
                      role
                    }
                  }
                }
              }
            }
          `)
        )
        .then(({ body }) => {
          expect(body.data.user.groups.edges).toEqual([
            { node: { name: 'Admins' }, properties: { since: '2023-01-01T00:00:00.000Z', role: 'guest' } }
          ])
        }))

    it('should update the properties of an existing relationship', () =>
      graphql(`
        mutation {
          setGroupsPropertiesOnUser(input: { id: 1, relationId: 1, properties: { role: "admin" } }) {
            id
          }
        }
      `)
        .then(({ body }) => expect(body.errors).toBeUndefined())
        .then(() =>
          graphql(`
            {
              user(id: 1) {
                groups(filter: { id: { eq: 1 } }) {
                  edges {
                    node {
                      name
                    }
                    properties {
                      since
                      role
                    }
                  }
                }
              }
            }
          `)
        )
        .then(({ body }) => {
          // Only the role was sent, so `since` is untouched.
          expect(body.data.user.groups.edges).toEqual([
            { node: { name: 'Admins' }, properties: { since: '2020-01-01T00:00:00.000Z', role: 'admin' } }
          ])
        }))

    it('should reject writing the keys of the relationship', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            setGroupsPropertiesOnUser(input: { id: 1, relationId: 1, properties: { userId: 2 } }) {
              id
            }
          }`
        })
        // The keys of the relationship are not part of the properties input.
        .expect(400)
        .then(({ body }) => {
          expect(body.errors[0].message).toContain('Field "userId" is not defined by type')
        }))

    it('should fail when the relationship does not exist', () =>
      graphql(`
        mutation {
          setGroupsPropertiesOnUser(input: { id: 1, relationId: 3, properties: { role: "admin" } }) {
            id
          }
        }
      `).then(({ body }) => {
        expect(body.errors[0].message).toBe('Unable to find Groups 3 on User 1')
      }))
  })
})
