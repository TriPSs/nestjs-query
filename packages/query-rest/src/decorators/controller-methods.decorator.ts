import {
  applyDecorators,
  ClassSerializerInterceptor,
  Delete as NestDelete,
  Get as NestGet,
  HttpCode,
  HttpStatus,
  Post as NestPost,
  Put as NestPut,
  SerializeOptions,
  UseInterceptors
} from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiOperationOptions, ApiResponse } from '@nestjs/swagger'
import { ApiBodyOptions } from '@nestjs/swagger/dist/decorators/api-body.decorator'
import { isArray } from 'class-validator'

import { ReturnTypeFunc } from '../interfaces/return-type-func'
import { isDisabled, Method, MethodOpts } from './method.decorator'

interface MethodDecoratorArg extends MethodOpts {
  path?: string | string[]
  operation?: ApiOperationOptions
  // Support custom response decorators
  response?: MethodDecorator[]
}

interface MutationMethodDecoratorArg extends MethodDecoratorArg {
  body?: ApiBodyOptions
  consumes?: string[]
}

const methodDecorator = (method: (path?: string | string[]) => MethodDecorator, successStatus: HttpStatus) => {
  return (
    returnTypeFuncOrOptions?: ReturnTypeFunc | MethodDecoratorArg | MutationMethodDecoratorArg,
    maybeOptions: MethodDecoratorArg | MutationMethodDecoratorArg = {},
    ...methodOpts: (MethodDecoratorArg | MutationMethodDecoratorArg)[]
  ): MethodDecorator | PropertyDecorator => {
    let returnTypeFunc: ReturnTypeFunc | undefined
    let options = maybeOptions

    if (typeof returnTypeFuncOrOptions === 'object') {
      options = returnTypeFuncOrOptions
      returnTypeFuncOrOptions = null
    } else {
      returnTypeFunc = returnTypeFuncOrOptions
    }

    if (isDisabled([options, ...methodOpts])) {
      return (): void => {}
    }

    if (!options.path) {
      options.path = []
    }

    const paths: string[] = options.path && !isArray(options.path) ? ([options.path] as string[]) : (options.path as string[])

    const decorators = [method(paths), Method(options, ...methodOpts)]

    if (returnTypeFunc) {
      const returnedType = returnTypeFunc()
      const isReturnTypeArray = Array.isArray(returnedType)
      const type = isReturnTypeArray ? returnedType[0] : returnedType

      decorators.push(
        ApiResponse({
          status: successStatus,
          description: 'Successful response.',
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
    } else if (!options.response || options.response.length === 0) {
      decorators.push(
        HttpCode(HttpStatus.NO_CONTENT),
        ApiResponse({
          status: HttpStatus.NO_CONTENT,
          description: 'Request completed successfully.'
        })
      )
    }

    if (options.response) {
      decorators.push(...options.response)
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

export function Get(options: MethodDecoratorArg, ...methodOpts: MethodOpts[]): PropertyDecorator & MethodDecorator
export function Get(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): PropertyDecorator & MethodDecorator

export function Get(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MethodDecoratorArg,
  maybeOptions?: MethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestGet, HttpStatus.OK)(returnTypeFuncOrOptions, maybeOptions, ...methodOpts)
}

export function Post(options: MutationMethodDecoratorArg, ...methodOpts: MethodOpts[]): PropertyDecorator & MethodDecorator
export function Post(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): PropertyDecorator & MethodDecorator

export function Post(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestPost, HttpStatus.CREATED)(returnTypeFuncOrOptions, maybeOptions, ...methodOpts)
}

export function Put(options: MutationMethodDecoratorArg, ...methodOpts: MethodOpts[]): PropertyDecorator & MethodDecorator
export function Put(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): PropertyDecorator & MethodDecorator

export function Put(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestPut, HttpStatus.OK)(returnTypeFuncOrOptions, maybeOptions, ...methodOpts)
}

export function Delete(options: MutationMethodDecoratorArg, ...methodOpts: MethodOpts[]): PropertyDecorator & MethodDecorator
export function Delete(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): PropertyDecorator & MethodDecorator

export function Delete(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestDelete, HttpStatus.OK)(returnTypeFuncOrOptions, maybeOptions, ...methodOpts)
}
