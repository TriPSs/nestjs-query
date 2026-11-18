import { Controller, INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Class, QueryService } from '@ptc-org/nestjs-query-core'
import request from 'supertest'
import { vi } from 'vitest'

import { getAuthorizerToken } from '../../src/auth'
import { CreateController } from '../../src/controllers/create.controller'
import { CRUDController } from '../../src/controllers/crud.controller'
import { UpdateController } from '../../src/controllers/update.controller'
import { Field, IDField } from '../../src/decorators'

describe.each(['standalone', 'CRUD'] as const)('%s mutation return DTO', (kind) => {
  class TestDTO {
    @IDField(() => String)
    id!: string

    @Field(() => String)
    name!: string
  }

  class CreatedDTO {
    @Field(() => String)
    id!: string
  }

  class UpdatedDTO {
    @Field(() => String)
    name!: string
  }

  let app: INestApplication

  afterEach(() => app?.close())

  it.each([
    { method: 'post', custom: true },
    { method: 'put', custom: true },
    { method: 'patch', custom: true },
    { method: 'post', custom: false },
    { method: 'put', custom: false },
    { method: 'patch', custom: false }
  ] as const)('serializes and documents $method (custom return DTO: $custom)', async ({ method, custom }) => {
    const result = { id: '1', name: 'saved', secret: 'hidden' }
    const service = { createOne: vi.fn().mockResolvedValue(result), updateOne: vi.fn().mockResolvedValue(result) }
    const authorizer = { authorize: vi.fn().mockResolvedValue({}), authorizeRelation: vi.fn() }
    const create = custom ? { ReturnDTOClass: CreatedDTO } : {}
    const update = {
      method: method === 'patch' ? ('patch' as const) : ('put' as const),
      ...(custom ? { ReturnDTOClass: UpdatedDTO } : {})
    }
    const BaseController: new (service: QueryService<TestDTO>) => object =
      kind === 'CRUD'
        ? CRUDController(TestDTO, { create, update })
        : method === 'post'
          ? CreateController(TestDTO, create)
          : UpdateController(TestDTO, update)

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

    const isCreate = method === 'post'
    const status = isCreate ? 201 : 200
    const ReturnDTO = custom ? (isCreate ? CreatedDTO : UpdatedDTO) : TestDTO
    const expected = custom ? (isCreate ? { id: '1' } : { name: 'saved' }) : { id: '1', name: 'saved' }
    await request(app.getHttpServer())
      [method](isCreate ? '/tests' : '/tests/1')
      .send({ name: 'submitted' })
      .expect(status)
      .expect(expected)

    // The request still uses the original DTO even when the response omits name.
    expect(isCreate ? service.createOne.mock.calls[0][0] : service.updateOne.mock.calls[0][1]).toEqual({ name: 'submitted' })
    const handler = (TestController.prototype as unknown as Record<string, object>)[isCreate ? 'createOne' : 'updateOne']
    const responses = Reflect.getMetadata('swagger/apiResponse', handler) as Record<number, { type: Class<unknown> }>
    expect(responses[status].type).toBe(ReturnDTO)
  })
})
