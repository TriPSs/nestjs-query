import { Filter, FilterComparisons, FilterFieldComparison } from '@ptc-org/nestjs-query-core'
import { Document, FilterQuery, Model as MongooseModel } from 'mongoose'

import { ComparisonBuilder, EntityComparisonField } from './comparison.builder'

/**
 * @internal
 * Builds a WHERE clause from a Filter.
 */
export class WhereBuilder<Entity extends Document> {
  constructor(
    readonly Model: MongooseModel<Entity>,
    readonly comparisonBuilder: ComparisonBuilder<Entity> = new ComparisonBuilder(Model)
  ) {}

  /**
   * Builds a WHERE clause from a Filter.
   * @param filter - the filter to build the WHERE clause from.
   */
  build(filter: Filter<Entity>): FilterQuery<Entity> {
    const normalizedFilter = this.getNormalizedFilter(filter)
    const { and, or } = normalizedFilter
    let ands: FilterQuery<Entity>[] = []
    let ors: FilterQuery<Entity>[] = []
    let filterQuery: FilterQuery<Entity> = {}
    if (and && and.length) {
      ands = and.map((f) => this.build(f))
    }
    if (or && or.length) {
      ors = or.map((f) => this.build(f))
    }
    const filterAnds = this.filterFields(normalizedFilter)
    if (filterAnds) {
      ands = [...ands, filterAnds]
    }
    if (ands.length) {
      filterQuery = { ...filterQuery, $and: ands } as FilterQuery<Entity>
    }
    if (ors.length) {
      filterQuery = { ...filterQuery, $or: ors } as FilterQuery<Entity>
    }
    return filterQuery
  }

  /**
   * Normalizes a filter to a dot notation filter for objects with sub objects.
   * @param filter - the filter to normalize.
   * @private
   */
  private getNormalizedFilter(filter: Filter<Entity>): Filter<Entity> {
    if (!this.isGraphQLFilter(filter)) return filter
    const newFilter = {}
    const keys = Object.keys(filter)
    // Converting to dot notation
    for (const key of keys) {
      const value = filter[key]
      if (!['and', 'or'].includes(key) && this.isGraphQLFilter(value)) {
        const subFilter = this.getNormalizedFilter(value as Filter<Entity>)
        for (const subKey of Object.keys(subFilter)) {
          newFilter[`${key}.${subKey}`] = subFilter[subKey]
        }
      } else {
        newFilter[key] = value
      }
    }
    return newFilter
  }

  /**
   * Checks if a filter is a GraphQLFilter.
   * @param filter - the filter to check.
   * @private
   */
  private isGraphQLFilter = (filter: unknown) =>
    typeof filter === `object` && !Array.isArray(filter) && filter?.constructor?.name === 'GraphQLFilter'

  /**
   * Creates field comparisons from a filter. This method will ignore and/or properties.
   * @param filter - the filter with fields to create comparisons for.
   */
  private filterFields(filter: Filter<Entity>): FilterQuery<Entity> | undefined {
    const ands = Object.keys(filter)
      .filter((f) => f !== 'and' && f !== 'or')
      .map((field) => this.withFilterComparison(field as keyof Entity, this.getField(filter, field as keyof Entity)))
    if (ands.length === 1) {
      return ands[0]
    }
    if (ands.length) {
      return { $and: ands } as FilterQuery<Entity>
    }
    return undefined
  }

  private getField<K extends keyof FilterComparisons<Entity>>(
    obj: FilterComparisons<Entity>,
    field: K
  ): FilterFieldComparison<Entity[K]> {
    return obj[field] as FilterFieldComparison<Entity[K]>
  }

  private withFilterComparison<T extends keyof Entity>(field: T, cmp: FilterFieldComparison<Entity[T]>): FilterQuery<Entity> {
    const opts = Object.keys(cmp) as (keyof FilterFieldComparison<Entity[T]>)[]
    if (opts.length === 1) {
      const cmpType = opts[0]
      return this.comparisonBuilder.build(field, cmpType, cmp[cmpType] as EntityComparisonField<Entity, T>)
    }
    return {
      $or: opts.map((cmpType) => this.comparisonBuilder.build(field, cmpType, cmp[cmpType] as EntityComparisonField<Entity, T>))
    } as FilterQuery<Entity>
  }
}
