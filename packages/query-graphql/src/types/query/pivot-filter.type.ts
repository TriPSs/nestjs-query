import { InputType, OmitType } from '@nestjs/graphql'
import { Class, MapReflector } from '@ptc-org/nestjs-query-core'

import { DEFAULT_PIVOT_FIELD_NAME, EdgePivotOptions } from '../connection/interfaces'
import { definePivotPropertiesField } from '../pivot-properties-input.type'
import { FilterConstructor, FilterType } from './filter.type'

const reflector = new MapReflector('nestjs-query:pivot-filter-type')

/**
 * `UserGroupsConnection` -> `UserGroupsFilter`.
 */
export const getPivotFilterName = (connectionName: string): string => {
  const suffix = 'Connection'
  const baseName = connectionName.endsWith(suffix) ? connectionName.slice(0, -suffix.length) : connectionName
  return `${baseName}Filter`
}

export interface PivotFilterTypeOpts {
  /**
   * The name of the generated graphql input.
   */
  typeName: string
  pivot: EdgePivotOptions<unknown>
}

/**
 * A filter that also accepts the properties of the relationship.
 *
 * The base filter of the DTO is shared by every connection of that DTO, so a copy is made and the
 * pivot field is added to it - leaving the shared filter untouched.
 */
export function getOrCreatePivotFilterType<DTO>(DTOClass: Class<DTO>, opts: PivotFilterTypeOpts): FilterConstructor<DTO> {
  return reflector.memoize(DTOClass, opts.typeName, () => {
    const BaseFilter = FilterType(DTOClass)
    const PropertiesFilter = FilterType(opts.pivot.DTO)
    const FilterCopy = OmitType(BaseFilter as Class<Record<string, unknown>>, [], InputType)

    @InputType(opts.typeName)
    class PivotFilter extends FilterCopy {
      static hasRequiredFilters: boolean = BaseFilter.hasRequiredFilters
    }

    definePivotPropertiesField(PivotFilter, PropertiesFilter, {
      fieldName: opts.pivot.fieldName ?? DEFAULT_PIVOT_FIELD_NAME,
      nullable: true,
      description: 'Filter by the properties of the relationship.'
    })

    return PivotFilter as FilterConstructor<DTO>
  })
}
