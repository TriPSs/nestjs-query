import { Controller, Get, INestApplication, Req, UseInterceptors } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Filter } from '@ptc-org/nestjs-query-core'
import { IncomingMessage } from 'node:http'
import request from 'supertest'
import { vi } from 'vitest'

import {
  AuthorizationContext,
  createDefaultAuthorizer,
  getAuthorizerToken,
  getCustomAuthorizerToken,
  OperationGroup
} from '../../src/auth'
import { AuthorizerFilter } from '../../src/decorators'
import { AuthorizerInterceptor } from '../../src/interceptors'

describe.each(['inline', 'class'] as const)('%s REST authorizer context', (kind) => {
  let app: INestApplication

  afterEach(() => app?.close())

  it.each([OperationGroup.READ, OperationGroup.CREATE, OperationGroup.UPDATE, OperationGroup.DELETE, OperationGroup.EXPORT])(
    'wraps the request and preserves operation metadata for %s',
    async (operationGroup) => {
      class TestDTO {
        ownerId!: string
      }

      let originalRequest: IncomingMessage | undefined
      const authorize = vi.fn<(context: { req: IncomingMessage }, operation: AuthorizationContext) => Promise<Filter<TestDTO>>>(
        (context) =>
          Promise.resolve({
            ownerId: { eq: context.req.headers['x-owner-id'] as string }
          })
      )
      const DefaultAuthorizer = createDefaultAuthorizer(TestDTO, kind === 'inline' ? { authorize } : undefined)

      class CustomAuthorizer {
        authorize = authorize
      }

      @Controller('authorization')
      @UseInterceptors(AuthorizerInterceptor(TestDTO))
      class TestController {
        @Get()
        query(@AuthorizerFilter({ operationGroup, many: false }) filter: Filter<TestDTO>, @Req() req: IncomingMessage) {
          originalRequest = req
          return filter
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
        providers: [
          { provide: getAuthorizerToken(TestDTO), useClass: DefaultAuthorizer },
          ...(kind === 'class' ? [{ provide: getCustomAuthorizerToken(TestDTO), useClass: CustomAuthorizer }] : [])
        ]
      }).compile()
      app = moduleRef.createNestApplication()
      await app.init()

      await request(app.getHttpServer())
        .get('/authorization')
        .set('x-owner-id', 'owner-1')
        .expect(200)
        .expect({ ownerId: { eq: 'owner-1' } })

      expect(authorize).toHaveBeenCalledWith(
        { req: originalRequest },
        {
          operationName: 'query',
          operationGroup,
          readonly: operationGroup === OperationGroup.READ || operationGroup === OperationGroup.EXPORT,
          many: false
        }
      )
      expect(authorize.mock.calls[0][0].req).toBe(originalRequest)
    }
  )
})
