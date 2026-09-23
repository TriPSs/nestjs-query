import { CommonFieldComparisonBetweenType, FilterComparisonOperators } from '../interfaces'
import {
  BetweenComparisonOperators,
  BooleanComparisonOperators,
  InComparisonOperators,
  isBetweenComparisonOperators,
  isBooleanComparisonOperators,
  isComparableValue,
  isFilterableObject,
  isInComparisonOperators,
  isLikeComparisonOperator,
  isOrderableValue,
  isRangeComparisonOperators,
  isSameValue,
  LikeComparisonOperators,
  RangeComparisonOperators
} from './filter.helpers'
import { InvalidFilterError } from './invalid-filter.error'
import { ComparisonField, FilterFn } from './types'

const LIKE_WILDCARD_PATTERNS: Record<string, string> = { '%': '.*', _: '.' }
const LIKE_PATTERN_TOKEN = /\\([^])|[%_]|[.*+?^${}()|[\]\\/]/gu
const REGEXP_SYNTAX_CHARACTER = /^[.*+?^${}()|[\]\\/]$/

/**
 * The two ways Postgres lower-cases text for `ILIKE`: ICU and the builtin `pg_unicode_fast` collation map the whole
 * string, so `İ` becomes two characters and a word-final `Σ` becomes `ς`, while libc and the builtin `pg_c_utf8`
 * collation map each character on its own, so `İ` becomes `i` and every `Σ` becomes `σ`.
 */
const POSTGRES_LOWER_CASINGS: ((text: string) => string)[] = [
  (text) => text.toLowerCase(),
  (text) => Array.from(text, (character) => String.fromCodePoint(character.toLowerCase().codePointAt(0))).join('')
]

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
   * An object literal, an array or a function is never a value a field can be compared against in memory, because
   * it is compared by reference, so it would silently never match or, for the negative operators, always match.
   * Nor is `undefined` or an invalid `Date`, which SQL cannot compare against either. The range operators and `between`
   * also reject `null`, which JavaScript coerces to `0` where SQL matches nothing.
   */
  private static unmetValueRequirement(cmp: unknown, val: unknown): string | undefined {
    if (isLikeComparisonOperator(cmp)) {
      return typeof val === 'string' ? undefined : 'a string'
    }
    if (isInComparisonOperators(cmp)) {
      return Array.isArray(val) && val.every(isComparableValue) ? undefined : 'an array of values to compare against'
    }
    if (isBetweenComparisonOperators(cmp)) {
      return this.isBetweenBounds(val) ? undefined : 'an object with a lower and an upper bound'
    }
    if (isRangeComparisonOperators(cmp)) {
      return isOrderableValue(val)
        ? undefined
        : 'a value to compare against rather than null, undefined, an invalid Date, an object, an array or a function'
    }
    if (isBooleanComparisonOperators(cmp)) {
      return isComparableValue(val)
        ? undefined
        : 'a value to compare against rather than undefined, an invalid Date, an object, an array or a function'
    }
    return undefined
  }

  private static isBetweenBounds(val: unknown): boolean {
    return (
      isFilterableObject(val) &&
      'lower' in val &&
      'upper' in val &&
      isOrderableValue((val as CommonFieldComparisonBetweenType<unknown>).lower) &&
      isOrderableValue((val as CommonFieldComparisonBetweenType<unknown>).upper)
    )
  }

  private static booleanComparison<DTO, F extends keyof DTO>(
    cmp: BooleanComparisonOperators,
    field: F,
    val: DTO[F]
  ): FilterFn<DTO> {
    if (cmp === 'neq') {
      return (dto?: DTO): boolean => !isSameValue(dto ? dto[field] : null, val)
    }
    if (cmp === 'isNot') {
      // eslint-disable-next-line eqeqeq
      return (dto?: DTO): boolean => (dto ? dto[field] : null) != val
    }
    if (cmp === 'eq') {
      return (dto?: DTO): boolean => isSameValue(dto ? dto[field] : null, val)
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
    const lowerCasedMatchers = this.lowerCasedLikeMatchers(val)
    if (cmp === 'iLike') {
      return compare((dto) => lowerCasedMatchers.every((matches) => matches(dto[field])), false)
    }
    return compare((dto) => !lowerCasedMatchers.some((matches) => matches(dto[field])), true)
  }

  /**
   * Builds one matcher per way Postgres lower-cases text, each comparing the lower-cased value against the lower-cased
   * pattern, as Postgres's `ILIKE` does, rather than folding case the way a case-insensitive regular expression does.
   * Folding would let an ASCII pattern such as `s` match `ſ`, which Postgres does not. `iLike` matches only where every
   * lower casing matches and `notILike` only where none does, so neither admits a value that Postgres, under an ICU or
   * a libc collation, would not.
   */
  private static lowerCasedLikeMatchers(pattern: string): ((value: unknown) => boolean)[] {
    return POSTGRES_LOWER_CASINGS.map((lowerCase) => {
      const likeRegexp = this.likeSearchToRegexp(lowerCase(pattern))
      return (value: unknown) => likeRegexp.test(lowerCase(String(value)))
    })
  }

  private static inComparison<DTO, F extends keyof DTO>(cmp: InComparisonOperators, field: F, val: DTO[F][]): FilterFn<DTO> {
    if (cmp === 'notIn') {
      return compare((dto) => !val.some((candidate) => isSameValue(dto[field], candidate)), true)
    }
    return compare((dto) => val.some((candidate) => isSameValue(dto[field], candidate)), false)
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

  /**
   * Translates a SQL `LIKE` pattern into a regular expression the way Postgres and MySQL read it: `%` matches any run
   * of characters, line breaks included, `_` matches any single character, a backslash makes the character after it,
   * `%`, `_` and backslash included, match itself, and every other character, regular expression syntax included,
   * matches itself. A trailing backslash matches itself, as it does on MySQL and MariaDB, where Postgres rejects the
   * pattern. Characters are Unicode code points, so `_` matches an emoji.
   */
  private static likeSearchToRegexp(likeStr: string): RegExp {
    const replaced = likeStr.replace(LIKE_PATTERN_TOKEN, (token, escaped?: string) =>
      escaped === undefined ? (LIKE_WILDCARD_PATTERNS[token] ?? this.matchLiterally(token)) : this.matchLiterally(escaped)
    )
    return new RegExp(`^${replaced}$`, 'su')
  }

  private static matchLiterally(character: string): string {
    return REGEXP_SYNTAX_CHARACTER.test(character) ? `\\${character}` : character
  }
}
