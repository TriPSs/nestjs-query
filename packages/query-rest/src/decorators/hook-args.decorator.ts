import { ArgumentMetadata, Body as NestBody, Inject, Param as NestParam, PipeTransform, Query as NestQuery } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Class, Query } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { Hook, HookTypes } from '../hooks'
import { HookContext } from '../interceptors'
import { MutationArgsType, UpdateOneInputType } from '../types'
import { BuildableQueryType } from '../types/query/buildable-query.type'

class HooksTransformer<T> implements PipeTransform {
  @Inject(REQUEST) protected readonly request!: Request

  public async transform(value: T, metadata: ArgumentMetadata): Promise<MutationArgsType<unknown> | Query<T>> {
    const transformedValue = this.transformValue(value, metadata.metatype)

    if (metadata.type === 'param') {
      return transformedValue as MutationArgsType<T> | Query<T>
    } else if (metadata.type === 'query') {
      return this.runQueryHooks(transformedValue as BuildableQueryType<T>)
    }

    return this.runMutationHooks(transformedValue as T)
  }

  private transformValue<V>(value: V, type?: Class<V>): V {
    if (!type || value instanceof type) {
      return value
    }

    return plainToInstance<V, unknown>(type, value, { excludeExtraneousValues: true })
  }

  private async runMutationHooks(data: T): Promise<MutationArgsType<unknown>> {
    const { hooks, hookType } = this.request as HookContext<Hook<unknown>>
    if (hooks && hooks.length > 0) {
      const context = { req: this.request }
      const isUpdate = hookType === HookTypes.BEFORE_UPDATE_ONE
      let hookedArgs: MutationArgsType<T> | UpdateOneInputType<T> = isUpdate ? { update: data } : { input: data }
      for (const hook of hooks) {
        hookedArgs = (await hook.run(hookedArgs, context)) as MutationArgsType<T> | UpdateOneInputType<T>
      }

      return isUpdate ? { input: hookedArgs } : (hookedArgs as MutationArgsType<T>)
    }

    return { input: data }
  }

  private async runQueryHooks(data: BuildableQueryType<T>): Promise<Query<T>> {
    const hooks = (this.request as HookContext<Hook<unknown>>).hooks
    let hookedArgs = data.buildQuery()

    if (hooks && hooks.length > 0) {
      const context = { req: this.request }
      for (const hook of hooks) {
        hookedArgs = (await hook.run(hookedArgs, context)) as Query<T>
      }

      return hookedArgs
    }

    return hookedArgs
  }
}

export const ParamHookArgs = <DTO, T extends BuildableQueryType<DTO>>(): ParameterDecorator => {
  return NestParam(HooksTransformer<T>)
}

export const QueryHookArgs = <DTO, T extends BuildableQueryType<DTO>>(): ParameterDecorator => {
  return NestQuery(HooksTransformer<T>)
}

export const BodyHookArgs = <T extends MutationArgsType<unknown>>(): ParameterDecorator => {
  return NestBody(HooksTransformer<T>)
}
