import { RequestMethod } from '@nestjs/common'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'

import { Get, Patch, Post } from '../../src/decorators'

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

    @Patch(() => String, { path: ':id' })
    patch(): string {
      return 'patch'
    }

    @Patch({})
    patchNoContent(): void {}

    @Post({})
    noContent(): void {}

    @Post({ response: { status: 202, description: 'Accepted response.' } })
    accepted(): void {}
  }

  it.each([
    ['GET', 'get', 200],
    ['POST', 'post', 201],
    ['PATCH', 'patch', 200]
  ])('documents a %s %s response with status %i', (_method, methodName, status) => {
    const handler = TestController.prototype[methodName as 'get' | 'post' | 'patch']
    const responses = Reflect.getMetadata('swagger/apiResponse', handler)

    expect(responses).toHaveProperty(String(status))
  })

  it('registers the PATCH route and returns 200 when a return type is provided', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = TestController.prototype.patch

    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.PATCH)
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toEqual([':id'])
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(200)
  })

  it('returns and documents 204 for PATCH without a return type', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = TestController.prototype.patchNoContent

    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(204)
    expect(Reflect.getMetadata('swagger/apiResponse', handler)).toHaveProperty('204')
  })

  it('sets the runtime and documented status to 204 when there is no return type', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = TestController.prototype.noContent
    const responses = Reflect.getMetadata('swagger/apiResponse', handler)

    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(204)
    expect(responses).toHaveProperty('204')
  })

  it('uses a custom status and response when no return type is provided', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = TestController.prototype.accepted
    const responses = Reflect.getMetadata('swagger/apiResponse', handler)

    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(202)
    expect(responses).toHaveProperty('202')
    expect(responses[202].description).toBe('Accepted response.')
    expect(responses).not.toHaveProperty('204')
  })
})
