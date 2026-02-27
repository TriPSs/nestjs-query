import { ArgumentMetadata, Body as NestBody, Inject, Param as NestParam, PipeTransform, Query as NestQuery } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Class, Query } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { Hook } from '../hooks'
import { HookContext } from '../interceptors'
import { MutationArgsType } from '../types'
import { BuildableQueryType } from '../types/query/buildable-query.type'

class HooksTransformer<T> implements PipeTransform {
  @Inject(REQUEST) protected readonly request: Request

  public async transform(value: T, metadata: ArgumentMetadata): Promise<MutationArgsType<T> | Query<T>> {
    const transformedValue = this.transformValue(value, metadata.metatype)

    if (metadata.type === 'param') {
      return transformedValue
    } else if (metadata.type === 'query') {
      return this.runQueryHooks(transformedValue)
    }

    return this.runMutationHooks(transformedValue)
  }

  private transformValue<T>(value: T, type?: Class<T>): T {
    if (!type || value instanceof type) {
      return value
    }

    return plainToInstance<T, unknown>(type, value, { excludeExtraneousValues: true })
  }

  private async runMutationHooks(data: T): Promise<MutationArgsType<T>> {
    const hooks = (this.request as HookContext<Hook<unknown>>).hooks
    if (hooks && hooks.length > 0) {
      let hookedArgs = { input: data }
      for (const hook of hooks) {
        hookedArgs = (await hook.run(hookedArgs, this.request)) as MutationArgsType<T>
      }

      return hookedArgs
    }

    return { input: data }
  }

  private async runQueryHooks(data: BuildableQueryType<T>): Promise<Query<T>> {
    const hooks = (this.request as HookContext<Hook<unknown>>).hooks
    let hookedArgs = data.buildQuery()

    if (hooks && hooks.length > 0) {
      for (const hook of hooks) {
        hookedArgs = (await hook.run(hookedArgs, this.request)) as Query<T>
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
