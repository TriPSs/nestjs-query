import { CommonFieldComparisonBetweenType, FilterComparisonOperators } from '@ptc-org/nestjs-query-core'
import { EntityMetadata, ObjectLiteral, Repository } from 'typeorm'

import { randomString } from '../common'

/**
 * @internal
 */
type CmpSQLType = { sql: string; params: ObjectLiteral }

/**
 * @internal
 */
export type EntityComparisonField<Entity, F extends keyof Entity> =
  | Entity[F]
  | Entity[F][]
  | CommonFieldComparisonBetweenType<Entity[F]>
  | true
  | false
  | null

/**
 * @internal
 * Builder to create SQL Comparisons. (=, !=, \>, etc...)
 */
export class SQLComparisonBuilder<Entity> {
  static DEFAULT_COMPARISON_MAP: Record<string, string> = {
    eq: '=',
    neq: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    like: 'LIKE',
    notlike: 'NOT LIKE',
    ilike: 'ILIKE',
    notilike: 'NOT ILIKE'
  }

  /**
   * @param comparisonMap - the comparison operators this builder understands.
   * @param repo - repository of the entity this builder builds comparisons for.
   * @param entityMetadata - metadata of the entity this builder builds comparisons for, used to
   * expand virtual columns into their queries. Defaults to the metadata of `repo`, and can be
   * supplied on its own when there is no repository for the entity, as is the case for a relation.
   */
  constructor(
    readonly comparisonMap: Record<string, string> = SQLComparisonBuilder.DEFAULT_COMPARISON_MAP,
    readonly repo?: Repository<Entity>,
    readonly entityMetadata: EntityMetadata | undefined = repo?.metadata
  ) {}

  /**
   * Creates a builder like this one bound to another entity's metadata, used when a filter
   * descends into a relation.
   *
   * The derived builder keeps the prototype and the own property descriptors of this builder, so a
   * custom builder keeps its comparison behaviour inside relation filters without overriding
   * anything.
   *
   * Override this method to construct the derived builder yourself when copying the own property
   * descriptors is not enough, for example when a subclass holds private class fields (which are
   * not copied, and are unreadable on the derived builder) or state that is derived from the root
   * entity's metadata and must not be reused for a relation.
   *
   * @param entityMetadata - metadata of the entity the derived builder builds comparisons for.
   */
  public deriveForEntityMetadata<Relation>(entityMetadata: EntityMetadata): SQLComparisonBuilder<Relation> {
    return Object.create(Object.getPrototypeOf(this) as object, {
      ...Object.getOwnPropertyDescriptors(this),
      repo: { value: undefined, writable: true, enumerable: true, configurable: true },
      entityMetadata: { value: entityMetadata, writable: true, enumerable: true, configurable: true }
    }) as SQLComparisonBuilder<Relation>
  }

  private get paramName(): string {
    return `param${randomString()}`
  }

  /**
   * Creates a valid SQL fragment with parameters.
   *
   * @param field - the property in Entity to create the comparison for.
   * @param cmp - the FilterComparisonOperator (eq, neq, gt, etc...)
   * @param val - the value to compare to
   * @param alias - alias for the field.
   */
  public build<F extends keyof Entity>(
    field: F,
    cmp: FilterComparisonOperators<Entity[F]>,
    val: EntityComparisonField<Entity, F>,
    alias?: string
  ): CmpSQLType {
    const col = this.getCol(field as string, alias)
    const normalizedCmp = (cmp as string).toLowerCase()
    if (this.comparisonMap[normalizedCmp]) {
      // comparison operator (e.b. =, !=, >, <)
      return this.createComparisonSQL(normalizedCmp, col, val)
    }
    if (normalizedCmp === 'is') {
      // is comparison (IS TRUE, IS FALSE, IS NULL)
      return this.isComparisonSQL(col, val)
    }
    if (normalizedCmp === 'isnot') {
      // is comparison (IS NOT TRUE, IS NOT FALSE, IS NOT NULL, etc...)
      return this.isNotComparisonSQL(col, val)
    }
    if (normalizedCmp === 'in') {
      // in comparison (field IN (1,2,3))
      return this.inComparisonSQL(col, val)
    }
    if (normalizedCmp === 'notin') {
      // in comparison (field IN (1,2,3))
      return this.notInComparisonSQL(col, val)
    }
    if (normalizedCmp === 'between') {
      // between comparison (field BETWEEN x AND y)
      return this.betweenComparisonSQL(col, val)
    }
    if (normalizedCmp === 'notbetween') {
      // notBetween comparison (field NOT BETWEEN x AND y)
      return this.notBetweenComparisonSQL(col, val)
    }
    throw new Error(`unknown operator ${JSON.stringify(cmp)}`)
  }

