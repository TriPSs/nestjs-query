import {
  AggregateQuery,
  AggregateQueryField,
  Filter,
  getFilterFields,
  Paging,
  Query,
  SelectRelation,
  SortField
} from '@ptc-org/nestjs-query-core'
import merge from 'lodash.merge'
import {
  DeleteQueryBuilder,
  EntityMetadata,
  QueryBuilder,
  Repository,
  SelectQueryBuilder,
  UpdateQueryBuilder,
  WhereExpressionBuilder
} from 'typeorm'
import { SoftDeleteQueryBuilder } from 'typeorm/query-builder/SoftDeleteQueryBuilder'

import { AggregateBuilder } from './aggregate.builder'
import { WhereBuilder } from './where.builder'

/**
 * @internal
 *
 * Interface that for Typeorm query builders that are sortable.
 */
interface Sortable<Entity> extends QueryBuilder<Entity> {
  addOrderBy(sort: string, order?: 'ASC' | 'DESC', nulls?: 'NULLS FIRST' | 'NULLS LAST'): this
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
 * Nested aliased type
 */
export interface NestedRelationAliased {
  [keys: string]: {
    alias: string
    value: NestedRelationAliased
  }
}

/**
 * @internal
 *
 * Class that will convert a Query into a `typeorm` Query Builder.
 */
export class FilterQueryBuilder<Entity> {
  constructor(
    readonly repo: Repository<Entity>,
    readonly whereBuilder: WhereBuilder<Entity> = new WhereBuilder<Entity>(),
    readonly aggregateBuilder: AggregateBuilder<Entity> = new AggregateBuilder<Entity>(repo)
  ) {}

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

    return sorts.reduce((prevQb, { field, direction, nulls }) => {
      const col = alias ? `${alias}.${field as string}` : `${field as string}`
      return prevQb.addOrderBy(col, direction, nulls)
    }, qb)
  }

  public applyAggregateGroupBy<T extends Groupable<Entity>>(
    qb: T,
    aggregatedGroupBy?: AggregateQueryField<Entity>[],
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
    relationsMap?: NestedRelationAliased,
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
      const relationChildren = relation.value

      // TODO:: Change to find and also apply the query for the relation
      const selectRelation = selectRelations && selectRelations.find(({ name }) => name === relationKey)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

      if (selectRelation) {
        return this.applyRelationJoinsRecursive(
          rqb.leftJoinAndSelect(`${alias ?? rqb.alias}.${relationKey}`, relationAlias),
          relationChildren,
          selectRelation.query.relations,
          relationAlias
        )
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
   * Checks if the query should use skip/take instead of limit/offset
   */
  private shouldUseSkipTake(filter?: Filter<Entity>): boolean {
    if (!filter) {
      return false
    }

    return (
      getFilterFields(filter).filter((field) => {
        const relation = this.repo.metadata.relations.find(({ propertyName }) => propertyName === field)

        if (!relation) {
          return false
        }

        if (!relation || relation.isOneToOne || relation.isManyToOne) {
          return false
          // } else if (relation.isOneToMany) {
          //   TODO
          // return false
        } else {
          return true
        }
      }).length > 0
    )
  }

  public getReferencedRelationsWithAliasRecursive(
    metadata: EntityMetadata,
    filter: Filter<unknown> = {},
    selectRelations: SelectRelation<Entity>[] = []
  ): NestedRelationAliased {
    const referencedRelations = this.getReferencedRelationsRecursive(metadata, filter, selectRelations)
    return this.injectRelationsAliasRecursive(referencedRelations)
  }

  private injectRelationsAliasRecursive(relations: NestedRecord, counter = new Map<string, number>()): NestedRelationAliased {
    return Object.entries(relations).reduce((prev, [name, children]) => {
      const count = (counter.get(name) ?? -1) + 1
      const alias = count === 0 ? name : `${name}_${count}`
      counter.set(name, count)

      return {
        ...prev,
        [name]: {
          alias,
          value: this.injectRelationsAliasRecursive(children, counter)
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
}
