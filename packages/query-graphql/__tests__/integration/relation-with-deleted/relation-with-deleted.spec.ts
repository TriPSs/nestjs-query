import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { INestApplication } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { Test, TestingModule } from '@nestjs/testing'
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { NestjsQueryGraphQLModule, PagingStrategies } from '../../../src'
import { SoftDeleteItemDto } from './dtos/soft-delete-item.dto'
import { SoftDeleteParentDto } from './dtos/soft-delete-parent.dto'
import { SoftDeleteItem } from './entities/soft-delete-item.entity'
import { SoftDeleteParent } from './entities/soft-delete-parent.entity'

describe('Relation options reach the persistence layer', () => {
  let app: INestApplication
  let dataSource: DataSource

  const graphql = <Data>(query: string): Promise<Data> =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200)
      .then(({ body }) => {
        if (body.errors) {
          throw new Error(JSON.stringify(body.errors))
        }
        return body.data as Data
      })

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [SoftDeleteParent, SoftDeleteItem],
          synchronize: true
        }),
        TypeOrmModule.forFeature([SoftDeleteParent, SoftDeleteItem]),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          playground: false
        }),
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypeOrmModule.forFeature([SoftDeleteParent, SoftDeleteItem])],
          resolvers: [
            {
              EntityClass: SoftDeleteParent,
              DTOClass: SoftDeleteParentDto,
              pagingStrategy: PagingStrategies.NONE,
              create: { disabled: true },
              update: { disabled: true },
              delete: { disabled: true }
            },
            {
              EntityClass: SoftDeleteItem,
              DTOClass: SoftDeleteItemDto,
              pagingStrategy: PagingStrategies.NONE,
              create: { disabled: true },
              update: { disabled: true },
              delete: { useSoftDelete: true }
            }
          ]
        })
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
    dataSource = app.get<DataSource>(getDataSourceToken())
  })

  beforeEach(async () => {
    await dataSource.query('UPDATE test_soft_delete_parent SET featuredItemId = NULL')
    await dataSource.query('DELETE FROM test_soft_delete_item')
    await dataSource.query('DELETE FROM test_soft_delete_parent')

    const parent = await dataSource.getRepository(SoftDeleteParent).save({ name: 'parent' })
    await dataSource.getRepository(SoftDeleteItem).save({ parentId: parent.id, content: 'live' })
    const removed = await dataSource.getRepository(SoftDeleteItem).save({ parentId: parent.id, content: 'removed' })
    await dataSource.getRepository(SoftDeleteParent).update(parent.id, { featuredItemId: removed.id })
    await dataSource.getRepository(SoftDeleteItem).softDelete(removed.id)
  })

  afterAll(() => app.close())

  it('passes `withDeleted` from a to-many @Relation through to the query', async () => {
    const data = await graphql<{ softDeleteParents: { items: SoftDeleteItemDto[] }[] }>(`
      query {
        softDeleteParents {
          items {
            content
          }
        }
      }
    `)

    expect(data.softDeleteParents[0].items.map((item) => item.content).sort()).toEqual(['live', 'removed'])
  })

  it('passes `withDeleted` from a to-many @Relation through to the relation count', async () => {
    const data = await graphql<{ softDeleteParents: { pagedItems: { totalCount: number } }[] }>(`
      query {
        softDeleteParents {
          pagedItems {
            totalCount
          }
        }
      }
    `)

    expect(data.softDeleteParents[0].pagedItems.totalCount).toBe(2)
  })

  it('passes `withDeleted` from a to-one @Relation through to the query', async () => {
    const data = await graphql<{ softDeleteParents: { featuredItem: SoftDeleteItemDto }[] }>(`
      query {
        softDeleteParents {
          featuredItem {
            content
          }
        }
      }
    `)

    expect(data.softDeleteParents[0].featuredItem).toEqual({ content: 'removed' })
  })

  it('passes `useSoftDelete` from the delete resolver through to deleteMany', async () => {
    const data = await graphql<{ deleteManySoftDeleteItems: { deletedCount: number } }>(`
      mutation {
        deleteManySoftDeleteItems(input: { filter: { content: { eq: "live" } } }) {
          deletedCount
        }
      }
    `)

    expect(data.deleteManySoftDeleteItems).toEqual({ deletedCount: 1 })

    const stillThere = await dataSource.getRepository(SoftDeleteItem).findOne({ where: { content: 'live' }, withDeleted: true })
    expect(stillThere).not.toBeNull()
    expect(stillThere.deletedAt).not.toBeNull()
  })
})
