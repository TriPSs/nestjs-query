import { applyDecorators } from '@nestjs/common'
import { Class, Filter, MapReflector } from '@ptc-org/nestjs-query-core'

import { Field, filterableFieldOptionsToField, getFilterableFields } from '../../decorators'

const reflector = new MapReflector('nestjs-query:filter-type')
// internal cache is used to exit early if the same filter is requested multiple times
// e.g. if there is a circular reference in the relations
//      `User -> Post -> User-> Post -> ...`
const internalCache = new Map<Class<unknown>, Map<string, FilterConstructor<unknown>>>()

export interface FilterConstructor<T> {
  hasRequiredFilters: boolean

  new (): Filter<T>
}

function getOrCreateFilterType<T>(
  TClass: Class<T>,
  prefix: string | null,
  suffix: string | null,
  BaseClass: Class<any>
): FilterConstructor<T> {
  const $prefix = prefix ?? ''
  const $suffix = suffix ?? ''

  const name = `${$prefix}${TClass.name}${$suffix}`
  const typeName = `${name}Filter`

  return reflector.memoize(TClass, typeName, () => {
    const fields = getFilterableFields(TClass)

    // if the filter is already in the cache, exist early and return it
    // otherwise add it to the cache early so we don't get into an infinite loop
    let TClassCache = internalCache.get(TClass)

    if (TClassCache && TClassCache.has(typeName)) {
      return TClassCache.get(typeName) as FilterConstructor<T>
    }

    const hasRequiredFilters = fields.some((f) => f.advancedOptions?.filterRequired === true)

    class QueryFilter extends BaseClass {
      static hasRequiredFilters: boolean = hasRequiredFilters

      public get filter(): Filter<T> {
        const filters = fields.reduce((filter, field) => {
          if (this[field.schemaName]) {
            filter[field.schemaName] = { eq: this[field.schemaName] }
          }

          return filter
        }, {} as Filter<T>)

        if (Object.keys(filters).length > 0) {
          return filters
        }

        return super.filter
      }
    }

    fields.forEach(({ schemaName, advancedOptions }) => {
      applyDecorators(
        Field(
          filterableFieldOptionsToField({
            ...advancedOptions,
            nullable:
              typeof advancedOptions.filterRequired !== 'undefined' ? !advancedOptions.filterRequired : advancedOptions.nullable,
            required: Boolean(
              typeof advancedOptions.filterRequired !== 'undefined' ? advancedOptions.filterRequired : advancedOptions.required
            )
          })
        ),
        ...(advancedOptions.filterDecorators || [])
      )(QueryFilter.prototype, schemaName)
    })

    TClassCache = TClassCache ?? new Map()

    TClassCache.set(typeName, QueryFilter)
    internalCache.set(TClass, TClassCache)

    return QueryFilter as never as FilterConstructor<T>
  })
}

export function FilterType<T>(TClass: Class<T>, BaseClass: Class<unknown>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass, null, null, BaseClass)
}

// export function DeleteFilterType<T>(TClass: Class<T>, BaseClass: Class<unknown>): FilterConstructor<T> {
//   return getOrCreateFilterType(TClass, null, 'Delete', BaseClass)
// }
//
// export function UpdateFilterType<T>(TClass: Class<T>, BaseClass: Class<unknown>): FilterConstructor<T> {
//   return getOrCreateFilterType(TClass, null, 'Update', BaseClass)
// }
//
// export function SubscriptionFilterType<T>(TClass: Class<T>, BaseClass: Class<unknown>): FilterConstructor<T> {
//   return getOrCreateFilterType(TClass, null, 'Subscription', BaseClass)
// }
//
// export function AggregateFilterType<T>(TClass: Class<T>, BaseClass: Class<unknown>): FilterConstructor<T> {
//   return getOrCreateFilterType(TClass, null, 'Aggregate', BaseClass)
// }
