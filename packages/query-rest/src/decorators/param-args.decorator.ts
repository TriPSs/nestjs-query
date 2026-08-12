import { ArgumentMetadata, Param as NestParam, PipeTransform } from '@nestjs/common'
import { Class, Query } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { MutationArgsType, ParamArgsType } from '../types'

class ParamTransformer<T> implements PipeTransform {
  public transform(value: T, metadata: ArgumentMetadata): MutationArgsType<T> | Query<T> {
    return this.transformValue(value, metadata.metatype) as MutationArgsType<T> | Query<T>
  }

  private transformValue<V>(value: V, type?: Class<V>): V {
    if (!type || value instanceof type) {
      return value
    }

    return plainToInstance<V, unknown>(type, value, { excludeExtraneousValues: true })
  }
}

export const ParamArgs = <T extends Class<ParamArgsType>>(): ParameterDecorator => {
  return NestParam(ParamTransformer<T>)
}
