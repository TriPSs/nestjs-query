import {
  AggregateQuery,
  AggregateQueryField,
  Filter,
  getFilterFields,
  Paging,
  Query,
  SelectRelation,
  SortDirection,
  SortField,
  SortNulls
} from '@ptc-org/nestjs-query-core'
import merge from 'lodash.merge'
import {
  DeleteQueryBuilder,
  EntityMetadata,
  OrderByCondition,
  QueryBuilder,
  Repository,
  SelectQueryBuilder,
  UpdateQueryBuilder,
  WhereExpressionBuilder
} from 'typeorm'
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata'
import { SelectQuery } from 'typeorm/query-builder/SelectQuery'
import { SoftDeleteQueryBuilder } from 'typeorm/query-builder/SoftDeleteQueryBuilder'

import { AggregateBuilder } from './aggregate.builder'
import { SQLComparisonBuilder } from './sql-comparison.builder'
import { WhereBuilder } from './where.builder'

/**
 * @internal
 *
 * Interface that for Typeorm query builders that are sortable.
 */
interface Sortable<Entity> extends QueryBuilder<Entity> {
  addOrderBy(sort: string, order?: 'ASC' | 'DESC', nulls?: 'NULLS FIRST' | 'NULLS LAST'): this
  orderBy(order: OrderByCondition): this
}

interface Groupable<Entity> extends QueryBuilder<Entity> {
  addGroupBy(groupBy: string): this
}

/**
 * @internal
 *
 * Interface for `typeorm` query builders that are pageable.
 */
interface Pageable<Entity> extends QueryBuilder<Entity> {
  limit(limit?: number): this

  offset(offset?: number): this

  skip(skip?: number): this

  take(take?: number): this
}

/**
 * @internal
 *
 * Nested record type
 */
export interface NestedRecord<E = unknown> {
  [keys: string]: NestedRecord<E>
}

/**
 * @internal
 *
 * Drivers that do not understand the `NULLS FIRST` / `NULLS LAST` order by syntax, but can express null placement
 * as an extra `IS NULL` sort key instead.
 */
const DRIVERS_EMULATING_NULL_ORDERING = ['mysql', 'mariadb', 'aurora-mysql']

/**
 * @internal
 *
 * Drivers that can express null placement neither with the `NULLS FIRST` / `NULLS LAST` syntax nor with an
 * `IS NULL` sort key.
 */
const DRIVERS_REJECTING_NULL_ORDERING = ['mssql']

/**
 * @internal
 *
 * `col IS NULL` is 1 for nulls and 0 for everything else, so nulls come first when that key is sorted descending.
 */
const NULL_ORDERING_DIRECTION: Record<SortNulls, SortDirection> = {
  [SortNulls.NULLS_FIRST]: SortDirection.DESC,
  [SortNulls.NULLS_LAST]: SortDirection.ASC
}

/**
 * @internal
 *
 * Prefix of the select alias an emulated null ordering key is selected under, suffixed with the first number no
 * alias the query builder already selects is suffixed with.
 */
const NULL_ORDERING_KEY_ALIAS_PREFIX = '__nestjsQuery__nullOrdering__'

/**
 * @internal
 *
 * Nested aliased type
 */
export interface NestedRelationsAliased {
  [keys: string]: {
    alias: string
    metadata?: EntityMetadata
    relations?: NestedRelationsAliased
  }
}

/**
 * @internal
 *
 * Class that will convert a Query into a `typeorm` Query Builder.
 */
export class FilterQueryBuilder<Entity> {
  private readonly virtualColumns: string[] = []

  constructor(
    readonly repo: Repository<Entity>,
    readonly whereBuilder: WhereBuilder<Entity> = new WhereBuilder<Entity>(
      new SQLComparisonBuilder<Entity>(SQLComparisonBuilder.DEFAULT_COMPARISON_MAP, repo)
    ),
    readonly aggregateBuilder: AggregateBuilder<Entity> = new AggregateBuilder<Entity>(repo)
  ) {
    this.virtualColumns = repo.metadata.columns
      .filter(({ isVirtualProperty }) => isVirtualProperty)
      .map(({ propertyName }) => propertyName)
  }

  /**
   * Create a `typeorm` SelectQueryBuilder with `WHERE`, `ORDER BY` and `LIMIT/OFFSET` clauses.
   *
   * @param query - the query to apply.
   */
  public select(query: Query<Entity>): SelectQueryBuilder<Entity> {
    let qb = this.createQueryBuilder()

    qb = this.applyRelationJoinsRecursive(
      qb,
      this.getReferencedRelationsWithAliasRecursive(this.repo.metadata, query.filter, query.relations),
      query.relations
    )

    qb = this.applyFilter(qb, query.filter, qb.alias)
    qb = this.applySorting(qb, query.sorting, qb.alias)
    qb = this.applyPaging(qb, query.paging, this.shouldUseSkipTake(query.filter))

    return qb
  }

