import { ArrayReflector, Class, getPrototypeChain, MetaValue } from '@ptc-org/nestjs-query-core'

import { Field, FieldOptions } from '../index'
import { ID_FIELD_KEY } from './constants'

const reflector = new ArrayReflector(ID_FIELD_KEY)

export type IDFieldOptions = FieldOptions & {
  idOnly?: boolean
}

export interface IDFieldDescriptor {
  propertyName: string
  idOnly: boolean
}

/**
 * Decorator for Fields that should be filterable through a [[FilterType]]
 *
 * @example
 *
 * In the following DTO `id`, `title` and `completed` are filterable.
 *
 * ```ts
 * import { IDField } from '@ptc-org/nestjs-query-rest';
 *
 * export class TodoItemDTO {
 *   @IDField()
 *   id!: string;
 * }
 * ```
 */
export function IDField(options?: IDFieldOptions): PropertyDecorator & MethodDecorator {
  return <D>(
    target: object,
    propertyName: string | symbol,
    descriptor?: TypedPropertyDescriptor<D>
  ): TypedPropertyDescriptor<D> | void => {
    reflector.append(target.constructor as Class<unknown>, {
      propertyName: propertyName.toString(),
      idOnly: options?.idOnly ?? false
    })

    delete options?.idOnly

    if (descriptor) {
      return Field(options)(target, propertyName, descriptor)
    }
    return Field(options)(target, propertyName)
  }
}

export function getIDFields<DTO>(DTOClass: Class<DTO>): MetaValue<IDFieldDescriptor[]> {
  return getPrototypeChain(DTOClass).reduce((fields, Cls) => {
    const typeFields = reflector.get<unknown, IDFieldDescriptor>(Cls) ?? []

    return [...typeFields, ...fields]
  }, [] as IDFieldDescriptor[])
}
