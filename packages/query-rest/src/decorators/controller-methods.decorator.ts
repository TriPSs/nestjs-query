import {
  applyDecorators,
  ClassSerializerInterceptor,
  Delete as NestDelete,
  Get as NestGet,
  Post as NestPost,
  Put as NestPut,
  SerializeOptions,
  UseInterceptors
} from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiOperationOptions, ApiResponse } from '@nestjs/swagger'
import { ApiBodyOptions } from '@nestjs/swagger/dist/decorators/api-body.decorator'
import { isArray } from 'class-validator'

import { ReturnTypeFunc } from '../interfaces/return-type-func'
import { isDisabled, ResolverMethod, ResolverMethodOpts } from './resolver-method.decorator'

interface MethodDecoratorArg extends ResolverMethodOpts {
  path?: string | string[]
  operation?: ApiOperationOptions
}

interface MutationMethodDecoratorArg extends MethodDecoratorArg {
  body?: ApiBodyOptions
  consumes?: string[]
}

const methodDecorator = (method: (path?: string | string[]) => MethodDecorator) => {
  return (
    returnTypeFuncOrOptions?: ReturnTypeFunc | MethodDecoratorArg | MutationMethodDecoratorArg,
    maybeOptions: MethodDecoratorArg | MutationMethodDecoratorArg = {},
    ...resolverOpts: (MethodDecoratorArg | MutationMethodDecoratorArg)[]
  ): MethodDecorator | PropertyDecorator => {
    let returnTypeFunc: ReturnTypeFunc | undefined
    let options = maybeOptions

    if (typeof returnTypeFuncOrOptions === 'object') {
      options = returnTypeFuncOrOptions
      returnTypeFuncOrOptions = null
    } else {
      returnTypeFunc = returnTypeFuncOrOptions
    }

    if (isDisabled([options, ...resolverOpts])) {
      return (): void => {}
    }

    if (!options.path) {
      options.path = []
    }

    const paths: string[] = options.path && !isArray(options.path) ? ([options.path] as string[]) : (options.path as string[])

    const decorators = [method(paths), ResolverMethod(options, ...resolverOpts)]

    if (returnTypeFunc) {
      const returnedType = returnTypeFunc()
      const isReturnTypeArray = Array.isArray(returnedType)
      const type = isReturnTypeArray ? returnedType[0] : returnedType

      decorators.push(
        ApiResponse({
          status: 200,
          type,
          isArray: isReturnTypeArray
        })
      )

      decorators.push(
        SerializeOptions({
          type,
          excludeExtraneousValues: true
        }),
        UseInterceptors(ClassSerializerInterceptor)
      )
    } else {
      decorators.push(
        ApiResponse({
          status: 204
        })
      )
    }

    if (options.operation) {
      decorators.push(ApiOperation(options.operation))
    }

    if ((options as MutationMethodDecoratorArg).body) {
      decorators.push(ApiBody((options as MutationMethodDecoratorArg).body))
    }

    if ((options as MutationMethodDecoratorArg).consumes?.length > 0) {
      decorators.push(ApiConsumes(...(options as MutationMethodDecoratorArg).consumes))
    }

    return applyDecorators(...decorators)
  }
}

export function Get(options: MethodDecoratorArg, ...resolverOpts: ResolverMethodOpts[]): PropertyDecorator & MethodDecorator
export function Get(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator

export function Get(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MethodDecoratorArg,
  maybeOptions?: MethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestGet)(returnTypeFuncOrOptions, maybeOptions, ...resolverOpts)
}

export function Post(
  options: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator
export function Post(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator

export function Post(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestPost)(returnTypeFuncOrOptions, maybeOptions, ...resolverOpts)
}

export function Put(
  options: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator
export function Put(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator

export function Put(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestPut)(returnTypeFuncOrOptions, maybeOptions, ...resolverOpts)
}

export function Delete(
  options: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator
export function Delete(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): PropertyDecorator & MethodDecorator

export function Delete(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...resolverOpts: ResolverMethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestDelete)(returnTypeFuncOrOptions, maybeOptions, ...resolverOpts)
}
