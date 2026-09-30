/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AggregateQuery, Class, Query } from '@ptc-org/nestjs-query-core'
import { Brackets, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm'
import { DriverUtils } from 'typeorm/driver/DriverUtils'
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata'
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata'

import { AggregateBuilder } from './aggregate.builder'
import { FilterQueryBuilder } from './filter-query.builder'

interface JoinCondition {
  leftHand: string
  rightHand: string
}

interface JoinColumn {
  target: Class<unknown> | string
  alias: string
  conditions: JoinCondition[]
}

type SQLFragment = {
  sql: string
  params: ObjectLiteral
}

type UnionSQLFragment = {
  joinCondition?: string
} & SQLFragment

/**
 * A column of the relation query that holds the key of the owning entity.
 */
interface OwnerKey {
  alias: string
  column: ColumnMetadata
  ownerColumn: ColumnMetadata
}

interface RelationQuery<Relation> {
  relation: RelationMetadata
  from: Class<Relation>
  fromAlias: string
  joins: JoinColumn[]
  ownerKeys: OwnerKey[]
  distinct: boolean
}

type RawRelation = Record<string, unknown>

type UnionQueries = {
  unions: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: ObjectLiteral
}

export type EntityIndexRelation<Relation> = Relation & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __nestjsQuery__entityIndex__: number
}

/**
 * @internal
 *
 * Class that will convert a Query into a `typeorm` Query Builder.
 */
export class RelationQueryBuilder<Entity, Relation> {
  readonly filterQueryBuilder: FilterQueryBuilder<Relation>

  readonly relationRepo: Repository<Relation>

  private relationMetadata: RelationQuery<Relation> | undefined

  private paramCount: number

  constructor(
    readonly repo: Repository<Entity>,
    readonly relation: string
  ) {
    this.relationRepo = this.repo.manager.getRepository<Relation>(this.relationMeta.from)
    this.filterQueryBuilder = new FilterQueryBuilder<Relation>(this.relationRepo)
    this.paramCount = 0
  }

  public select(entity: Entity, query: Query<Relation>, withDeleted?: boolean): SelectQueryBuilder<Relation> {
    const hasRelations = this.filterQueryBuilder.filterHasRelations(query.filter)

    let relationBuilder = this.createRelationQueryBuilder(entity)
    relationBuilder = hasRelations
      ? this.filterQueryBuilder.applyRelationJoinsRecursive(
          relationBuilder,
          this.filterQueryBuilder.getReferencedRelationsWithAliasRecursive(this.relationRepo.metadata, query.filter)
        )
      : relationBuilder

    relationBuilder = this.filterQueryBuilder.applyFilter(relationBuilder, query.filter, relationBuilder.alias)
    relationBuilder = this.filterQueryBuilder.applyPaging(relationBuilder, query.paging)
    if (withDeleted) relationBuilder = relationBuilder.withDeleted()

    return this.filterQueryBuilder.applySorting(relationBuilder, query.sorting, relationBuilder.alias)
  }

  public batchSelect(entities: Entity[], query: Query<Relation>, withDeleted?: boolean): SelectQueryBuilder<Relation> {
    let qb = this.relationRepo.createQueryBuilder(this.relationMeta.fromAlias)

    qb.withDeleted()
    qb = this.filterQueryBuilder.applyRelationJoinsRecursive(
      qb,
      this.filterQueryBuilder.getReferencedRelationsWithAliasRecursive(this.relationRepo.metadata, query.filter, query.relations),
      query.relations
    )
    qb = this.filterQueryBuilder.applyFilter(qb, query.filter, qb.alias)
    qb = this.filterQueryBuilder.applySorting(qb, query.sorting, qb.alias)
    qb = this.filterQueryBuilder.applyPaging(qb, query.paging)

    if (this.relationRepo.metadata.deleteDateColumn?.propertyName && !withDeleted) {
      qb = qb.andWhere(`${qb.alias}.${this.relationRepo.metadata.deleteDateColumn.propertyName} IS NULL`)
    }
    return this.selectOwners(qb, entities)
  }

  /**
   * Maps the rows of a `batchSelect` to the entities that own them.
   */
  public mapRelationsToOwners(entities: Entity[], relations: Relation[], rawRelations: unknown[]): Map<Entity, Relation[]> {
    const relationsByKey = new Map(relations.map((relation) => [this.relationKeyOf(relation), relation]))
    const rawRelationsByOwnerKey = this.groupByOwnerKey(rawRelations as RawRelation[])

    return new Map(
      entities.map((entity) => {
        // First filter the raw relations with the PK of the entity, then filter the relations
        // with the PK of the raw relation
        const ownerRawRelations = rawRelationsByOwnerKey.get(this.ownerKeyOf(entity)) ?? []
        const ownerRelations = ownerRawRelations.map((rawRelation) =>
          relationsByKey.get(this.relationKeyOfRawRelation(rawRelation))
        )

        return [entity, [...new Set(ownerRelations)].filter((relation) => relation !== undefined)]
      })
    )
  }

