import { Field, ObjectType, TypeMetadataStorage } from '@nestjs/graphql'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { ExportArgsType, FilterableField, Relation } from '../../../src'
import { getDTOFields } from '../../../src/types/export/export-args.helpers'
import { getOrCreateExportFieldInputType } from '../../../src/types/export/export-field-input.type'

describe('ExportArgsType', () => {
  @ObjectType()
  class ExportBaseDTO {
    @FilterableField()
    id!: string
  }

  @ObjectType()
  class ExportOwnerDTO extends ExportBaseDTO {
    @Field()
    name!: string
  }

  @ObjectType()
  @Relation('owner', () => ExportOwnerDTO)
  class ExportItemDTO extends ExportBaseDTO {
    @Field({ name: 'displayTitle' })
    title!: string

    secret!: string
  }

  it('loads fields before schema compilation, including inherited and relation fields', () => {
    expect(TypeMetadataStorage.getObjectTypeMetadataByTarget(ExportItemDTO)?.properties).toBeUndefined()
    expect(getDTOFields(ExportItemDTO)).toEqual(['id', 'title', 'owner.id', 'owner.name'])
  })

  it('reuses the input type for the same DTO', () => {
    expect(getOrCreateExportFieldInputType(ExportItemDTO)).toBe(getOrCreateExportFieldInputType(ExportItemDTO))
  })

  it('validates and transforms inherited, ordinary and relation fields and preserves labels', async () => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), {
      fields: [{ field: 'id' }, { field: 'title', label: 'Title' }, { field: 'owner.name' }]
    })

    expect(await validate(args, { whitelist: true })).toEqual([])
    expect(args.fields[1].label).toBe('Title')
    expect(args.fields[0]).toBeInstanceOf(getOrCreateExportFieldInputType(ExportItemDTO))
  })

  it.each(['secret', 'displayTitle', 'owner.secret', 'missing'])('rejects unknown field %s', async (field) => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), { fields: [{ field }] })

    const errors = await validate(args)
    expect(errors[0].children?.[0].children?.[0].constraints).toHaveProperty('isIn')
  })

  it.each([undefined, null, [], { field: 'id' }])('rejects missing, empty or non-array fields: %j', async (fields) => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), { fields })

    expect(await validate(args)).not.toHaveLength(0)
  })

  it('rejects non-string labels', async () => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), { fields: [{ field: 'id', label: 123 }] })

    const errors = await validate(args)
    expect(errors[0].children?.[0].children?.[0].constraints).toHaveProperty('isString')
  })
})
