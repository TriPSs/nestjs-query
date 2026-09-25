import { ExecutionContext } from '@nestjs/common'
import { Args, GqlExecutionContext } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { Hook } from '../hooks'
import { HookContext } from '../interceptors'
import { MutationArgsType } from '../types'
import { composeDecorators } from './decorator.utils'
import { createGqlParamDecorator } from './gql-param.decorator'

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
    // @Args() (composed above) keeps its runtime entry: its value feeds the
    // global validation pipes (ValidationPipe is a no-op on promises, so it
    // must see the raw args) and rejects the resolution on validation errors.
    // Our custom entry runs alongside; since NestJS 12's ValidationPipe
    // resolves asynchronously after this factory's first microtask, we yield
    // to the macrotask queue so it always wins the write to args[index] on
    // success (validation errors abort resolution entirely, like NestJS 11).
    return createGqlParamDecorator(async (data: unknown, executionContext: ExecutionContext) => {
      const gqlExecutionContext = GqlExecutionContext.create(executionContext)
      const gqlContext = gqlExecutionContext.getContext<C>()
      const args = gqlExecutionContext.getArgs<T>()
      const value = fn(transformValue(args, ArgType), gqlContext)
      if (value instanceof Promise) {
        const [hooked] = await Promise.all([value, new Promise<void>((resolve) => setImmediate(resolve))])
        return hooked
      }
      return value
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
