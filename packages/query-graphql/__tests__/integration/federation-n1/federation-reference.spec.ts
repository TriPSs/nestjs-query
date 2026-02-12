import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo'
import { INestApplication } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { Test, TestingModule } from '@nestjs/testing'
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { NestjsQueryGraphQLModule, PagingStrategies } from '../../../src'
import { TodoItemDto } from './dtos/todo-item.dto'
import { TodoListDto } from './dtos/todo-list.dto'
import { TodoItem } from './entities/todo-item.entity'
import { TodoList } from './entities/todo-list.entity'
import { createTestData } from './fixtures/test-data'

/**
 * Federation Reference Resolution Integration Test
 *
 * This test validates that @ResolveReference() works correctly with the @Parent() decorator fix.
 * It creates a real Federation subgraph using ApolloFederationDriver and tests the _entities query
 * which is how Apollo Gateway calls subgraphs to resolve entity references.
 *
 * The key insight from Apollo docs:
 * > You can directly query the _entities field, which is useful for load testing subgraphs
 * > and investigating potential performance issues.
 *
 * Related to: Issue #410 - Federation referenceBy broken since v9.2.0
 */
describe('Federation Reference Resolution Integration Test', () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [TodoList, TodoItem],
          synchronize: true
        }),
        TypeOrmModule.forFeature([TodoList, TodoItem]),
        GraphQLModule.forRoot<ApolloFederationDriverConfig>({
          driver: ApolloFederationDriver,
          autoSchemaFile: { federation: 2 }
        }),
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypeOrmModule.forFeature([TodoList, TodoItem])],
          resolvers: [
            {
              EntityClass: TodoList,
              DTOClass: TodoListDto,
              pagingStrategy: PagingStrategies.NONE,
              // This enables ReferenceResolver with @ResolveReference()
              referenceBy: { key: 'id' }
            },
            {
              EntityClass: TodoItem,
              DTOClass: TodoItemDto,
              pagingStrategy: PagingStrategies.NONE,
              // This enables ReferenceResolver with @ResolveReference()
              referenceBy: { key: 'id' }
            }
          ]
        })
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()

    dataSource = app.get<DataSource>(getDataSourceToken())
    await createTestData(dataSource)
  })

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy()
    }
    if (app) {
      await app.close()
    }
  })

  describe('_entities query (Federation Gateway simulation)', () => {
    /**
     * This is the critical test that validates the fix for #410.
     *
     * Before the fix:
     * - @ResolveReference() resolveReference(representation, @Context() context) { ... }
     * - The `representation` parameter was undefined because NestJS only processes decorated params
     *
     * After the fix:
     * - @ResolveReference() resolveReference(@Parent() representation, @Context() context) { ... }
     * - The @Parent() decorator properly extracts the representation from args[0]
     *
     * This test simulates what Apollo Gateway does: it sends an _entities query
     * with representations containing __typename and key fields.
     */
    it('should resolve TodoList reference via _entities query (Issue #410)', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              id
              name
            }
          }
        }
      `

      const variables = {
        representations: [
          { __typename: 'TodoList', id: 1 },
          { __typename: 'TodoList', id: 2 }
        ]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      // If @Parent() decorator is missing, representation would be undefined
      // and we'd get "Cannot read property 'id' of undefined" or similar error
      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._entities).toHaveLength(2)
      expect(response.body.data._entities[0]).toMatchObject({ id: 1, name: 'List 1' })
      expect(response.body.data._entities[1]).toMatchObject({ id: 2, name: 'List 2' })
    })

    it('should resolve TodoItem reference via _entities query', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoItem {
              id
              content
            }
          }
        }
      `

      const variables = {
        representations: [
          { __typename: 'TodoItem', id: 1 },
          { __typename: 'TodoItem', id: 2 }
        ]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._entities).toHaveLength(2)
      expect(response.body.data._entities[0].id).toBe(1)
      expect(response.body.data._entities[1].id).toBe(2)
    })

    it('should batch multiple references efficiently (DataLoader)', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              id
              name
            }
          }
        }
      `

      // Request all 5 TodoLists at once
      const variables = {
        representations: [
          { __typename: 'TodoList', id: 1 },
          { __typename: 'TodoList', id: 2 },
          { __typename: 'TodoList', id: 3 },
          { __typename: 'TodoList', id: 4 },
          { __typename: 'TodoList', id: 5 }
        ]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._entities).toHaveLength(5)

      for (let i = 0; i < 5; i++) {
        expect(response.body.data._entities[i]).toMatchObject({
          id: i + 1,
          name: `List ${i + 1}`
        })
      }
    })

    it('should resolve mixed entity types in single _entities query', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              __typename
              id
              name
            }
            ... on TodoItem {
              __typename
              id
              content
            }
          }
        }
      `

      const variables = {
        representations: [
          { __typename: 'TodoList', id: 1 },
          { __typename: 'TodoItem', id: 1 },
          { __typename: 'TodoList', id: 2 }
        ]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._entities).toHaveLength(3)
      expect(response.body.data._entities[0].__typename).toBe('TodoList')
      expect(response.body.data._entities[1].__typename).toBe('TodoItem')
      expect(response.body.data._entities[2].__typename).toBe('TodoList')
    })
  })

  describe('ID type handling in reference resolution', () => {
    it('should handle numeric ID passed as number', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              id
              name
            }
          }
        }
      `

      // ID as number (how Federation typically sends it for Int IDs)
      const variables = {
        representations: [{ __typename: 'TodoList', id: 1 }]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._entities[0].id).toBe(1)
    })

    it('should handle numeric ID passed as string', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              id
              name
            }
          }
        }
      `

      // ID as string (alternative representation)
      const variables = {
        representations: [{ __typename: 'TodoList', id: '1' }]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._entities[0].id).toBe(1)
    })
  })

  describe('Error handling in reference resolution', () => {
    it('should return error for non-existent entity', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              id
              name
            }
          }
        }
      `

      const variables = {
        representations: [{ __typename: 'TodoList', id: 99999 }]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      // Should return error for missing entity
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors[0].message).toContain('Unable to find TodoList')
    })

    it('should return error when key is missing', async () => {
      const query = `
        query ($representations: [_Any!]!) {
          _entities(representations: $representations) {
            ... on TodoList {
              id
              name
            }
          }
        }
      `

      // Missing 'id' key in representation
      const variables = {
        representations: [{ __typename: 'TodoList' }]
      }

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables })

      // Should return error for missing key
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors[0].message).toContain('missing required key')
    })
  })

  describe('Federation _service query validation', () => {
    it('should expose _service query with SDL', async () => {
      const query = `
        query {
          _service {
            sdl
          }
        }
      `

      const response = await request(app.getHttpServer()).post('/graphql').send({ query })

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data._service.sdl).toBeDefined()
      expect(response.body.data._service.sdl).toContain('@key(fields: "id")')
    })
  })
})
