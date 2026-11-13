import { Controller, INestApplication, RequestMethod } from '@nestjs/common'
import { METHOD_METADATA } from '@nestjs/common/constants'
import { Test } from '@nestjs/testing'
import { QueryService } from '@ptc-org/nestjs-query-core'
import request from 'supertest'
import { vi } from 'vitest'

import { getAuthorizerToken } from '../../src/auth'
import { CRUDController } from '../../src/controllers/crud.controller'
import { UpdateController, UpdateControllerOpts } from '../../src/controllers/update.controller'
import { Field, IDField } from '../../src/decorators'

describe('UpdateController HTTP method', () => {
  class TestDTO {
    @IDField()
    id!: string

    @Field()
    name!: string
  }

  describe.each(['standalone', 'CRUD'] as const)('%s controller', (kind) => {
    it.each([
      { method: undefined, expected: RequestMethod.PUT },
      { method: 'put', expected: RequestMethod.PUT },
      { method: 'patch', expected: RequestMethod.PATCH }
    ] as const)('uses $expected when method is $method', ({ method, expected }) => {
      const opts: UpdateControllerOpts<TestDTO> = { method }
      const ControllerClass = kind === 'standalone' ? UpdateController(TestDTO, opts) : CRUDController(TestDTO, { update: opts })

      expect(Reflect.getMetadata(METHOD_METADATA, ControllerClass.prototype.updateOne)).toBe(expected)
    })
  })

  let app: INestApplication

  afterEach(() => app?.close())

  it('serves PATCH with authorization and serialization on the configured path', async () => {
    const service = {
      updateOne: vi.fn().mockResolvedValue({ id: '1', name: 'updated', secret: 'hidden' })
    }
    const filter = { id: { eq: '1' } }
    const authorizer = { authorize: vi.fn().mockResolvedValue(filter), authorizeRelation: vi.fn() }

    @Controller('tests')
    class TestController extends CRUDController(TestDTO, {
      update: { method: 'patch', one: { path: ':id/edit' } }
    }) {
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
      .patch('/tests/1/edit')
      .send({ name: 'updated' })
      .expect(200)
      .expect({ id: '1', name: 'updated' })

    expect(service.updateOne).toHaveBeenCalledWith('1', { name: 'updated' }, { filter })
    await request(app.getHttpServer()).put('/tests/1/edit').send({ name: 'updated' }).expect(404)
  })
})