  public selectById(id: string | number | (string | number)[], query: Query<Entity>): SelectQueryBuilder<Entity> {
    return this.select(query).andWhereInIds(id)
  }

  public aggregate(query: Query<Entity>, aggregate: AggregateQuery<Entity>): SelectQueryBuilder<Entity> {
    const hasFilterRelations = this.filterHasRelations(query.filter)
    let qb = this.createQueryBuilder()

    qb = hasFilterRelations
      ? this.applyRelationJoinsRecursive(qb, this.getReferencedRelationsWithAliasRecursive(this.repo.metadata, query.filter))
      : qb

    qb = this.applyAggregate(qb, aggregate, qb.alias)
    qb = this.applyFilter(qb, query.filter, qb.alias)
    qb = this.applyAggregateSorting(qb, aggregate.groupBy, qb.alias)
    qb = this.applyAggregateGroupBy(qb, aggregate.groupBy, qb.alias)

    return qb
  }

  /**
   * Create a `typeorm` DeleteQueryBuilder with a WHERE clause.
   *
   * @param query - the query to apply.
   */
  public delete(query: Query<Entity>): DeleteQueryBuilder<Entity> {
    return this.applyFilter(this.repo.createQueryBuilder().delete(), query.filter)
  }

  /**
   * Create a `typeorm` DeleteQueryBuilder with a WHERE clause.
   *
   * @param query - the query to apply.
   */
  public softDelete(query: Query<Entity>): SoftDeleteQueryBuilder<Entity> {
    return this.applyFilter(this.repo.createQueryBuilder().softDelete() as SoftDeleteQueryBuilder<Entity>, query.filter)
  }

  /**
   * Create a `typeorm` UpdateQueryBuilder with `WHERE` and `ORDER BY` clauses
   *
   * @param query - the query to apply.
   */
  public update(query: Query<Entity>): UpdateQueryBuilder<Entity> {
    const qb = this.applyFilter(this.repo.createQueryBuilder().update(), query.filter)
    return this.applySorting(qb, query.sorting)
  }

  /**
   * Applies paging to a Pageable `typeorm` query builder
   * @param qb - the `typeorm` QueryBuilder
   * @param paging - the Paging options.
   * @param useSkipTake - if skip/take should be used instead of limit/offset.
   */
  public applyPaging<P extends Pageable<Entity>>(qb: P, paging?: Paging, useSkipTake?: boolean): P {
    if (!paging) {
      return qb
    }

    if (useSkipTake) {
      return qb.take(paging.limit).skip(paging.offset)
    }

    return qb.limit(paging.limit).offset(paging.offset)
  }

  /**
   * Applies the filter from a Query to a `typeorm` QueryBuilder.
   *
   * @param qb - the `typeorm` QueryBuilder.
   * @param aggregate - the aggregates to select.
   * @param alias - optional alias to use to qualify an identifier
   */
  public applyAggregate<Qb extends SelectQueryBuilder<Entity>>(qb: Qb, aggregate: AggregateQuery<Entity>, alias?: string): Qb {
    return this.aggregateBuilder.build(qb, aggregate, alias)
  }

  /**
   * Applies the filter from a Query to a `typeorm` QueryBuilder.
   *
   * @param qb - the `typeorm` QueryBuilder.
   * @param filter - the filter.
   * @param alias - optional alias to use to qualify an identifier
   */
  public applyFilter<Where extends WhereExpressionBuilder>(qb: Where, filter?: Filter<Entity>, alias?: string): Where {
    if (!filter) {
      return qb
    }

    return this.whereBuilder.build(qb, filter, this.getReferencedRelationsWithAliasRecursive(this.repo.metadata, filter), alias)
  }

