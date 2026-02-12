import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'

import { getHooksForType } from '../decorators'
import { getHookToken, Hook, HookTypes } from '../hooks'

export type HookContext<H extends Hook<unknown>> = {
  hooks?: H[]
}

class DefaultHookInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle()
  }
}

export function HookInterceptor(type: HookTypes, ...DTOClasses: Class<unknown>[]): Class<NestInterceptor> {
  const HookedClasses = DTOClasses.find((Cls) => getHooksForType(type, Cls))
  if (!HookedClasses) {
    return DefaultHookInterceptor
  }
  const hookToken = getHookToken(type, HookedClasses)

  @Injectable()
  class Interceptor implements NestInterceptor {
    constructor(@Inject(hookToken) readonly hooks: Hook<typeof HookedClasses>[]) {}

    public intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest()
      request.hooks = this.hooks

      return next.handle()
    }
  }

  Object.defineProperty(Interceptor, 'name', {
    writable: false,
    // set a unique name otherwise DI does not inject a unique one for each request
    value: `${DTOClasses[0].name}${type}HookInterceptor`
  })

  return Interceptor
}
