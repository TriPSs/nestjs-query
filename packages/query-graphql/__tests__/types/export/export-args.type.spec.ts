import { Field, ObjectType, PickType, TypeMetadataStorage } from '@nestjs/graphql'
import { Expose, plainToInstance } from 'class-transformer'
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
    expect(getDTOFields(ExportItemDTO)).toEqual(['id', 'displayTitle', 'owner.id', 'owner.name'])
  })

  it('reuses the input type for the same DTO', () => {
    expect(getOrCreateExportFieldInputType(ExportItemDTO)).toBe(getOrCreateExportFieldInputType(ExportItemDTO))
  })

  it('validates and transforms inherited, ordinary and relation fields and preserves labels', async () => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), {
      fields: [{ field: 'id' }, { field: 'displayTitle', label: 'Title' }, { field: 'owner.name' }]
    })

    expect(await validate(args, { whitelist: true })).toEqual([])
    expect(args.fields[1].label).toBe('Title')
    expect(args.fields[0]).toBeInstanceOf(getOrCreateExportFieldInputType(ExportItemDTO))
  })

  it.each(['secret', 'title', 'owner.secret', 'owner.company.name', 'missing'])('rejects unknown field %s', async (field) => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), { fields: [{ field }] })

    const errors = await validate(args)
    expect(errors[0]?.children?.[0]?.children?.[0]?.constraints).toHaveProperty('isIn')
  })

  it.each([undefined, null, [], { field: 'id' }])('rejects missing, empty or non-array fields: %j', async (fields) => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), { fields })

    expect(await validate(args)).not.toHaveLength(0)
  })

  it('rejects duplicate fields even with different labels', async () => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), {
      fields: [
        { field: 'id', label: 'First' },
        { field: 'id', label: 'Second' }
      ]
    })

    expect((await validate(args))[0]?.constraints).toHaveProperty('arrayUnique')
  })

  it('rejects non-string labels', async () => {
    const args = plainToInstance(ExportArgsType(ExportItemDTO), { fields: [{ field: 'id', label: 123 }] })

    const errors = await validate(args)
    expect(errors[0]?.children?.[0]?.children?.[0]?.constraints).toHaveProperty('isString')
  })

  describe('with a separate export DTO', () => {
    @ObjectType()
    class ExportBase extends PickType(ExportBaseDTO, ['id']) {}

    @ObjectType()
    class OwnerExport extends ExportBase {
      @Field()
      name!: string
    }

    @ObjectType()
    @Relation('owner', () => OwnerExport)
    class ItemExport extends ExportBase {
      @Field({ name: 'displayHeading' })
      heading!: string

      @Expose()
      secret!: string
    }

    it('uses inherited GraphQL fields, mapped types and relations from the export DTO', async () => {
      expect(getDTOFields(ItemExport)).toEqual(['id', 'displayHeading', 'owner.id', 'owner.name'])
      const args = plainToInstance(ExportArgsType(ExportItemDTO, ItemExport), {
        fields: [{ field: 'id' }, { field: 'displayHeading' }, { field: 'owner.name' }]
      })

      expect(await validate(args)).toEqual([])
    })

    it.each(['title', 'secret', 'heading', 'owner.secret'])(
      'rejects fields not declared as GraphQL fields on the export DTO: %s',
      async (field) => {
        const args = plainToInstance(ExportArgsType(ExportItemDTO, ItemExport), { fields: [{ field }] })

        const errors = await validate(args)
        expect(errors[0]?.children?.[0]?.children?.[0]?.constraints).toHaveProperty('isIn')
      }
    )

    it('caches each export DTO separately from the default fields', () => {
      const first = getOrCreateExportFieldInputType(ExportItemDTO, ItemExport)
      const second = getOrCreateExportFieldInputType(ExportItemDTO, ExportBase)
      const defaultType = getOrCreateExportFieldInputType(ExportItemDTO)

      expect(first).toBe(getOrCreateExportFieldInputType(ExportItemDTO, ItemExport))
      expect(first).toBe(getOrCreateExportFieldInputType(ExportOwnerDTO, ItemExport))
      expect(first).toBe(getOrCreateExportFieldInputType(ItemExport))
      expect(first).not.toBe(second)
      expect(first).not.toBe(defaultType)
      expect(second).not.toBe(defaultType)
    })

    it('rejects export DTOs without GraphQL object metadata', () => {
      class UndecoratedExport {
        @Expose()
        name!: string
      }

      expect(() => ExportArgsType(ExportItemDTO, UndecoratedExport)).toThrow()
    })
  })
})
