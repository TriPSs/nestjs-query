import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'
import { Expose, Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator'

import { getEnumType, restoreEnumBlankValues } from '../common'
import { ReturnTypeFunc } from '../interfaces/return-type-func'

const OPENAPI_METADATA_FACTORY = '_OPENAPI_METADATA_FACTORY'

export type FieldOptions = ApiPropertyOptions & {
  // prevents the IsEnum decorator from being added
  skipIsEnum?: boolean
  skipRequired?: boolean
  forceArray?: boolean
}

/**
 * Decorator for fields that should be filterable through a [[FilterType]].
 *
 * @example
 *
 * In the following DTO `id`, `title` and `completed` are filterable.
 *
 * ```ts
 * import { FilterableField } from '@ptc-org/nestjs-query-rest';
 *
 * export class TodoItemDTO {
 *   @FilterableField()
 *   id!: string
 *
 *   @FilterableField()
 *   title!: string
 *
 *   @FilterableField()
 *   completed!: boolean
 *
 *   created!: Date
 *
 *   updated!: Date
 * }
 * ```
 */
export function Field(): PropertyDecorator & MethodDecorator
export function Field(options: FieldOptions): PropertyDecorator & MethodDecorator
export function Field(returnTypeFunction?: ReturnTypeFunc, options?: FieldOptions): PropertyDecorator & MethodDecorator
export function Field(
  returnTypeFuncOrOptions?: ReturnTypeFunc | FieldOptions,
  maybeOptions?: FieldOptions
): MethodDecorator | PropertyDecorator {
  let returnTypeFunc: ReturnTypeFunc | undefined
  let advancedOptions: FieldOptions | undefined
  if (typeof returnTypeFuncOrOptions === 'function') {
    returnTypeFunc = returnTypeFuncOrOptions
    advancedOptions = maybeOptions
  } else if (typeof returnTypeFuncOrOptions === 'object') {
    advancedOptions = returnTypeFuncOrOptions
  } else if (typeof maybeOptions === 'object') {
    advancedOptions = maybeOptions
  }

  return <D>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<D>) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const metadataType = target?.constructor?.[OPENAPI_METADATA_FACTORY]?.()[propertyKey]?.type as ReturnTypeFunc | undefined
    const returnedType = !returnTypeFunc
      ? (metadataType?.() ?? Reflect.getMetadata('design:type', target, propertyKey))
      : returnTypeFunc()

    const isArray = returnedType && Array.isArray(returnedType)
    const type = isArray ? returnedType[0] : returnedType

    const options = {
      required: !advancedOptions?.nullable && advancedOptions?.default === undefined,
      example: advancedOptions?.default,
      ...advancedOptions
    }

    // TypeScript emits Object as the design type for enum properties. Infer the
    // primitive type from the enum so Swagger does not generate an Object schema.
    const enumType = getEnumType(options.enum)
    const resolvedType = type === Object ? (enumType ?? type) : type

    // Remove non-valid options
    delete options.forceArray
    delete options.skipIsEnum
    delete options.skipRequired

    const decorators: Array<PropertyDecorator> = [
      Expose({ name: advancedOptions?.name }),
      ApiProperty({
        type: metadataType ?? resolvedType,
        isArray: metadataType ? undefined : isArray,
        ...(options as ApiPropertyOptions)
      })
    ]

    if (isArray) {
      decorators.push(IsArray())
    }

    if (isArray && options.maxItems !== undefined) {
      decorators.push(ArrayMaxSize(options.maxItems))
    }

    if (isArray && options.minItems !== undefined) {
      decorators.push(ArrayMinSize(options.minItems))
    }

    if (isArray && advancedOptions?.forceArray) {
      decorators.push(Transform(({ value }) => (value == null || Array.isArray(value) ? value : [value]) as unknown[]))
    }

    if (!advancedOptions?.skipRequired) {
      if (options.required) {
        decorators.push(IsNotEmpty())
      } else {
        decorators.push(IsOptional())
      }
    }

    if (options.minLength !== undefined) {
      decorators.push(MinLength(options.minLength))
    }

    if (options.maxLength !== undefined) {
      decorators.push(MaxLength(options.maxLength))
    }

    if (options.minimum !== undefined) {
      decorators.push(Min(options.minimum))
    }

    if (options.maximum !== undefined) {
      decorators.push(Max(options.maximum))
    }

    if (resolvedType && resolvedType !== Boolean) {
      decorators.push(Type(() => resolvedType as never))

      if (resolvedType === Number && options.enum) {
        decorators.push(
          Transform(({ value, obj, key }): unknown => restoreEnumBlankValues((obj as Record<string, unknown>)[key], value))
        )
      }
    }

    if (resolvedType === String) {
      decorators.push(IsString({ each: isArray }))
    } else if (resolvedType === Number) {
      decorators.push(IsNumber({}, { each: isArray }))
    } else if (resolvedType === Date) {
      decorators.push(IsDate({ each: isArray }))
    } else if (resolvedType === Boolean) {
      // Boolean('false') is true, so parse HTTP query parameter values explicitly.
      decorators.push(
        Transform(({ value }: { value: unknown }): unknown => (value === 'true' ? true : value === 'false' ? false : value)),
        IsBoolean({ each: isArray })
      )
    } else if ((returnTypeFunc || metadataType) && typeof resolvedType === 'function') {
      decorators.push(ValidateNested({ each: isArray }))

      if (!isArray) {
        decorators.push(IsObject())
      }
    }

    if (options.enum && !advancedOptions?.skipIsEnum) {
      decorators.push(IsEnum(options.enum, { each: isArray }))
    }

    return applyDecorators(...decorators)(target, propertyKey, descriptor)
  }
}