  private createComparisonSQL<F extends keyof Entity>(
    cmp: string,
    col: string,
    val: EntityComparisonField<Entity, F>
  ): CmpSQLType {
    const operator = this.comparisonMap[cmp]
    const { paramName } = this
    return { sql: `${col} ${operator} :${paramName}`, params: { [paramName]: val } }
  }

  private isComparisonSQL<F extends keyof Entity>(col: string, val: EntityComparisonField<Entity, F>): CmpSQLType {
    if (val === null) {
      return { sql: `${col} IS NULL`, params: {} }
    }
    if (val === true) {
      return { sql: `${col} = TRUE`, params: {} }
    }
    if (val === false) {
      return { sql: `${col} = FALSE`, params: {} }
    }
    throw new Error(`unexpected is operator param ${JSON.stringify(val)}`)
  }

  private isNotComparisonSQL<F extends keyof Entity>(col: string, val: EntityComparisonField<Entity, F>): CmpSQLType {
    if (val === null) {
      return { sql: `${col} IS NOT NULL`, params: {} }
    }
    if (val === true) {
      return { sql: `${col} != TRUE`, params: {} }
    }
    if (val === false) {
      return { sql: `${col} != FALSE`, params: {} }
    }
    throw new Error(`unexpected isNot operator param ${JSON.stringify(val)}`)
  }

  private inComparisonSQL<F extends keyof Entity>(col: string, val: EntityComparisonField<Entity, F>): CmpSQLType {
    this.checkNonEmptyArray(val)
    const { paramName } = this
    return {
      sql: `${col} IN (:...${paramName})`,
      params: { [paramName]: val }
    }
  }

  private notInComparisonSQL<F extends keyof Entity>(col: string, val: EntityComparisonField<Entity, F>): CmpSQLType {
    this.checkNonEmptyArray(val)
    const { paramName } = this
    return {
      sql: `${col} NOT IN (:...${paramName})`,
      params: { [paramName]: val }
    }
  }

  private checkNonEmptyArray<F extends keyof Entity>(val: EntityComparisonField<Entity, F>): void {
    if (!Array.isArray(val)) {
      throw new Error(`Invalid in value expected an array got ${JSON.stringify(val)}`)
    }
    if (!val.length) {
      throw new Error(`Invalid in value expected a non-empty array got ${JSON.stringify(val)}`)
    }
  }

  private betweenComparisonSQL<F extends keyof Entity>(col: string, val: EntityComparisonField<Entity, F>): CmpSQLType {
    if (this.isBetweenVal(val)) {
      const { paramName: lowerParamName } = this
      const { paramName: upperParamName } = this
      return {
        sql: `${col} BETWEEN :${lowerParamName} AND :${upperParamName}`,
        params: {
          [lowerParamName]: val.lower,
          [upperParamName]: val.upper
        }
      }
    }
    throw new Error(`Invalid value for between expected {lower: val, upper: val} got ${JSON.stringify(val)}`)
  }

  private notBetweenComparisonSQL<F extends keyof Entity>(col: string, val: EntityComparisonField<Entity, F>): CmpSQLType {
    if (this.isBetweenVal(val)) {
      const { paramName: lowerParamName } = this
      const { paramName: upperParamName } = this
      return {
        sql: `${col} NOT BETWEEN :${lowerParamName} AND :${upperParamName}`,
        params: {
          [lowerParamName]: val.lower,
          [upperParamName]: val.upper
        }
      }
    }
    throw new Error(`Invalid value for not between expected {lower: val, upper: val} got ${JSON.stringify(val)}`)
  }

  private isBetweenVal<F extends keyof Entity>(
    val: EntityComparisonField<Entity, F>
  ): val is CommonFieldComparisonBetweenType<Entity[F]> {
    return val !== null && typeof val === 'object' && 'lower' in val && 'upper' in val
  }

  private getCol(field: string, alias?: string): string {
    const column = this.entityMetadata?.columns.find(({ databasePath }) => databasePath === field)

    if (column && column.isVirtualProperty) {
      return `(${column.query(alias)})`
    }

    return alias ? `${alias}.${field}` : `${field}`
  }
}
