import {
  applyDecorators,
  ClassSerializerInterceptor,
  Delete as NestDelete,
  Get as NestGet,
  HttpCode,
  HttpStatus,
  Patch as NestPatch,
  Post as NestPost,
  Put as NestPut,
  SerializeOptions,
  UseInterceptors
} from '@nestjs/common'
import {
  ApiBody,
  ApiBodyOptions,
  ApiConsumes,
  ApiOperation,
  ApiOperationOptions,
  ApiResponse,
  ApiResponseOptions
} from '@nestjs/swagger'
import { isArray } from 'class-validator'

import { ReturnTypeFunc } from '../interfaces/return-type-func'
import { isDisabled, Method, MethodOpts } from './method.decorator'

export type MethodDecoratorResponse = Omit<ApiResponseOptions, 'status' | 'isArray' | 'type'> & { status: number }

interface MethodDecoratorArg extends MethodOpts {
  path?: string | string[]
  operation?: ApiOperationOptions
  response?: MethodDecoratorResponse
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
      returnTypeFuncOrOptions = undefined
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
    const status = options.response?.status ?? (returnTypeFunc ? successStatus : HttpStatus.NO_CONTENT)

    if (returnTypeFunc) {
      const returnedType = returnTypeFunc()
      const isReturnTypeArray = Array.isArray(returnedType)
      const type = isReturnTypeArray ? returnedType[0] : returnedType

      decorators.push(
        ApiResponse({
          description: 'Successful response.',
          ...options.response,
          type,
          isArray: isReturnTypeArray,
          status
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
          description: 'Request completed successfully.',
          ...options.response,
          status
        })
      )
    }

    decorators.push(HttpCode(status))

    if (options.operation) {
      decorators.push(ApiOperation(options.operation))
    }

    const body = (options as MutationMethodDecoratorArg).body
    if (body) {
      decorators.push(ApiBody(body))
    }

    const consumes = (options as MutationMethodDecoratorArg).consumes
    if (consumes?.length) {
      decorators.push(ApiConsumes(...consumes))
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

export function Patch(options: MutationMethodDecoratorArg, ...methodOpts: MethodOpts[]): PropertyDecorator & MethodDecorator
export function Patch(
  returnTypeFunction?: ReturnTypeFunc,
  options?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): PropertyDecorator & MethodDecorator

export function Patch(
  returnTypeFuncOrOptions?: ReturnTypeFunc | MutationMethodDecoratorArg,
  maybeOptions?: MutationMethodDecoratorArg,
  ...methodOpts: MethodOpts[]
): MethodDecorator | PropertyDecorator {
  return methodDecorator(NestPatch, HttpStatus.OK)(returnTypeFuncOrOptions, maybeOptions, ...methodOpts)
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
