import { Filter, FilterComparisons, FilterFieldComparison } from '../interfaces'
import { ComparisonBuilder } from './comparison.builder'
import {
  getFilterFieldComparison,
  getUnknownComparisonOperators,
  isComparison,
  isFilterableObject,
  isGroupingKey
} from './filter.helpers'
import { InvalidFilterError } from './invalid-filter.error'
import { ComparisonField, FilterFn } from './types'

const FILTER_VALUE_SHAPE =
  'A filter value must either compare a field, where every key is an operator (e.g. { eq: 1 }), or nest a filter, ' +
  'where every key is a field (e.g. { relation: { eq: 1 } }).'

export class FilterBuilder {
  static build<DTO>(filter: Filter<DTO>): FilterFn<DTO> {
    const { and, or } = filter
    const filters: FilterFn<DTO>[] = []

    if (and && and.length) {
      filters.push(this.andFilterFn(...and.map((f) => this.build(f))))
    }

    if (or && or.length) {
      filters.push(this.orFilterFn(...or.map((f) => this.build(f))))
    }
    if (Object.keys(filter).length) {
      filters.push(this.filterFieldsOrNested(filter))
    }
    return this.andFilterFn(...filters)
  }

  private static andFilterFn<DTO>(...filterFns: FilterFn<DTO>[]): FilterFn<DTO> {
    return (dto) => filterFns.every((filter) => filter(dto))
  }

  private static orFilterFn<DTO>(...filterFns: FilterFn<DTO>[]): FilterFn<DTO> {
    return (dto) => filterFns.some((filter) => filter(dto))
  }

  private static filterFieldsOrNested<DTO>(filter: Filter<DTO>): FilterFn<DTO> {
    return this.andFilterFn(
      ...Object.keys(filter)
        .filter((k) => !isGroupingKey(k))
        .map((fieldOrNested) => this.withComparison(filter, fieldOrNested as keyof DTO))
    )
  }

  private static withFilterComparison<DTO, T extends keyof DTO>(field: T, cmp: FilterFieldComparison<DTO[T]>): FilterFn<DTO> {
    const operators = Object.keys(cmp) as (keyof FilterFieldComparison<DTO[T]>)[]
    return this.orFilterFn(
      ...operators.map((operator) => ComparisonBuilder.build(field, operator, cmp[operator] as ComparisonField<DTO, T>))
    )
  }

  private static withComparison<DTO>(filter: FilterComparisons<DTO>, fieldOrNested: keyof DTO): FilterFn<DTO> {
    const value = getFilterFieldComparison(filter, fieldOrNested)
    if (isComparison(value)) {
      return this.withFilterComparison(fieldOrNested, value)
    }
    if (typeof value !== 'object') {
      throw new InvalidFilterError(`unknown comparison ${JSON.stringify(fieldOrNested)}`)
    }
    const unknownOperators = getUnknownComparisonOperators(value)
    if (unknownOperators.length) {
      throw this.unreadableFieldError(fieldOrNested, unknownOperators)
    }
    const nestedFilterFn = this.build(value)
    return (dto?: DTO) => nestedFilterFn(this.nestedValue(dto, fieldOrNested, value))
  }

  private static nestedValue<DTO>(dto: DTO | undefined, fieldOrNested: keyof DTO, nestedFilter: Filter<DTO[keyof DTO]>) {
    const nested = dto ? dto[fieldOrNested] : null
    if (nested !== null && nested !== undefined && !isFilterableObject(nested)) {
      throw this.unreadableFieldError(
        fieldOrNested,
        Object.keys(nestedFilter),
        `${JSON.stringify(fieldOrNested)} holds ${this.describeValue(nested)}, so those keys cannot be nested filter fields.`
      )
    }
    return nested
  }

  private static unreadableFieldError<DTO>(field: keyof DTO, keys: string[], reason?: string): InvalidFilterError {
    const quotedKeys = keys.map((key) => JSON.stringify(key)).join(', ')
    return new InvalidFilterError(
      [`unknown comparison ${quotedKeys} for field ${JSON.stringify(field)}.`, reason, FILTER_VALUE_SHAPE]
        .filter(Boolean)
        .join(' ')
    )
  }

  private static describeValue(value: unknown): string {
    if (Array.isArray(value)) {
      return 'an array'
    }
    if (value instanceof Date) {
      return 'a Date'
    }
    return `a ${typeof value}`
  }
}
