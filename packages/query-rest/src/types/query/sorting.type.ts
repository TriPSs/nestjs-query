import { BadRequestException } from '@nestjs/common'
import { Class, SortDirection, SortField, SortNulls } from '@ptc-org/nestjs-query-core'
import { IsIn, ValidateIf } from 'class-validator'

import { Field, getFilterableFields, SkipIf } from '../../decorators'
import { BaseQueryArgsTypeOpts } from './query-args/interfaces'

export function createSortingQueryArgs<DTO>(DTOClass: Class<DTO>, opts: BaseQueryArgsTypeOpts<DTO>) {
  const fields = getFilterableFields(DTOClass)
  const sorts = new Map<string, SortField<DTO>>()
  for (const field of fields) {
    for (const direction of Object.values(SortDirection)) {
      const sort = { field: field.propertyName as keyof DTO, direction }
      const key = `${field.advancedOptions?.name ?? field.schemaName}:${direction}`
      sorts.set(key, sort)
      for (const nulls of Object.keys(SortNulls) as (keyof typeof SortNulls)[]) {
        sorts.set(`${key}:${nulls}`, { ...sort, nulls: SortNulls[nulls] })
      }
    }
  }
  const values = [...sorts.keys()]
  const hasSortFilter = fields.some((field) => field.schemaName === 'sort' || field.advancedOptions?.name === 'sort')
  const disableSort = !!opts.disableSort || values.length === 0 || hasSortFilter

  class SortingQueryArgs {
    @SkipIf(
      () => disableSort,
      Field(() => [String], {
        required: false,
        skipRequired: true,
        forceArray: true,
        minItems: 1,
        enum: values,
        skipIsEnum: true,
        description: 'Sort by field:ASC or field:DESC. Repeat for multiple fields. Optionally append :NULLS_FIRST or :NULLS_LAST.'
      }),
      ValidateIf((_object, value: unknown) => value !== undefined),
      IsIn(values, { each: true })
    )
    sort?: string[]

    public get sorting(): SortField<DTO>[] | undefined {
      if (disableSort || this.sort === undefined) {
        return opts.defaultSort
      }
      if (!Array.isArray(this.sort) || this.sort.length === 0) {
        throw new BadRequestException('sort must contain at least one field:ASC or field:DESC value')
      }
      return this.sort.map((value) => {
        const sort = sorts.get(value)
        if (!sort) {
          throw new BadRequestException('Invalid sort value. Use a filterable field followed by :ASC or :DESC.')
        }
        return { ...sort }
      })
    }
  }

  return SortingQueryArgs
}
