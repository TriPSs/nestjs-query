import { Class, MetaValue, ValueReflector } from '@ptc-org/nestjs-query-core'

import { Field, FieldOptions } from '../index'
import { ID_FIELD_KEY } from './constants'

const reflector = new ValueReflector(ID_FIELD_KEY)

export interface IDFieldOptions extends FieldOptions {
  idOnly?: boolean
}

export interface IDFieldDescriptor {
  propertyName: string
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
    reflector.set(target.constructor as Class<unknown>, {
      propertyName: propertyName.toString()
    })

    if (options?.idOnly) {
      return
    }

    if (descriptor) {
      return Field(options)(target, propertyName, descriptor)
    }
    return Field(options)(target, propertyName)
  }
}

export function getIDField<DTO>(DTOClass: Class<DTO>): MetaValue<IDFieldDescriptor> {
  return reflector.get<DTO, IDFieldDescriptor>(DTOClass, true)
}
