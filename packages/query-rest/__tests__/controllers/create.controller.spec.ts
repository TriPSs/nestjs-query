import { Controller, INestApplication, UnauthorizedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Filter, QueryService } from '@ptc-org/nestjs-query-core'
import request from 'supertest'

import { Authorizer, getAuthorizerToken, OperationGroup } from '../../src/auth'
import { CreateController, CreateControllerOpts } from '../../src/controllers/create.controller'
import { Field } from '../../src/decorators'

describe('CreateController', () => {
  let app: INestApplication

  afterEach(() => app?.close())

  it('authorizes createOne before calling the query service', async () => {
    class TestDTO {
      @Field()
      name!: string
    }

    const service = {
      createOne: jest.fn()
    }
    const authorizer: Authorizer<TestDTO> = {
      authorize: jest.fn().mockRejectedValue(new UnauthorizedException()),
      authorizeRelation: jest.fn()
    }

    @Controller('tests')
    class TestController extends CreateController(TestDTO) {
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

    await request(app.getHttpServer()).post('/tests').send({ name: 'test' }).expect(401)

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authorizer.authorize).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        operationName: 'createOne',
        operationGroup: OperationGroup.CREATE,
        readonly: false,
        many: false
      })
    )
    expect(service.createOne).not.toHaveBeenCalled()
  })

  describe('validateWithAuthFilter', () => {
    class ValidatedDTO {
      @Field()
      name!: string
    }

    const authorizedFilter: Filter<ValidatedDTO> = { name: { eq: 'authorized' } }

    const setupApp = async (opts: CreateControllerOpts<ValidatedDTO>, resolvedAuthFilter: Filter<ValidatedDTO> | undefined) => {
      const service = {
        createOne: jest.fn().mockImplementation((input: ValidatedDTO) => Promise.resolve(input))
      }
      const authorizer: Authorizer<ValidatedDTO> = {
        authorize: jest.fn().mockResolvedValue(resolvedAuthFilter),
        authorizeRelation: jest.fn()
      }

      @Controller('validated-tests')
      class ValidatedTestController extends CreateController(ValidatedDTO, opts) {
        constructor() {
          super(service as unknown as QueryService<ValidatedDTO>)
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [ValidatedTestController],
        providers: [{ provide: getAuthorizerToken(ValidatedDTO), useValue: authorizer }]
      }).compile()

      app = moduleRef.createNestApplication()
      await app.init()

      return service
    }

    const postCreateOne = () => request(app.getHttpServer()).post('/validated-tests').send({ name: 'test' }).expect(201)

    it('passes the auth filter into the query service when enabled at the top level', async () => {
      const service = await setupApp({ validateWithAuthFilter: true }, authorizedFilter)

      await postCreateOne()

      expect(service.createOne).toHaveBeenCalledWith({ name: 'test' }, { filter: authorizedFilter })
    })

    it('passes the auth filter into the query service when enabled for createOne only', async () => {
      const service = await setupApp({ one: { validateWithAuthFilter: true } }, authorizedFilter)

      await postCreateOne()

      expect(service.createOne).toHaveBeenCalledWith({ name: 'test' }, { filter: authorizedFilter })
    })

    it('falls back to the top-level flag when the createOne options do not set it', async () => {
      const service = await setupApp({ validateWithAuthFilter: true, one: {} }, authorizedFilter)

      await postCreateOne()

      expect(service.createOne).toHaveBeenCalledWith({ name: 'test' }, { filter: authorizedFilter })
    })

    it('does not pass opts when the authorizer resolves no filter', async () => {
      const service = await setupApp({ validateWithAuthFilter: true }, undefined)

      await postCreateOne()

      expect(service.createOne).toHaveBeenCalledWith({ name: 'test' }, undefined)
    })

    it('does not pass opts when validateWithAuthFilter is disabled for createOne', async () => {
      const service = await setupApp({ validateWithAuthFilter: true, one: { validateWithAuthFilter: false } }, authorizedFilter)

      await postCreateOne()

      expect(service.createOne).toHaveBeenCalledWith({ name: 'test' }, undefined)
    })

    it('does not pass the auth filter into the query service when not enabled', async () => {
      const service = await setupApp({}, authorizedFilter)

      await postCreateOne()

      expect(service.createOne).toHaveBeenCalledWith({ name: 'test' }, undefined)
    })
  })
})