  public batchAggregate(
    entities: Entity[],
    query: Query<Relation>,
    aggregateQuery: AggregateQuery<Relation>
  ): SelectQueryBuilder<EntityIndexRelation<Record<string, unknown>>> {
    const selects = [...AggregateBuilder.getAggregateSelects(aggregateQuery), this.entityIndexColName].map((c) =>
      this.escapeName(c)
    )

    const unionFragment = this.createUnionAggregateSubQuery(entities, query, aggregateQuery)

    return this.relationRepo.manager.connection
      .createQueryBuilder()
      .select(selects)
      .from<EntityIndexRelation<Record<string, unknown>>>(`(${unionFragment.sql})`, this.unionAlias)
      .setParameters(unionFragment.params)
  }

  public aggregate(
    entity: Entity,
    query: Query<Relation>,
    aggregateQuery: AggregateQuery<Relation>
  ): SelectQueryBuilder<Relation> {
    let relationBuilder = this.createRelationQueryBuilder(entity)
    relationBuilder = this.filterQueryBuilder.applyAggregate(relationBuilder, aggregateQuery, relationBuilder.alias)
    relationBuilder = this.filterQueryBuilder.applyFilter(relationBuilder, query.filter, relationBuilder.alias)
    relationBuilder = this.filterQueryBuilder.applyAggregateSorting(
      relationBuilder,
      aggregateQuery.groupBy,
      relationBuilder.alias
    )
    relationBuilder = this.filterQueryBuilder.applyAggregateGroupBy(
      relationBuilder,
      aggregateQuery.groupBy,
      relationBuilder.alias
    )
    return relationBuilder
  }

  public get relationMeta(): RelationQuery<Relation> {
    if (this.relationMetadata) {
      return this.relationMetadata
    }

    const relation = this.repo.metadata.relations.find((r) => r.propertyName === this.relation)

    if (!relation) {
      throw new Error(`Unable to find entity for relation '${this.relation}'`)
    } else if (relation.isManyToOne || relation.isOneToOneOwner) {
      this.relationMetadata = this.getManyToOneOrOneToOneOwnerMeta(relation)
    } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
      this.relationMetadata = this.getOneToManyOrOneToOneNotOwnerMeta(relation)
    } else if (relation.isManyToManyOwner) {
      this.relationMetadata = this.getManyToManyOwnerMeta(relation)
    } else {
      // many-to-many non owner
      this.relationMetadata = this.getManyToManyNotOwnerMetadata(relation)
    }

