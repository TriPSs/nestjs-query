import { Controller, INestApplication, UnauthorizedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { QueryService } from '@ptc-org/nestjs-query-core'
import request from 'supertest'

import { Authorizer, getAuthorizerToken, OperationGroup } from '../../src/auth'
import { CreateController } from '../../src/controllers/create.controller'
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
})