  /**
   * Applies the ORDER BY clause to a `typeorm` QueryBuilder.
   * @param qb - the `typeorm` QueryBuilder.
   * @param sorts - an array of SortFields to create the ORDER BY clause.
   * @param alias - optional alias to use to qualify an identifier
   */
  public applySorting<T extends Sortable<Entity>>(qb: T, sorts?: SortField<Entity>[], alias?: string): T {
    if (!sorts) {
      return qb
    }

    return sorts.reduce((prevQb, sortField) => {
      const { field, direction, nulls } = sortField
      const stringifiedField = String(field)
      let col = alias ? `${alias}.${stringifiedField}` : `${stringifiedField}`

      if (this.virtualColumns.includes(stringifiedField)) {
        col = prevQb.escape(alias ? `${alias}_${stringifiedField}` : `${stringifiedField}`)
      }

      if (nulls) {
        this.assertNullOrderingIsSupported(stringifiedField)
      }

      if (this.emulatesNullOrdering) {
        return this.orderByWithEmulatedNullOrdering(prevQb, sortField, col)
      }

      return prevQb.addOrderBy(col, direction, nulls)
    }, qb)
  }

  public applyAggregateGroupBy<T extends Groupable<Entity>>(
    qb: T,
    aggregatedGroupBy?: AggregateQueryField<Entity>[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    alias?: string
  ): T {
    if (!aggregatedGroupBy) {
      return qb
    }

    return aggregatedGroupBy.reduce((prevQb, aggregatedField) => {
      return prevQb.addGroupBy(prevQb.escape(AggregateBuilder.getGroupByAlias(aggregatedField.field)))
    }, qb)
  }

  public applyAggregateSorting<T extends Sortable<Entity>>(
    qb: T,
    aggregatedGroupBy?: AggregateQueryField<Entity>[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    alias?: string
  ): T {
    if (!aggregatedGroupBy) {
      return qb
    }

    return aggregatedGroupBy.reduce((prevQb, aggregatedField) => {
      return prevQb.addOrderBy(prevQb.escape(AggregateBuilder.getGroupByAlias(aggregatedField.field)), 'ASC')
    }, qb)
  }

  /**
   * Create a `typeorm` SelectQueryBuilder which can be used as an entry point to create update, delete or insert
   * QueryBuilders.
   */
  private createQueryBuilder(): SelectQueryBuilder<Entity> {
    return this.repo.createQueryBuilder()
  }

  /**
   * Gets relations referenced in the filter and adds joins for them to the query builder
   * @param qb - the `typeorm` QueryBuilder.
   * @param relationsMap - the relations map.
   * @param selectRelations - additional relations to select
   * @param alias - alias to use
   *
   * @returns the query builder for chaining
   */
  public applyRelationJoinsRecursive(
    qb: SelectQueryBuilder<Entity>,
    relationsMap?: NestedRelationsAliased,
    selectRelations?: SelectRelation<Entity>[],
    alias?: string
  ): SelectQueryBuilder<Entity> {
    if (!relationsMap) {
      return qb
    }

    const referencedRelations = Object.entries(relationsMap)

    // TODO:: If relation is not nullable use inner join?
    return referencedRelations.reduce((rqb, [relationKey, relation]) => {
      const relationAlias = relation.alias
      const relationChildren = relation.relations

      const selectRelation = selectRelations && selectRelations.find(({ name }) => name === relationKey)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

      if (selectRelation) {
        rqb = rqb.leftJoinAndSelect(`${alias ?? rqb.alias}.${relationKey}`, relationAlias)
        // Apply filter for the current relation
        rqb = this.applyFilter(rqb, selectRelation.query.filter, relationAlias)
        return this.applyRelationJoinsRecursive(rqb, relationChildren, selectRelation.query.relations, relationAlias)
      }

      return this.applyRelationJoinsRecursive(
        rqb.leftJoin(`${alias ?? rqb.alias}.${relationKey}`, relationAlias),
        relationChildren,
        [],
        relationAlias
      )
    }, qb)
  }

  /**
   * Checks if a filter references any relations.
   *
   * @returns true if there are any referenced relations
   */
  public filterHasRelations(filter?: Filter<Entity>): boolean {
    if (!filter) {
      return false
    }

    const { relationNames } = this
    return getFilterFields(filter).filter((f) => relationNames.includes(f)).length > 0
  }

  /**
   * Checks if the query should use skip/take instead of limit/offset.
   *
   * We need to use Skip/Take instead of Limit/Offset when the query involves a join that might be (one|many)-to-many.
   * This method looks for any n-to-many relations in the filter and if it finds any, it returns true.
   *
   * Recursively traverses the filter so we can detect nested n-to-many relations.
   */
  private shouldUseSkipTake<T>(filter?: Filter<T>, relations: RelationMetadata[] = this.repo.metadata.relations): boolean {
    if (!filter) return false

    return getFilterFields(filter).some((field) => {
      const relation = relations.find(({ propertyName }) => propertyName === field)
      if (!relation) return false
      if (!relation.isOneToOne && !relation.isManyToOne) return true

      const nestedFilter = filter[field] as Filter<unknown>

      return this.shouldUseSkipTake(nestedFilter, relation.inverseEntityMetadata.relations)
    })
  }

  public getReferencedRelationsWithAliasRecursive(
    metadata: EntityMetadata,
    filter: Filter<unknown> = {},
    selectRelations: SelectRelation<Entity>[] = []
  ): NestedRelationsAliased {
    const referencedRelations = this.getReferencedRelationsRecursive(metadata, filter, selectRelations)
    return this.injectRelationsAliasRecursive(metadata, referencedRelations)
  }

  private injectRelationsAliasRecursive(
    metadata: EntityMetadata,
    relations: NestedRecord,
    counter = new Map<string, number>()
  ): NestedRelationsAliased {
    return Object.entries(relations).reduce((prev, [name, children]) => {
      const relationMetadata = metadata.relations.find(({ propertyName }) => propertyName === name)?.inverseEntityMetadata

      if (!relationMetadata) {
        return prev
      }

      const count = (counter.get(name) ?? -1) + 1
      const alias = count === 0 ? name : `${name}_${count}`
      counter.set(name, count)

      return {
        ...prev,
        [name]: {
          alias,
          metadata: relationMetadata,
          relations: this.injectRelationsAliasRecursive(relationMetadata, children, counter)
        }
      }
    }, {})
  }

  public getReferencedRelationsRecursive(
    metadata: EntityMetadata,
    filter: Filter<unknown>,
    selectRelations: SelectRelation<Entity>[] = []
  ): NestedRecord {
    const referencedFields = Array.from(new Set(Object.keys(filter) as (keyof Filter<unknown>)[]))

    const referencedRelations = selectRelations.reduce((relations, selectRelation) => {
      const referencedRelation = metadata.relations.find((r) => r.propertyName === selectRelation.name)

      if (!referencedRelation) {
        return relations
      }

      relations[selectRelation.name] = {}

      if (selectRelation.query.relations) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        relations[selectRelation.name] = this.getReferencedRelationsRecursive(
          referencedRelation.inverseEntityMetadata,
          {},
          selectRelation.query.relations
        )
      }

      return relations
    }, {})

    return referencedFields.reduce((prev, curr) => {
      const currFilterValue = filter[curr]

      if ((curr === 'and' || curr === 'or') && currFilterValue) {
        for (const subFilter of currFilterValue) {
          prev = merge(prev, this.getReferencedRelationsRecursive(metadata, subFilter, []))
        }
      }

      const referencedRelation = metadata.relations.find((r) => r.propertyName === curr)

      if (!referencedRelation) {
        return prev
      }

      return {
        ...prev,
        [curr]: merge(
          (prev as NestedRecord)[curr],
          this.getReferencedRelationsRecursive(referencedRelation.inverseEntityMetadata, currFilterValue, [])
        )
      }
    }, referencedRelations)
  }

  private get relationNames(): string[] {
    return this.repo.metadata.relations.map((r) => r.propertyName)
  }

  /**
   * @description Throws on a driver the adapter cannot express null placement on, so that the caller sees which
   * sort field is at fault instead of a syntax error from the database.
   */
  private assertNullOrderingIsSupported(field: string): void {
    if (DRIVERS_REJECTING_NULL_ORDERING.includes(this.driverType)) {
      throw new Error(
        `Sorting by null placement is not supported on the "${this.driverType}" driver. Remove 'nulls' from the sort on '${field}'.`
      )
    }
  }

  /**
   * @description Whether null ordering has to be expressed as an extra sort key because the driver lacks the syntax.
   */
  private get emulatesNullOrdering(): boolean {
    return DRIVERS_EMULATING_NULL_ORDERING.includes(this.driverType)
  }

  /**
   * @description Orders by `col`, directly preceded by a key testing `col` for null when `nulls` is set.
   *
   * TypeORM overwrites the order of a column sorted again in place, keeping its position, and so does the native
   * `NULLS FIRST` / `NULLS LAST` keyword with it. To match, a column sorted again reuses the key already selected for
   * it, that key is moved to sit directly before the column wherever the column already is, and it is dropped from
   * the order by, though it stays selected, when the column is sorted again without `nulls`.
   */
  private orderByWithEmulatedNullOrdering<T extends Sortable<Entity>>(qb: T, sortField: SortField<Entity>, col: string): T {
    const { field, direction, nulls } = sortField
    const isNullExpression = `${col} IS NULL`
    const existingKey = this.existingNullOrderingKey(qb, String(field), isNullExpression)
    const orderBys = this.withoutOrderBy(qb.expressionMap.orderBys, existingKey)

    if (!nulls) {
      return qb.orderBy(orderBys).addOrderBy(col, direction)
    }

    const key = existingKey ?? this.nullOrderingKey(qb, String(field), isNullExpression)
    const keyThenColumn: OrderByCondition = { [key]: NULL_ORDERING_DIRECTION[nulls], [col]: direction }
    return qb.orderBy(this.replaceOrAppendOrderBy(orderBys, col, keyThenColumn))
  }

  private withoutOrderBy(orderBys: OrderByCondition, sort?: string): OrderByCondition {
    if (sort === undefined) {
      return { ...orderBys }
    }

    const { [sort]: removedOrder, ...remainingOrderBys } = orderBys
    return remainingOrderBys
  }

  /**
   * @description Puts `replacement` where `sort` is ordered, or after every other order by when it is not.
   */
  private replaceOrAppendOrderBy(orderBys: OrderByCondition, sort: string, replacement: OrderByCondition): OrderByCondition {
    const entries = Object.entries(orderBys)
    const sortIndex = entries.findIndex(([orderedSort]) => orderedSort === sort)
    const [before, after] = sortIndex === -1 ? [entries, []] : [entries.slice(0, sortIndex), entries.slice(sortIndex + 1)]
    return Object.fromEntries([...before, ...Object.entries(replacement), ...after])
  }

  /**
   * @description The key `isNullExpression` is already ordered by, if any.
   *
   * A key that could be selected is only ever the alias it was selected under, never the bare expression, so an order
   * by the same expression that the caller added themselves is left in place.
   */
  private existingNullOrderingKey<T extends Sortable<Entity>>(
    qb: T,
    field: string,
    isNullExpression: string
  ): string | undefined {
    if (!this.canSelectNullOrderingKey(qb, field)) {
      return this.unselectedNullOrderingKey(isNullExpression)
    }

    return this.selectedNullOrderingKeys(qb).find(({ selection }) => selection === isNullExpression)?.aliasName
  }

  /**
   * @description The key to order by for `isNullExpression`, selecting it first where it can.
   *
   * When a join forces TypeORM to page in a `DISTINCT` subquery, TypeORM carries each order by key into that subquery
   * by alias or by `alias.property`, and has no way to carry a bare `col IS NULL` expression. So a select query selects
   * the expression under a fresh alias and orders by that. Otherwise it orders by the expression itself.
   */
  private nullOrderingKey<T extends Sortable<Entity>>(qb: T, field: string, isNullExpression: string): string {
    if (!this.canSelectNullOrderingKey(qb, field)) {
      return this.unselectedNullOrderingKey(isNullExpression)
    }

    const keyAlias = this.unusedNullOrderingKeyAlias(qb)
    qb.addSelect(isNullExpression, keyAlias)
    return keyAlias
  }

  /**
   * @description The key ordered by where `isNullExpression` cannot be selected, parenthesised so that it never shares
   * its order by entry, and so its direction, with an order by on the bare expression that the caller added themselves.
   */
  private unselectedNullOrderingKey(isNullExpression: string): string {
    return `(${isNullExpression})`
  }

  /**
   * @description The first alias with the null ordering key prefix that the query builder does not select yet, so that
   * a new key can never overwrite the order of another key.
   */
  private unusedNullOrderingKeyAlias(qb: SelectQueryBuilder<Entity>): string {
    const selectedAliases = this.selectedNullOrderingKeys(qb).map(({ aliasName }) => aliasName)
    let suffix = 0
    while (selectedAliases.includes(`${NULL_ORDERING_KEY_ALIAS_PREFIX}${suffix}`)) {
      suffix += 1
    }
    return `${NULL_ORDERING_KEY_ALIAS_PREFIX}${suffix}`
  }

  private selectedNullOrderingKeys(qb: SelectQueryBuilder<Entity>): SelectQuery[] {
    return qb.expressionMap.selects.filter(({ aliasName }) => aliasName?.startsWith(NULL_ORDERING_KEY_ALIAS_PREFIX))
  }

  /**
   * @description An update query has no select list, and a virtual column is itself a select alias, which another
   * select expression cannot reference.
   */
  private canSelectNullOrderingKey<T extends Sortable<Entity>>(qb: T, field: string): qb is T & SelectQueryBuilder<Entity> {
    return qb instanceof SelectQueryBuilder && !this.virtualColumns.includes(field)
  }

  private get driverType(): string {
    return this.repo?.manager?.connection?.options?.type
  }
}
