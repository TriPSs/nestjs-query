import { ApiResponse } from '@nestjs/swagger'

import { Get, Post } from '../../src/decorators'

describe('controller method decorators', () => {
  class TestController {
    @Get(() => String)
    get(): string {
      return 'get'
    }

    @Post(() => String)
    post(): string {
      return 'post'
    }

    @Post({})
    noContent(): void {}

    @Post({ response: [ApiResponse({ status: 202 })] })
    accepted(): void {}
  }

  it.each([
    ['GET', 'get', 200],
    ['POST', 'post', 201]
  ])('documents a %s %s response with status %i', (_method, methodName, status) => {
    const handler = TestController.prototype[methodName as 'get' | 'post']
    const responses = Reflect.getMetadata('swagger/apiResponse', handler)

    expect(responses).toHaveProperty(String(status))
  })

  it('sets the runtime and documented status to 204 when there is no return type', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = TestController.prototype.noContent
    const responses = Reflect.getMetadata('swagger/apiResponse', handler)

    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(204)
    expect(responses).toHaveProperty('204')
  })

  it('uses custom responses when no return type is provided', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = TestController.prototype.accepted
    const responses = Reflect.getMetadata('swagger/apiResponse', handler)

    expect(Reflect.getMetadata('__httpCode__', handler)).not.toBe(204)
    expect(responses).toHaveProperty('202')
    expect(responses).not.toHaveProperty('204')
  })
})
