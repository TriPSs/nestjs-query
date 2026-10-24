import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql'
import { Class, MapReflector } from '@ptc-org/nestjs-query-core'
import { Type } from 'class-transformer'
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator'

import { getDTOIdTypeOrDefault } from '../common'

const reflector = new MapReflector('nestjs-query:pivot-properties-type')

export interface PivotPropertiesInputType<Pivot> {
  id: string | number
  relationId: string | number
  properties: Pivot
}

export interface PivotPropertiesTypeOpts<Pivot> {
  /**
   * The name of the generated graphql input.
   */
  typeName: string
  /**
   * Fields of the pivot DTO that identify the relationship and must not be writable.
   */
  omit: (keyof Pivot & string)[]
}

/**
 * Builds the input type of the pivot properties themselves, dropping the fields that identify the
 * relationship (the parent/node keys).
 */
export function getOrCreatePivotPropertiesType<Pivot>(
  PivotClass: Class<Pivot>,
  opts: PivotPropertiesTypeOpts<Pivot>
): Class<Partial<Pivot>> {
  return reflector.memoize(PivotClass, opts.typeName, () => {
    const PivotBase = PartialType(
      OmitType(PivotClass as Class<Record<string, unknown>>, opts.omit as string[], InputType),
      InputType
    )

    @InputType(opts.typeName)
    class PivotProperties extends PivotBase {}

    return PivotProperties as Class<Partial<Pivot>>
  })
}

/**
 * Declares the pivot properties field on an input type.
 *
 * The name of the field is user defined, so the decorators are applied programmatically.
 */
export function definePivotPropertiesField(
  InputClass: Class<unknown>,
  PropertiesClass: Class<unknown>,
  opts: { fieldName: string; nullable?: boolean; description?: string }
): void {
  const { fieldName, nullable, description } = opts
  // eslint-disable-next-line @typescript-eslint/ban-types
  const target = InputClass.prototype as Object

  Field(() => PropertiesClass, {
    nullable,
    description: description ?? 'The properties of the relationship.'
  })(target, fieldName)
  ValidateNested()(target, fieldName)
  Type(() => PropertiesClass)(target, fieldName)

  if (nullable) {
    IsOptional()(target, fieldName)
  }
}

/**
 * Builds the input used to write the properties of a single pivot record.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function PivotPropertiesInputType<DTO, Relation, Pivot>(
  DTOClass: Class<DTO>,
  RelationClass: Class<Relation>,
  PropertiesClass: Class<Partial<Pivot>>,
  opts: { fieldName: string; description?: string }
): Class<PivotPropertiesInputType<Pivot>> {
  const DTOIDType = getDTOIdTypeOrDefault([DTOClass])
  const RelationIDType = getDTOIdTypeOrDefault([RelationClass])

  @InputType({ isAbstract: true })
  class PivotPropertiesInput {
    @Field(() => DTOIDType, { description: 'The id of the record.' })
    @IsNotEmpty()
    id!: string | number

    @Field(() => RelationIDType, { description: 'The id of relation.' })
    @IsNotEmpty()
    relationId!: string | number
  }

  definePivotPropertiesField(PivotPropertiesInput, PropertiesClass, {
    fieldName: opts.fieldName,
    description: opts.description
  })

  return PivotPropertiesInput as Class<PivotPropertiesInputType<Pivot>>
}