    return this.relationMetadata
  }

  private createUnionAggregateSubQuery(
    entities: Entity[],
    query: Query<Relation>,
    aggregateQuery: AggregateQuery<Relation>
  ): UnionSQLFragment {
    const { fromAlias } = this.relationMeta
    const subQueries = entities.map((e, index) => {
      const subQuery = this.aggregate(e, query, aggregateQuery)
      return subQuery.addSelect(`${index}`, this.entityIndexColName)
    })
    const unionSqls = subQueries.reduce(
      ({ unions, parameters }: UnionQueries, sq) => ({
        unions: [...unions, sq.getQuery()],
        parameters: { ...parameters, ...sq.getParameters() }
      }),
      { unions: [], parameters: {} }
    )

    const unionSql = unionSqls.unions
      .map(
        (u) => `SELECT *
                FROM (${u}) AS ${this.escapeName(fromAlias)}`
      )
      .join(' UNION ALL ')
    return { sql: unionSql, params: unionSqls.parameters }
  }

  private createRelationQueryBuilder(entity: Entity): SelectQueryBuilder<Relation> {
    const queryBuilder = this.applyOwnerJoins(this.relationRepo.createQueryBuilder(this.relationMeta.fromAlias))

    return queryBuilder.where(
      new Brackets((bqb) => {
        const where = this.ownerCondition(entity)

        bqb.andWhere(where.sql, where.params)
      })
    )
  }

  private selectOwners(queryBuilder: SelectQueryBuilder<Relation>, entities: Entity[]): SelectQueryBuilder<Relation> {
    const params: ObjectLiteral = {}

    const sql = this.relationMeta.ownerKeys
      .map((ownerKey) => {
        const paramName = this.getParamName()
        params[paramName] = entities.map((entity) => this.storedOwnerKeyValue(ownerKey, entity))

        if (!this.isRelationColumn(ownerKey)) {
          // Also select the columns, so we can use them to map later
          queryBuilder.addSelect(this.ownerKeyPath(ownerKey), this.ownerKeyRawAlias(ownerKey))
        }

        return `${this.ownerKeyPath(ownerKey)} IN (:...${paramName})`
      })
      .join(' AND ')

    // Add the needed joins
    return this.applyOwnerJoins(queryBuilder).distinct(this.relationMeta.distinct).andWhere(sql, params)
  }

  private ownerCondition(entity: Entity): SQLFragment {
    const params: ObjectLiteral = {}

    const sql = this.relationMeta.ownerKeys
      .map((ownerKey) => {
        const paramName = this.getParamName()
        params[paramName] = this.storedOwnerKeyValue(ownerKey, entity)

        return `${this.ownerKeyPath(ownerKey)} = :${paramName}`
      })
      .join(' AND ')

    return { sql, params }
  }

  private applyOwnerJoins(queryBuilder: SelectQueryBuilder<Relation>): SelectQueryBuilder<Relation> {
    return this.relationMeta.joins.reduce((qb, join) => {
      const conditions = join.conditions.map(({ leftHand, rightHand }) => `${leftHand} = ${rightHand}`)

      return qb.innerJoin(join.target, join.alias, conditions.join(' AND '))
    }, queryBuilder)
  }

  /**
   * The owner is always joined under its own alias. A filter join to the owner's entity type can belong to
   * another relation, or be a to-many inverse, so it cannot stand in for the owner join.
   */
  private getManyToOneOrOneToOneOwnerMeta(relation: RelationMetadata): RelationQuery<Relation> {
    const aliasName = this.ownerAlias

    const joins: JoinColumn[] = [
      {
        target: relation.entityMetadata.target as Class<unknown>,
        alias: aliasName,
        conditions: relation.joinColumns.map((joinColumn) => ({
          leftHand: `${aliasName}.${relation.propertyPath}.${joinColumn.referencedColumn.propertyPath}`,
          rightHand: `${relation.propertyName}.${joinColumn.referencedColumn.propertyPath}`
        }))
      }
    ]

    return {
      relation,
      from: relation.type as Class<Relation>,
      fromAlias: relation.propertyName,
      joins,
      ownerKeys: relation.entityMetadata.primaryColumns.map((column) => ({ alias: aliasName, column, ownerColumn: column })),
      distinct: false
    }
  }

  private getOneToManyOrOneToOneNotOwnerMeta(relation: RelationMetadata): RelationQuery<Relation> {
    const aliasName = relation.propertyName

    return {
      relation,
      from: relation.inverseRelation.entityMetadata.target as Class<Relation>,
      fromAlias: aliasName,
      joins: [],
      // create a filter for the raw relation array to filter only for the objects that are related to this entity
      // do this by building an alias based on the column database name for filtering
      // e.g. if the entity is a customer, look for a customer id in the raw relation entity object.
      ownerKeys: this.referencingOwnerKeys(aliasName, relation.inverseRelation.joinColumns),
      // Distinct the query so the joins cannot cause duplicate data
      distinct: true
    }
  }

  private getManyToManyOwnerMeta(relation: RelationMetadata): RelationQuery<Relation> {
    const mainAlias = relation.propertyName
    const joinAlias = relation.junctionEntityMetadata.tableName
    const joins: JoinColumn[] = [
      {
        target: joinAlias,
        alias: joinAlias,
        conditions: relation.inverseJoinColumns.map((inverseJoinColumn) => ({
          leftHand: `${joinAlias}.${inverseJoinColumn.propertyName}`,
          rightHand: `${mainAlias}.${inverseJoinColumn.referencedColumn.propertyPath}`
        }))
      }
    ]

    return {
      relation,
      from: relation.type as Class<Relation>,
      fromAlias: mainAlias,
      joins,
      ownerKeys: this.referencingOwnerKeys(joinAlias, relation.joinColumns),
      distinct: false
    }
  }

  private getManyToManyNotOwnerMetadata(relation: RelationMetadata): RelationQuery<Relation> {
    const mainAlias = relation.propertyName
    const joinAlias = relation.junctionEntityMetadata.tableName
    const joins = [
      {
        target: joinAlias,
        alias: joinAlias,
        conditions: relation.inverseRelation.joinColumns.map((joinColumn) => ({
          leftHand: `${joinAlias}.${joinColumn.propertyName}`,
          rightHand: `${mainAlias}.${joinColumn.referencedColumn.propertyPath}`
        }))
      }
    ]

    return {
      relation,
      from: relation.type as Class<Relation>,
      fromAlias: mainAlias,
      joins,
      ownerKeys: this.referencingOwnerKeys(joinAlias, relation.inverseRelation.inverseJoinColumns),
      distinct: false
    }
  }

  private referencingOwnerKeys(alias: string, columns: ColumnMetadata[]): OwnerKey[] {
    return columns.map((column) => ({ alias, column, ownerColumn: column.referencedColumn }))
  }

  private groupByOwnerKey(rawRelations: RawRelation[]): Map<string, RawRelation[]> {
    const groups = new Map<string, RawRelation[]>()

    for (const rawRelation of rawRelations) {
      const ownerKey = this.ownerKeyOfRawRelation(rawRelation)
      const group = groups.get(ownerKey) ?? []
      group.push(rawRelation)
      groups.set(ownerKey, group)
    }

    return groups
  }

  private ownerKeyPath(ownerKey: OwnerKey): string {
    return `${ownerKey.alias}.${ownerKey.column.propertyPath}`
  }

  /**
   * An owner key column selected by `selectOwners` is read back under an alias of its position among the owner keys.
   * An alias built from names could equal one `typeorm` gives a column of the relation, or grow past the length at
   * which a database truncates it.
   */
  private ownerKeyRawAlias(ownerKey: OwnerKey): string {
    return this.isRelationColumn(ownerKey)
      ? this.buildAlias(ownerKey.column.databaseName)
      : `__nestjsQuery__ownerKey${this.relationMeta.ownerKeys.indexOf(ownerKey)}__`
  }

  /**
   * `typeorm` already selects the columns of the queried relation. Selecting one again under another alias would
   * hide it from the entity it hydrates, so those are read back under the alias `typeorm` gave them. A column that
   * is not selected by default is selected under its own alias, so it stays hidden from the entity.
   */
  private isRelationColumn(ownerKey: OwnerKey): boolean {
    return ownerKey.alias === this.relationMeta.fromAlias && ownerKey.column.isSelect
  }

  /**
   * The value of an owner key column in the form the database stores it, as `typeorm` prepares it for a write.
   */
  private storedOwnerKeyValue(ownerKey: OwnerKey, entity: Entity): unknown {
    const { driver } = this.relationRepo.manager.connection

    return driver.preparePersistentValue(ownerKey.ownerColumn.getEntityValue(entity), ownerKey.ownerColumn) as unknown
  }

  private ownerKeyOf(entity: Entity): string {
    return this.keyOf(this.relationMeta.ownerKeys.map(({ ownerColumn }) => ownerColumn.getEntityValue(entity) as unknown))
  }

  private ownerKeyOfRawRelation(rawRelation: RawRelation): string {
    return this.keyOf(
      this.relationMeta.ownerKeys.map((ownerKey) =>
        this.hydrate(rawRelation[this.ownerKeyRawAlias(ownerKey)], ownerKey.ownerColumn)
      )
    )
  }

  private relationKeyOf(relation: Relation): string {
    return this.keyOf(this.relationRepo.metadata.primaryColumns.map((column) => column.getEntityValue(relation) as unknown))
  }

  private relationKeyOfRawRelation(rawRelation: RawRelation): string {
    return this.keyOf(
      this.relationRepo.metadata.primaryColumns.map((column) =>
        this.hydrate(rawRelation[this.buildAlias(column.databaseName)], column)
      )
    )
  }

  /**
   * Converts a raw value the way `typeorm` does when it hydrates the column, so it equals the entity's value.
   */
  private hydrate(rawValue: unknown, column: ColumnMetadata): unknown {
    return this.relationRepo.manager.connection.driver.prepareHydratedValue(rawValue, column) as unknown
  }

  /**
   * Serializes a key so equal values give equal strings, including the bigints `JSON.stringify` rejects.
   */
  private keyOf(values: unknown[]): string {
    return JSON.stringify(values, (_key, value: unknown) => (typeof value === 'bigint' ? { bigint: value.toString() } : value))
  }

  /**
   * A parameter name `typeorm` accepts, which a name taken from the entity, such as a non-latin property name, may not be.
   */
  private getParamName(): string {
    this.paramCount += 1

    return `ownerKey_${this.paramCount}`
  }

  get entityIndexColName(): string {
    return '__nestjsQuery__entityIndex__'
  }

  private get unionAlias(): string {
    return 'unioned'
  }

  /**
   * Alias of the owning entity join. It cannot be a relation property name, so it never collides with a filter join.
   */
  private get ownerAlias(): string {
    return '__nestjsQuery__owner__'
  }

  private escapeName(str: string): string {
    return this.relationRepo.manager.connection.driver.escape(str)
  }

  private buildAlias(...alias: string[]): string {
    alias.unshift(this.relationMeta.fromAlias)
    const buildOptions = {
      shorten: false,
      joiner: '_'
    }
    return DriverUtils.buildAlias(this.relationRepo.manager.connection.driver, buildOptions, ...alias)
  }
}
