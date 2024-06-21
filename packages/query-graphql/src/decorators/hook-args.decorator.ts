import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Args, GqlExecutionContext } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { Hook } from '../hooks'
import { HookContext } from '../interceptors'
import { MutationArgsType } from '../types'
import { composeDecorators } from './decorator.utils'

function transformValue<T>(value: T, type?: Class<T>): T {
  if (type && !(value instanceof type)) {
    return plainToInstance<T, unknown>(type, value)
  }
  return value
}

function createArgsDecorator<T, C = unknown>(fn: (arg: T, context: C) => T | Promise<T>): ParameterDecorator {
  const dec = (target: Class<unknown>, methodName: string, paramIndex: number): void => {
    const params = Reflect.getMetadata('design:paramtypes', target, methodName) as Class<T>[]
    const ArgType = params[paramIndex]
    return createParamDecorator(async (data: unknown, executionContext: ExecutionContext) => {
      const gqlExecutionContext = GqlExecutionContext.create(executionContext)
      const gqlContext = gqlExecutionContext.getContext<C>()
      const args = gqlExecutionContext.getArgs<T>()
      return fn(transformValue(args, ArgType), gqlContext)
    })()(target, methodName, paramIndex)
  }
  return composeDecorators(Args(), dec as ParameterDecorator)
}

export const HookArgs = <T>(): ParameterDecorator =>
  createArgsDecorator(async (data: T, context: HookContext<Hook<unknown>>) => {
    if (context.hooks && context.hooks.length > 0) {
      let hookedArgs = data
      for (const hook of context.hooks) {
        hookedArgs = (await hook.run(hookedArgs, context)) as T
      }
      return hookedArgs
    }
    return data
  })

export const MutationHookArgs = <T extends MutationArgsType<unknown>>(): ParameterDecorator =>
  createArgsDecorator(async (data: T, context: HookContext<Hook<unknown>>) => {
    if (context.hooks && context.hooks.length > 0) {
      let hookedArgs = data.input
      for (const hook of context.hooks) {
        hookedArgs = (await hook.run(hookedArgs, context)) as T
      }
      return { input: hookedArgs }
    }
    return data
  })
