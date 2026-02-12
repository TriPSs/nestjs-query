import { ArgumentMetadata, Param as NestParam, PipeTransform } from '@nestjs/common'
import { Class, Query } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { MutationArgsType, ParamArgsType } from '../types'

class ParamTransformer<T> implements PipeTransform {
  public async transform(value: T, metadata: ArgumentMetadata): Promise<MutationArgsType<T> | Query<T>> {
    return this.transformValue(value, metadata.metatype)
  }

  private transformValue<T>(value: T, type?: Class<T>): T {
    if (!type || value instanceof type) {
      return value
    }

    return plainToInstance<T, unknown>(type, value, { excludeExtraneousValues: true })
  }
}

export const ParamArgs = <T extends Class<ParamArgsType>>(): ParameterDecorator => {
  return NestParam(ParamTransformer<T>)
}
