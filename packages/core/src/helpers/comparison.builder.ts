import { CommonFieldComparisonBetweenType, FilterComparisonOperators } from '../interfaces'
import {
  BetweenComparisonOperators,
  BooleanComparisonOperators,
  InComparisonOperators,
  isBetweenComparisonOperators,
  isBooleanComparisonOperators,
  isFilterableObject,
  isInComparisonOperators,
  isLikeComparisonOperator,
  isObjectLiteralOrArray,
  isRangeComparisonOperators,
  LikeComparisonOperators,
  RangeComparisonOperators
} from './filter.helpers'
import { InvalidFilterError } from './invalid-filter.error'
import { ComparisonField, FilterFn } from './types'

const compare =
  <DTO>(filter: (dto: DTO) => boolean, fallback: boolean): FilterFn<DTO> =>
  (dto?: DTO) =>
    dto ? filter(dto) : fallback

export class ComparisonBuilder {
  static build<DTO, F extends keyof DTO>(
    field: F,
    cmp: FilterComparisonOperators<DTO[F]>,
    val: ComparisonField<DTO, F>
  ): FilterFn<DTO> {
    this.assertComparableValue(cmp, field, val)
    if (isBooleanComparisonOperators(cmp)) {
      return this.booleanComparison(cmp, field, val as DTO[F])
    }
    if (isRangeComparisonOperators(cmp)) {
      return this.rangeComparison(cmp, field, val as DTO[F])
    }
    if (isInComparisonOperators(cmp)) {
      return this.inComparison(cmp, field, val as DTO[F][])
    }
    if (isLikeComparisonOperator(cmp)) {
      return this.likeComparison(cmp, field, val as unknown as string)
    }

    if (isBetweenComparisonOperators(cmp)) {
      return this.betweenComparison(cmp, field, val as CommonFieldComparisonBetweenType<DTO[F]>)
    }
    throw new InvalidFilterError(`unknown operator ${JSON.stringify(cmp)}`)
  }

  private static assertComparableValue<DTO, F extends keyof DTO>(
    cmp: FilterComparisonOperators<DTO[F]>,
    field: F,
    val: ComparisonField<DTO, F>
  ): void {
    const requirement = this.unmetValueRequirement(cmp, val)
    if (requirement) {
      throw new InvalidFilterError(`operator ${JSON.stringify(cmp)} of field ${JSON.stringify(field)} requires ${requirement}.`)
    }
  }

  /**
   * Returns what the operator requires of its value when `val` does not provide it, or `undefined` when it does.
   * An object literal or an array is never a value a field can be compared against in memory, because it is
   * compared by reference, so it would silently never match or, for the negative operators, always match.
   */
  private static unmetValueRequirement(cmp: unknown, val: unknown): string | undefined {
    if (isLikeComparisonOperator(cmp)) {
      return typeof val === 'string' ? undefined : 'a string'
    }
    if (isInComparisonOperators(cmp)) {
      return Array.isArray(val) && !val.some(isObjectLiteralOrArray) ? undefined : 'an array of values to compare against'
    }
    if (isBetweenComparisonOperators(cmp)) {
      return isFilterableObject(val) && 'lower' in val && 'upper' in val ? undefined : 'an object with a lower and an upper bound'
    }
    if (isBooleanComparisonOperators(cmp) || isRangeComparisonOperators(cmp)) {
      return isObjectLiteralOrArray(val) ? 'a value to compare against rather than an object or an array' : undefined
    }
    return undefined
  }

  private static booleanComparison<DTO, F extends keyof DTO>(
    cmp: BooleanComparisonOperators,
    field: F,
    val: DTO[F]
  ): FilterFn<DTO> {
    if (cmp === 'neq') {
      return (dto?: DTO): boolean => (dto ? dto[field] : null) !== val
    }
    if (cmp === 'isNot') {
      // eslint-disable-next-line eqeqeq
      return (dto?: DTO): boolean => (dto ? dto[field] : null) != val
    }
    if (cmp === 'eq') {
      return (dto?: DTO): boolean => (dto ? dto[field] : null) === val
    }
    // eslint-disable-next-line eqeqeq
    return (dto?: DTO): boolean => (dto ? dto[field] : null) == val
  }

  private static rangeComparison<DTO, F extends keyof DTO>(cmp: RangeComparisonOperators, field: F, val: DTO[F]): FilterFn<DTO> {
    if (cmp === 'gt') {
      return compare((dto) => dto[field] > val, false)
    }
    if (cmp === 'gte') {
      return compare((dto) => dto[field] >= val, false)
    }
    if (cmp === 'lt') {
      return compare((dto) => dto[field] < val, false)
    }
    return compare((dto) => dto[field] <= val, false)
  }

  private static likeComparison<DTO, F extends keyof DTO>(cmp: LikeComparisonOperators, field: F, val: string): FilterFn<DTO> {
    if (cmp === 'like') {
      const likeRegexp = this.likeSearchToRegexp(val)
      return compare((dto) => likeRegexp.test(dto[field] as unknown as string), false)
    }
    if (cmp === 'notLike') {
      const likeRegexp = this.likeSearchToRegexp(val)
      return compare((dto) => !likeRegexp.test(dto[field] as unknown as string), true)
    }
    if (cmp === 'iLike') {
      const likeRegexp = this.likeSearchToRegexp(val, true)
      return compare((dto) => likeRegexp.test(dto[field] as unknown as string), false)
    }
    const likeRegexp = this.likeSearchToRegexp(val, true)
    return compare((dto) => !likeRegexp.test(dto[field] as unknown as string), true)
  }

  private static inComparison<DTO, F extends keyof DTO>(cmp: InComparisonOperators, field: F, val: DTO[F][]): FilterFn<DTO> {
    if (cmp === 'notIn') {
      return compare((dto) => !val.includes(dto[field]), true)
    }
    return compare((dto) => val.includes(dto[field]), false)
  }

  private static betweenComparison<DTO, F extends keyof DTO>(
    cmp: BetweenComparisonOperators,
    field: F,
    val: CommonFieldComparisonBetweenType<DTO[F]>
  ): FilterFn<DTO> {
    const { lower, upper } = val
    if (cmp === 'notBetween') {
      return compare((dto) => {
        const dtoVal = dto[field]
        return dtoVal < lower || dtoVal > upper
      }, true)
    }
    return compare((dto) => {
      const dtoVal = dto[field]
      return dtoVal >= lower && dtoVal <= upper
    }, false)
  }

  private static likeSearchToRegexp(likeStr: string, caseInsensitive = false): RegExp {
    const replaced = likeStr.replace(/%/g, '.*')
    return new RegExp(`^${replaced}$`, caseInsensitive ? 'i' : undefined)
  }
}
