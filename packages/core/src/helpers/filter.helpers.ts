import { BadRequestException } from '@nestjs/common'

import { Filter, FilterComparisons, FilterFieldComparison } from '../interfaces'
import { FilterBuilder } from './filter.builder'
import { QueryFieldMap } from './query.helpers'

export type LikeComparisonOperators = 'like' | 'notLike' | 'iLike' | 'notILike'
export type InComparisonOperators = 'in' | 'notIn'
export type BetweenComparisonOperators = 'between' | 'notBetween'
export type RangeComparisonOperators = 'gt' | 'gte' | 'lt' | 'lte'
export type BooleanComparisonOperators = 'eq' | 'neq' | 'is' | 'isNot'

export const isLikeComparisonOperator = (op: unknown): op is LikeComparisonOperators =>
  op === 'like' || op === 'notLike' || op === 'iLike' || op === 'notILike'

export const isInComparisonOperators = (op: unknown): op is InComparisonOperators => op === 'in' || op === 'notIn'

export const isBetweenComparisonOperators = (op: unknown): op is BetweenComparisonOperators =>
  op === 'between' || op === 'notBetween'

export const isRangeComparisonOperators = (op: unknown): op is RangeComparisonOperators =>
  op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte'

export const isBooleanComparisonOperators = (op: unknown): op is BooleanComparisonOperators =>
  op === 'eq' || op === 'neq' || op === 'is' || op === 'isNot'

export type ComparisonOperators =
  | LikeComparisonOperators
  | InComparisonOperators
  | BetweenComparisonOperators
  | RangeComparisonOperators
  | BooleanComparisonOperators

export const isGroupingKey = (key: unknown): key is 'and' | 'or' => key === 'and' || key === 'or'

export const isComparisonOperator = (op: unknown): op is ComparisonOperators =>
  isLikeComparisonOperator(op) ||
  isInComparisonOperators(op) ||
  isBetweenComparisonOperators(op) ||
  isRangeComparisonOperators(op) ||
  isBooleanComparisonOperators(op)

