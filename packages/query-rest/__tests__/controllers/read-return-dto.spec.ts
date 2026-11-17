import { Controller, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Class, QueryService, SortDirection } from '@ptc-org/nestjs-query-core'
import request from 'supertest'
import { vi } from 'vitest'

import { getAuthorizerToken } from '../../src/auth'
import { CRUDController } from '../../src/controllers/crud.controller'
import { ReadController } from '../../src/controllers/read.controller'
import { Field, FilterableField, IDField, QueryOptions } from '../../src/decorators'
import { PagingStrategies } from '../../src/types/query'

describe.each(['standalone', 'CRUD'] as const)('%s read return DTOs', (kind) => {
  let app: INestApplication

  afterEach(() => app?.close())

  it.each([
    { pagingStrategy: PagingStrategies.NONE, customOne: true, customMany: true },
    { pagingStrategy: PagingStrategies.NONE, customOne: true, customMany: false },
    { pagingStrategy: PagingStrategies.OFFSET, customOne: true, customMany: true },
    { pagingStrategy: PagingStrategies.OFFSET, customOne: true, customMany: false },
    { pagingStrategy: PagingStrategies.OFFSET, customOne: false, customMany: true }
  ])(
    'uses response DTOs with $pagingStrategy paging (one: $customOne, many: $customMany)',
    async ({ pagingStrategy, customOne, customMany }) => {
      @QueryOptions({ pagingStrategy, enableTotalCount: true, defaultResultSize: 2 })
      class ListItemDTO {
        @FilterableField(() => String)
        name!: string

        @Field(() => String)
        summary!: string
      }

      class SummaryDTO extends ListItemDTO {}

      @QueryOptions({
        pagingStrategy: customMany
          ? pagingStrategy === PagingStrategies.NONE
            ? PagingStrategies.OFFSET
            : PagingStrategies.NONE
          : pagingStrategy,
        enableTotalCount: !customMany,
        defaultResultSize: 7
      })
      class TestDTO extends ListItemDTO {
        @IDField(() => Number)
        id!: number

        @FilterableField(() => String)
        detail!: string
      }

      class DetailDTO {
        @Field(() => String)
        detail!: string
      }

      const row = { id: 7, name: 'test', detail: 'details', summary: 'summary', secret: 'hidden' }
      const service = {
        getById: vi.fn().mockResolvedValue(row),
        query: vi.fn().mockResolvedValue([row]),
        count: vi.fn().mockResolvedValue(1)
      }
      const authorizer = { authorize: vi.fn().mockResolvedValue({}), authorizeRelation: vi.fn() }
      const relations = [{ name: 'assignee', query: { relations: [{ name: 'team', query: {} }] } }]
      const read = {
        one: customOne ? { ReturnDTOClass: DetailDTO } : {},
        many: { ...(customMany ? { ReturnDTOClass: SummaryDTO } : {}), relations }
      }
      const BaseController: new (service: QueryService<TestDTO>) => object =
        kind === 'CRUD' ? CRUDController(TestDTO, { read }) : ReadController(TestDTO, read)

      @Controller('tests')
      class TestController extends BaseController {
        constructor() {
          super(service as unknown as QueryService<TestDTO>)
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [{ provide: getAuthorizerToken(TestDTO), useValue: authorizer }]
      }).compile()
      app = moduleRef.createNestApplication()
      await app.init()

      await request(app.getHttpServer())
        .get('/tests/7')
        .expect(200)
        .expect(customOne ? { detail: 'details' } : { id: 7, name: 'test', detail: 'details', summary: 'summary' })
      expect(service.getById).toHaveBeenCalledWith(7, { filter: {}, withDeleted: undefined })

      const response = await request(app.getHttpServer())
        .get('/tests')
        .query({ name: 'test', detail: 'details', sort: 'name:DESC' })
        .expect(200)
      const items = customMany
        ? [{ name: 'test', summary: 'summary' }]
        : [{ id: 7, name: 'test', detail: 'details', summary: 'summary' }]
      const filter = customMany ? { name: { eq: 'test' } } : { name: { eq: 'test' }, detail: { eq: 'details' } }
      const expected =
        pagingStrategy === PagingStrategies.NONE
          ? items
          : {
              nodes: items,
              pageInfo: { hasNextPage: false, hasPreviousPage: false },
              totalCount: 1
            }
      expect(response.body).toEqual(expected)
      expect(service.query).toHaveBeenCalledWith(
        expect.objectContaining({
          filter,
          sorting: [{ field: 'name', direction: SortDirection.DESC }],
          relations
        }),
        { withDeleted: undefined }
      )

      const handlers = TestController.prototype as unknown as Record<string, object>
      const oneResponse = Reflect.getMetadata('swagger/apiResponse', handlers.findById) as Record<
        number,
        { type: Class<unknown> }
      >
      const manyResponse = Reflect.getMetadata('swagger/apiResponse', handlers.queryMany) as Record<
        number,
        { type: Class<unknown>; isArray: boolean }
      >
      expect(oneResponse[200].type).toBe(customOne ? DetailDTO : TestDTO)
      const itemType =
        pagingStrategy === PagingStrategies.NONE
          ? manyResponse[200].type
          : (
              Reflect.getMetadata('swagger/apiModelProperties', manyResponse[200].type.prototype, 'nodes') as {
                type: Class<unknown>
              }
            ).type
      expect(itemType).toBe(customMany ? SummaryDTO : TestDTO)
      expect(manyResponse[200].isArray).toBe(pagingStrategy === PagingStrategies.NONE)
      expect(service.count.mock.calls).toEqual(
        pagingStrategy === PagingStrategies.NONE ? [] : [[filter, { withDeleted: undefined }]]
      )
      const expectedPaging = pagingStrategy === PagingStrategies.NONE ? undefined : { limit: customMany ? 3 : 8, offset: 0 }
      expect(service.query.mock.calls[0][0].paging).toEqual(expectedPaging)
      await request(app.getHttpServer())
        .get('/tests')
        .query({ sort: 'detail:ASC' })
        .expect(customMany ? 400 : 200)
    }
  )
})
