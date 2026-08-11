import { Field, InputType } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'
import { ArrayUnique, IsNotEmpty } from 'class-validator'

import { getDTOIdTypeOrDefault } from '../common'
import { definePivotPropertiesField } from './pivot-properties-input.type'

export interface RelationsInputType<Pivot = unknown> {
  id: string | number
  relationIds: (string | number)[]
  properties?: Pivot
}

export interface RelationsInputTypeOpts {
  /**
   * Also accept the properties of the pivot record, applied to every relation of the mutation.
   */
  pivot?: {
    PropertiesClass: Class<unknown>
    fieldName: string
    description?: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function RelationsInputType(
  DTOClass: Class<unknown>,
  RelationClass: Class<unknown>,
  opts?: RelationsInputTypeOpts
): Class<RelationsInputType> {
  const DTOIDType = getDTOIdTypeOrDefault([DTOClass])
  const RelationIDType = getDTOIdTypeOrDefault([RelationClass])

  @InputType({ isAbstract: true })
  class RelationsInput implements RelationsInputType {
    @Field(() => DTOIDType, { description: 'The id of the record.' })
    @IsNotEmpty()
    id!: string | number

    @Field(() => [RelationIDType], { description: 'The ids of the relations.' })
    @ArrayUnique()
    @IsNotEmpty({ each: true })
    relationIds!: (string | number)[]
  }

  if (opts?.pivot) {
    definePivotPropertiesField(RelationsInput, opts.pivot.PropertiesClass, {
      fieldName: opts.pivot.fieldName,
      nullable: true,
      description: opts.pivot.description ?? 'The properties of the relationship, applied to every relation.'
    })
  }

  return RelationsInput
}
