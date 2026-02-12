import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'

import { Authorizer } from '../auth'
import { InjectAuthorizer } from '../decorators'

export type AuthorizerContext<DTO> = { authorizer: Authorizer<DTO> }

export function AuthorizerInterceptor<DTO>(DTOClass: Class<DTO>): Class<NestInterceptor> {
  @Injectable()
  class Interceptor implements NestInterceptor {
    constructor(@InjectAuthorizer(DTOClass) readonly authorizer: Authorizer<DTO>) {}

    public intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest()
      request.authorizer = this.authorizer

      return next.handle()
    }
  }

  Object.defineProperty(Interceptor, 'name', {
    writable: false,
    // set a unique name otherwise DI does not inject a unique one for each request
    value: `${DTOClass.name}AuthorizerInterceptor`
  })

  return Interceptor
}
