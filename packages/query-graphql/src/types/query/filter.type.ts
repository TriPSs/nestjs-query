import { Field, InputType } from '@nestjs/graphql'
import { Class, Filter, MapReflector } from '@rezonate/nestjs-query-core'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { upperCaseFirst } from 'upper-case-first'

import { getDTONames, getGraphqlObjectName } from '../../common'
import {
  FilterableFieldDescriptor,
  getFilterableFields,
  getQueryOptions,
  getRelations,
  getShareableDTO, setShareable,
  SkipIf
} from '../../decorators'
import { HasRequiredFilter } from '../../decorators/has-required.filter'
import { ResolverRelation } from '../../resolvers'
import { createFilterComparisonType } from './field-comparison'
import { isInAllowedList } from './helpers'

export type FilterTypeOptions = {
  allowedBooleanExpressions?: ('and' | 'or')[]
  /**
   * Disable the free text query
   */
  disableFreeTextQuery?: boolean
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

const filterObjCache = new Map<string, FilterConstructor<unknown>>()

function handleFilterFields<T>(TClass: Class<T>, name: string, fields: FilterableFieldDescriptor[]) {
  const GraphQLFilter = filterObjCache.get(name)
  if (!GraphQLFilter) {
    throw new Error(`No filter type created for ${TClass.name}`)
  }

  if (!fields.length) {
    throw new Error(`No fields found to create GraphQLFilter for ${TClass.name}`)
  }

  const { one = {}, many = {} } = getRelations(TClass)
  const filterableRelations: FilterableRelations = { ...getFilterableRelations(one), ...getFilterableRelations(many) }
  const proto = GraphQLFilter.prototype as object

  const { baseName } = getDTONames(TClass)
  fields.forEach(({ propertyName, target, advancedOptions, returnTypeFunc }) => {
    const FC = createFilterComparisonType({
      FieldType: target,
      fieldName: `${baseName}${upperCaseFirst(propertyName)}`,
      allowedComparisons: advancedOptions?.allowedComparisons,
      isJSON: advancedOptions?.isJSON,
      returnTypeFunc
    })
    const nullable = advancedOptions?.filterRequired !== true
    ValidateNested()(proto, propertyName)
    if (advancedOptions?.filterRequired) {
      HasRequiredFilter()(proto, propertyName)
    }
    Field(() => FC, { nullable })(proto, propertyName)
    Type(() => FC)(proto, propertyName)
  })

  Object.entries(filterableRelations).forEach(([field, FieldType]) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const FC = getOrCreateFilterType(FieldType)
    ValidateNested()(proto, field)
    Field(() => FC, { nullable: true })(proto, field)
    Type(() => FC)(proto, field)
  })
}

function getOrCreateFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  const name = `${getObjectTypeName(TClass)}Filter`
  const cache = filterObjCache.get(name)

  if (cache) return cache

  const fields = getFilterableFields(TClass)
  const isShareable = getShareableDTO(TClass)
  const hasRequiredFilters = fields.some((f) => f.advancedOptions?.filterRequired === true)
  const { allowedBooleanExpressions, disableFreeTextQuery }: FilterTypeOptions = getQueryOptions(TClass) ?? {}
  const isNotAllowedComparison = (val: 'and' | 'or') => !isInAllowedList(allowedBooleanExpressions, val)

  @InputType(name)
  class GraphQLFilter {
    static hasRequiredFilters: boolean = hasRequiredFilters

    @SkipIf(() => disableFreeTextQuery, Field(() => String, { nullable: true }))
    @Type(() => String)
    freeTextQuery?: string

    @ValidateNested()
    @SkipIf(() => isNotAllowedComparison('and'), Field(() => [GraphQLFilter], { nullable: true }))
    @Type(() => GraphQLFilter)
    and?: Filter<T>[]

    @ValidateNested()
    @SkipIf(() => isNotAllowedComparison('or'), Field(() => [GraphQLFilter], { nullable: true }))
    @Type(() => GraphQLFilter)
    or?: Filter<T>[]
  }

  if (isShareable) setShareable(GraphQLFilter)

  filterObjCache.set(name, GraphQLFilter)
  handleFilterFields(TClass, name, fields)

  return GraphQLFilter as FilterConstructor<T>
}

export function FilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass)
}

export function DeleteFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass)
}

export function UpdateFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass)
}

export function SubscriptionFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass)
}

export function AggregateFilterType<T>(TClass: Class<T>): FilterConstructor<T> {
  return getOrCreateFilterType(TClass)
}