export const isComparison = <DTO, K extends keyof DTO>(
  maybeComparison?: FilterFieldComparison<DTO[K]> | Filter<DTO[K]>
): maybeComparison is FilterFieldComparison<DTO[K]> => {
  if (!maybeComparison) {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.keys(maybeComparison as Record<string, unknown>).every(isComparisonOperator)
}

/**
 * Whether a value is a `Date` from any realm, checked by the internal slot `getTime` reads rather than by
 * `instanceof`, which fails across realms, or by `Symbol.toStringTag`, which any object can claim.
 */
const isDate = (value: unknown): value is Date => {
  try {
    Date.prototype.getTime.call(value)
    return true
  } catch {
    return false
  }
}

const isInvalidDate = (value: unknown): boolean => isDate(value) && Number.isNaN(value.getTime())

const isObjectLiteralPrototype = (prototype: object | null): boolean =>
  prototype === null || Object.getPrototypeOf(prototype) === null

/**
 * Whether a value can hold filter fields: a plain object or class instance, as opposed to a scalar, `null`, an array
 * or a `Date`, none of which a nested filter or a comparison can be read against.
 */
export const isFilterableObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !isDate(value)

/**
 * Whether a value is an object literal or an array, as opposed to a scalar, a `Date` or a class instance. Neither can
 * be compared against a field in memory, because both are compared by reference. An object literal is recognised by
 * its prototype being `null` or the `Object.prototype` of any realm, so one made in a `vm` context is recognised too.
 */
export const isObjectLiteralOrArray = (value: unknown): boolean =>
  Array.isArray(value) || (isFilterableObject(value) && isObjectLiteralPrototype(Object.getPrototypeOf(value) as object | null))

/**
 * Whether a value can be compared against a field in memory: a scalar, `null`, a valid `Date` or a class instance, as
 * opposed to an object literal, an array or a function, which would be compared by reference. `undefined` and an
 * invalid `Date` are rejected too. SQL matches nothing against `undefined` and the engines disagree on an invalid
 * `Date`, where in memory `eq: undefined` would match an omitted field and `neq` of either would match every value.
 */
export const isComparableValue = (value: unknown): boolean =>
  value !== undefined && !isInvalidDate(value) && !isObjectLiteralOrArray(value) && typeof value !== 'function'

/**
 * Whether a value can bound a range or `between` comparison in memory: a comparable value other than `null`, which
 * JavaScript would coerce to `0` where SQL would match nothing.
 */
export const isOrderableValue = (value: unknown): boolean => value !== null && isComparableValue(value)

/**
 * Whether two values are equal for an in-memory comparison: two `Date`s are equal when they hold the same instant,
 * as they are in SQL, and every other value is compared strictly.
 */
export const isSameValue = (value: unknown, other: unknown): boolean =>
  isDate(value) && isDate(other) ? value.getTime() === other.getTime() : value === other

/**
 * Returns the unrecognised keys of a value that mixes recognised comparison operators with keys that are not
 * comparison operators, for example `{ eq: 'a', unregistered: 'b' }`.
 *
 * A value whose keys are *all* unrecognised is a valid nested filter keyed by field name, so it yields no keys. So
 * does a mixed value whose operator-named keys each hold an object, because that is a nested filter over a relation
 * with fields named after operators, for example `{ is: { eq: true }, name: { eq: 'a' } }`.
 * The `and` and `or` grouping keys are neither operators nor field names and are grouped before the remaining
 * keys are read, so they take no part in this.
 */
export const getKeysMixedIntoComparison = (maybeComparison?: object): string[] => {
  if (!maybeComparison) {
    return []
  }

  const keys = Object.keys(maybeComparison).filter((key) => !isGroupingKey(key))
  const operatorKeys = keys.filter(isComparisonOperator)
  const unknownKeys = keys.filter((key) => !isComparisonOperator(key))
  const readsAsNestedFilter = operatorKeys.every((key) => isFilterableObject(maybeComparison[key as keyof object]))

  return readsAsNestedFilter ? [] : unknownKeys
}

// TODO: test
export const getFilterFieldComparison = <DTO, K extends keyof FilterComparisons<DTO>>(
  obj: FilterComparisons<DTO>,
  field: K
): FilterFieldComparison<DTO[K]> & Filter<DTO[K]> => obj[field] as FilterFieldComparison<DTO[K]> & Filter<DTO[K]>

export const transformFilter = <From, To>(
  filter: Filter<From> | undefined,
  fieldMap: QueryFieldMap<From, To>
): Filter<To> | undefined => {
  if (!filter) {
    return undefined
  }
  return Object.keys(filter).reduce((newFilter, filterField) => {
    if (filterField === 'and' || filterField === 'or') {
      return { ...newFilter, [filterField]: filter[filterField]?.map((f) => transformFilter(f, fieldMap)) }
    }
    const fromField = filterField as keyof From
    const otherKey = fieldMap[fromField]
    if (!otherKey) {
      throw new Error(`No corresponding field found for '${filterField}' when transforming Filter`)
    }
    return { ...newFilter, [otherKey as string]: filter[fromField] }
  }, {} as Filter<To>)
}

export const mergeFilter = <T>(base: Filter<T>, source: Filter<T>): Filter<T> => {
  if (!Object.keys(base).length) {
    return source
  }
  if (!Object.keys(source).length) {
    return base
  }
  return { and: [source, base] } as Filter<T>
}
export const mergeFilters = <T>(...filters: Filter<T>[]): Filter<T> => {
  const newFilter = { and: [] } as Filter<T>

  for (const filter of filters) {
    if (Object.keys(filter).length) {
      newFilter.and.push(filter)
    }
  }

  return newFilter
}

export const getFilterFields = <DTO>(filter: Filter<DTO>): string[] => {
  const fieldSet: Set<string> = Object.keys(filter).reduce((fields: Set<string>, filterField: string): Set<string> => {
    if (filterField === 'and' || filterField === 'or') {
      const andOrFilters = filter[filterField]

      if (andOrFilters !== undefined) {
        return andOrFilters.reduce(
          (andOrFields, andOrFilter) => new Set<string>([...andOrFields, ...getFilterFields(andOrFilter)]),
          fields
        )
      }
    } else {
      fields.add(filterField)
    }

    return fields
  }, new Set<string>())

  return [...fieldSet]
}

export const getFilterComparisons = <DTO, K extends keyof FilterComparisons<DTO>>(
  filter: Filter<DTO>,
  key: K
): FilterFieldComparison<DTO[K]>[] => {
  const results: FilterFieldComparison<DTO[K]>[] = []

  if (filter.and || filter.or) {
    const filters = [...(filter.and ?? []), ...(filter.or ?? [])]
    filters.forEach((f) => getFilterComparisons(f, key).forEach((comparison) => results.push(comparison)))
  }

  const comparison = getFilterFieldComparison(filter as FilterComparisons<DTO>, key)
  if (isComparison(comparison)) {
    results.push(comparison)
  }

  return [...results]
}

export const transformFilterComparisons = <DTO, K extends keyof FilterComparisons<DTO>>(
  filterComparisons: FilterFieldComparison<DTO[K]>[],
  key: K
): Filter<DTO> => {
  return {
    [key]: filterComparisons.reduce(
      (flatFilter, filter) => ({
        ...flatFilter,
        ...filter
      }),
      {}
    )
  } as Filter<DTO>
}

/*
getFilterComparisons only returns the first layer, this one will return everything, it only returns the same
item multiple times, that needs to be fixed first
 */
// export const getDeepFilterComparisons = <DTO, K extends keyof FilterComparisons<DTO>>(
//   filter: Filter<DTO>,
//   key: K
// ): FilterFieldComparison<DTO[K]>[] => {
//   let results: FilterFieldComparison<DTO[K]>[] = [];
//
//   const comparison = getFilterFieldComparison(filter as FilterComparisons<DTO>, key);
//   if (isComparison(comparison)) {
//     results.push(comparison);
//
//   } else if (Array.isArray(filter)) {
//     filter.forEach((f: Filter<DTO>) => {
//       results = results.concat(getFilterComparisons(f, key));
//     });
//   }
//
//   if (typeof filter === 'object') {
//     Object.keys(filter).forEach((subFilterKey) => {
//       const subFilter = filter[subFilterKey] as FilterFieldComparison<DTO[K]>;
//
//       if (subFilterKey === key) {
//         results.push(subFilter);
//       } else {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         results = results.concat(getFilterComparisons(subFilter, key));
//       }
//     });
//   }
//
//   return [...results];
// };

export const getFilterOmitting = <DTO>(filter: Filter<DTO>, ...keys: (keyof Filter<DTO>)[]): Filter<DTO> =>
  Object.keys(filter).reduce<Filter<DTO>>((f, next) => {
    const omitted = { ...f }
    const k = next as keyof Filter<DTO>

    if (k === 'and' && filter.and) {
      omitted.and = filter.and.map((part) => getFilterOmitting(part, ...keys))

      if (omitted.and.every((part) => Object.keys(part).length === 0)) {
        delete omitted.and
      }
    } else if (k === 'or' && filter.or) {
      omitted.or = filter.or.map((part) => getFilterOmitting(part, ...keys))

      if (omitted.or.every((part) => Object.keys(part).length === 0)) {
        delete omitted.or
      }
    } else if (!keys.includes(k)) {
      omitted[k] = filter[k]
    }

    return omitted
  }, {} as Filter<DTO>)

export function applyFilter<DTO>(dto: DTO[], filter: Filter<DTO>): DTO[]
export function applyFilter<DTO>(dto: DTO, filter: Filter<DTO>): boolean
export function applyFilter<DTO>(dtoOrArray: DTO | DTO[], filter: Filter<DTO>): boolean | DTO[] {
  const filterFunc = FilterBuilder.build(filter)
  if (Array.isArray(dtoOrArray)) {
    return dtoOrArray.filter((dto) => filterFunc(dto))
  }
  return filterFunc(dtoOrArray)
}

/**
 * Ensures a record that is about to be created matches the creation filter, throwing a BadRequestException otherwise.
 * When no filter is provided the record is always allowed.
 */
export function ensureMatchesCreationFilter<DTO>(record: DTO, filter?: Filter<DTO>): void {
  if (filter && !applyFilter(record, filter)) {
    throw new BadRequestException('Entity does not meet creation constraints')
  }
}

/**
 * Returns the subset of records that match the creation filter and are therefore allowed to be created.
 * When no filter is provided the records are returned unchanged.
 */
export function filterCreatableRecords<DTO>(records: DTO[], filter?: Filter<DTO>): DTO[] {
  if (!filter) {
    return records
  }
  return applyFilter(records, filter)
}
