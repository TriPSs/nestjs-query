import { Field, InputType } from '@nestjs/graphql'
import { Class, Filter, MapReflector } from '@ptc-org/nestjs-query-core'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { upperCaseFirst } from 'upper-case-first'

import { getDTONames, getGraphqlObjectName } from '../../common'
import { getFilterableFields, getQueryOptions, getRelations, SkipIf } from '../../decorators'
import { HasRequiredFilter } from '../../decorators/has-required.filter'
import { ResolverRelation } from '../../resolvers'
import { createFilterComparisonType } from './field-comparison'
import { isInAllowedList } from './helpers'

const reflector = new MapReflector('nestjs-query:filter-type')
// internal cache is used to exit early if the same filter is requested multiple times
// e.g. if there is a circular reference in the relations
//      `User -> Post -> User-> Post -> ...`
const internalCache = new Map<Class<unknown>, Map<string, FilterConstructor<unknown>>>()

export type FilterTypeOptions = {
  allowedBooleanExpressions?: ('and' | 'or')[]
  filterDepth?: number
}

export type FilterableRelations = Record<string, Class<unknown>>

export interface FilterConstructor<T> {
  hasRequiredFilters: boolean
  new (): Filter<T>
}

function getObjectTypeName<DTO>(DTOClass: Class<DTO>): string {
  return getGraphqlObjectName(DTOClass, 'No fields found to create FilterType.')
}

function getFilterableRelations(relations: Record<string, ResolverRelation<unknown>>): FilterableRelations {
  const filterableRelations: FilterableRelations = {}
  Object.keys(relations).forEach((r) => {
    const opts = relations[r]
    if (opts && opts.allowFiltering) {
      filterableRelations[r] = opts.DTO
    }
  })
  return filterableRelations
}

function getOrCreateFilterType<T>(TClass: Class<T>, name: string, depth = 0): FilterConstructor<T> {
  return reflector.memoize(TClass, name, () => {
    const { one = {}, many = {} } = getRelations(TClass)

    const filterableRelations: FilterableRelations = { ...getFilterableRelations(one), ...getFilterableRelations(many) }
    const filterOptions: FilterTypeOptions = getQueryOptions(TClass) ?? {}

    const { allowedBooleanExpressions } = filterOptions
    const { filterDepth = 1 } = filterOptions

    const fields = getFilterableFields(TClass)

    if (!fields.length) {
      throw new Error(`No fields found to create GraphQLFilter for ${TClass.name}`)
    }

    const hasRequiredFilters = fields.some((f) => f.advancedOptions?.filterRequired === true)
    const isNotAllowedComparison = (val: 'and' | 'or') => !isInAllowedList(allowedBooleanExpressions, val)

    @InputType(name)
    class GraphQLFilter {
      static hasRequiredFilters: boolean = hasRequiredFilters

      @ValidateNested()
      @SkipIf(() => isNotAllowedComparison('and'), Field(() => [GraphQLFilter], { nullable: true }))
      @Type(() => GraphQLFilter)
      and?: Filter<T>[]

      @ValidateNested()
      @SkipIf(() => isNotAllowedComparison('or'), Field(() => [GraphQLFilter], { nullable: true }))
      @Type(() => GraphQLFilter)
      or?: Filter<T>[]
    }

    // if the filter is already in the cache, exist early and return it
    // otherwise add it to the cache early so we don't get into an infinite loop
    let TClassCache = internalCache.get(TClass)

    if (TClassCache && TClassCache.has(name)) {
      return TClassCache.get(name) as FilterConstructor<T>
    } else {
      TClassCache = TClassCache ?? new Map()

      TClassCache.set(name, GraphQLFilter)
      internalCache.set(TClass, TClassCache)
    }

    const { baseName } = getDTONames(TClass)
    fields.forEach(({ propertyName, target, advancedOptions, returnTypeFunc }) => {
      const FC = createFilterComparisonType({
        FieldType: target,
        fieldName: `${baseName}${upperCaseFirst(propertyName)}`,
        allowedComparisons: advancedOptions?.allowedComparisons,
        returnTypeFunc
      })
      const nullable = advancedOptions?.filterRequired !== true
      ValidateNested()(GraphQLFilter.prototype, propertyName)
      if (advancedOptions?.filterRequired) {
        HasRequiredFilter()(GraphQLFilter.prototype, propertyName)
      }
      Field(() => FC, { nullable })(GraphQLFilter.prototype, propertyName)
      Type(() => FC)(GraphQLFilter.prototype, propertyName)
    })

    if (depth <= filterDepth - 1) {
      Object.keys(filterableRelations).forEach((field) => {
        const FieldType = filterableRelations[field]
        // if filterDepth is infinite, we don't want to
        // pass the previous name down and just use the base name
        //
        // e.g. `User -> Post -> Category` would result in
        //      `UserFilter -> UserFilterPostFilter -> UserFilterPostFilterCategoryFilter`
        //      this would lead to an infinite loop, so we just use the base name
        //      `UserFilter -> PostFilter -> CategoryFilter`
        const previousName = Number.isFinite(filterDepth) ? name : ''

        if (FieldType) {
          const FC = getOrCreateFilterType(FieldType, `${previousName}${getObjectTypeName(FieldType)}Filter`, depth + 1)

          ValidateNested()(GraphQLFilter.prototype, field)
          Field(() => FC, { nullable: true })(GraphQLFilter.prototype, field)
          Type(() => FC)(GraphQLFilter.prototype, field)
        }
      })
    }

    return GraphQLFilter as FilterConstructor<T>
  })
}

export function FilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass, `${getObjectTypeName(TClass)}Filter`)
}

export function DeleteFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass, `${getObjectTypeName(TClass)}DeleteFilter`, 1)
}

export function UpdateFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass, `${getObjectTypeName(TClass)}UpdateFilter`, 1)
}

export function SubscriptionFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass, `${getObjectTypeName(TClass)}SubscriptionFilter`, 1)
}

export function AggregateFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass, `${getObjectTypeName(TClass)}AggregateFilter`, 1)
}
