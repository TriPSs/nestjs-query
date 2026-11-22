import {
  Class,
  DeepPartial,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FindByIdOptions,
  FindRelationOptions,
  GetByIdOptions,
  NoOpQueryService,
  Query,
  QueryRelationsOptions,
  SortDirection,
  SortField,
  UpdateOneOptions
} from '@ptc-org/nestjs-query-core'
import {
  and,
  asc,
  between,
  type Column,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notBetween,
  notInArray,
  or,
  type SQL
} from 'drizzle-orm'

type Columns = Record<string, Column>

/* The service works on any drizzle dialect, whose query builders are typed per dialect.
 * The db handle is therefore deliberately loose (`any` boundary) and validated at runtime.
 * Unused options params implement the core QueryService contract and stay named like it. */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

/**
 * Minimal structural view of a drizzle database instance.
 * The full generics of drizzle are dialect-specific; the service works on any of them.
 */
export type DrizzleDatabase = {
  select: (...args: unknown[]) => any
  insert: (table: unknown) => any
  update: (table: unknown) => any
  delete: (table: unknown) => any
  /** Present when the instance was created with the `relations` option (RQB v2). */
  query?: Record<string, any>
}

export interface DrizzleQueryServiceOptions {
  db: DrizzleDatabase
  table: unknown
  /** Key of the table in the schema passed to `defineRelations()`, required for relation reads. */
  relationsKey?: string
  /** The object returned by `defineRelations()`; enables SQL COUNT in `countRelations` instead of loading rows. */
  relations?: unknown
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

export class DrizzleQueryService<DTO extends object, C = DeepPartial<DTO>, U = DeepPartial<DTO>> extends NoOpQueryService<
  DTO,
  C,
  U
> {
  constructor(protected options: DrizzleQueryServiceOptions) {
    super()
  }

  private get columns(): Columns {
    return getTableColumns(this.options.table as never)
  }

  private get pk(): Column {
    const pk = Object.values(this.columns).find((column) => column.primary)
    if (!pk) {
      throw new Error('Unable to detect the primary key column of the table')
    }
    return pk
  }

  async findById(id: string | number, _opts?: FindByIdOptions<DTO>): Promise<DTO | undefined> {
    const rows = await this.options.db.select().from(this.options.table).where(eq(this.pk, id))
    return (rows[0] as DTO) ?? undefined
  }

  async getById(id: string | number, opts?: GetByIdOptions<DTO>): Promise<DTO> {
    const row = await this.findById(id, opts)
    if (!row) {
      throw new Error(`Record with id ${id} not found`)
    }
    return row
  }

  async query(query: Query<DTO>): Promise<DTO[]> {
    let qb = this.options.db.select().from(this.options.table)
    const where = this.buildWhere(query.filter)
    if (where) {
      qb = qb.where(where)
    }
    const order = this.buildOrderBy(query.sorting)
    if (order.length) {
      qb = qb.orderBy(...order)
    }
    const { limit, offset } = query.paging ?? {}
    if (limit !== undefined) {
      qb = qb.limit(limit)
    }
    if (offset !== undefined) {
      qb = qb.offset(offset)
    }
    const rows = await qb
    return rows as DTO[]
  }

  async count(filter: Filter<DTO>): Promise<number> {
    let qb = this.options.db.select({ value: count() }).from(this.options.table)
    const where = this.buildWhere(filter)
    if (where) {
      qb = qb.where(where)
    }
    const rows = await qb
    return Number(rows[0]?.value ?? 0)
  }

  async createOne(item: C): Promise<DTO> {
    const rows = await this.options.db.insert(this.options.table).values(item).returning()
    return rows[0] as DTO
  }

  async createMany(items: C[]): Promise<DTO[]> {
    if (!items.length) {
      return []
    }
    const rows = await this.options.db.insert(this.options.table).values(items).returning()
    return rows as DTO[]
  }

  async updateOne(id: string | number, update: U, _opts?: UpdateOneOptions<DTO>): Promise<DTO> {
    const rows = await this.options.db.update(this.options.table).set(update).where(eq(this.pk, id)).returning()
    if (!rows.length) {
      throw new Error(`Unable to find record with id ${id}`)
    }
    return rows[0] as DTO
  }

  async deleteOne(id: number | string, _opts?: DeleteOneOptions<DTO>): Promise<DTO> {
    const rows = await this.options.db.delete(this.options.table).where(eq(this.pk, id)).returning()
    if (!rows.length) {
      throw new Error(`Unable to find record with id ${id}`)
    }
    return rows[0] as DTO
  }

  async deleteMany(filter: Filter<DTO>): Promise<DeleteManyResponse> {
    let qb = this.options.db.delete(this.options.table)
    const where = this.buildWhere(filter)
    if (where) {
      qb = qb.where(where)
    }
    const rows = await qb.returning()
    return { deletedCount: rows.length }
  }

  async findRelation<Relation extends object>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>
  async findRelation<Relation extends object>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<DTO, Relation | undefined>>
  async findRelation<Relation extends object>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO | DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<DTO, Relation | undefined> | Relation | undefined> {
    const config = this.relationsQueryConfig({ filter: opts?.filter })
    if (!Array.isArray(entities)) {
      const row = await this.fetchOwnRow(entities, relationName, config)
      return (row?.[relationName] as Relation) ?? undefined
    }
    const byPk = await this.relatedByPk(entities, relationName, config)
    return new Map(
      entities.map((dto) => [dto, (byPk.get((dto as Record<string, unknown>)[this.pkName]) as Relation) ?? undefined])
    )
  }

  async queryRelations<Relation extends object>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO,
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[]>
  async queryRelations<Relation extends object>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, Relation[]>>
  async queryRelations<Relation extends object>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO | DTO[],
    query: Query<Relation>,
    _opts?: QueryRelationsOptions
  ): Promise<Map<DTO, Relation[]> | Relation[]> {
    const config = this.relationsQueryConfig(query)
    if (!Array.isArray(entities)) {
      const row = await this.fetchOwnRow(entities, relationName, config)
      return this.asRelatedRows<Relation>(row?.[relationName])
    }
    const byPk = await this.relatedByPk(entities, relationName, config)
    return new Map(
      entities.map((dto) => [dto, (byPk.get((dto as Record<string, unknown>)[this.pkName]) as Relation[] | undefined) ?? []])
    )
  }

  async countRelations<Relation extends object>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO,
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number>
  async countRelations<Relation extends object>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, number>>
  async countRelations<Relation extends object>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO | DTO[],
    filter: Filter<Relation>,
    _opts?: QueryRelationsOptions
  ): Promise<Map<DTO, number> | number> {
    const sqlCounts = await this.sqlCountRelations(relationName, entities, filter)
    if (sqlCounts) {
      return sqlCounts
    }
    // fallback when no relations schema is provided: load the rows and count them
    const config = this.relationsQueryConfig({ filter })
    if (!Array.isArray(entities)) {
      const row = await this.fetchOwnRow(entities, relationName, config)
      return this.asRelatedRows<Relation>(row?.[relationName]).length
    }
    const byPk = await this.relatedByPk(entities, relationName, config)
    return new Map(
      entities.map((dto) => [
        dto,
        (byPk.get((dto as Record<string, unknown>)[this.pkName]) as unknown[] | undefined)?.length ?? 0
      ])
    )
  }

  /** Counts related rows with a grouped SQL COUNT, derived from the relations schema. */
  private async sqlCountRelations(
    relationName: string,
    entities: DTO | DTO[],
    filter: Filter<any>
  ): Promise<Map<DTO, number> | number | undefined> {
    const relation = this.relationInfo(relationName)
    if (!relation) {
      return undefined
    }
    if (relation.through || relation.throughTable) {
      throw new Error('countRelations does not support many-to-many (junction table) relations yet')
    }
    if (relation.targetColumns.length !== 1) {
      throw new Error('countRelations does not support composite foreign keys yet')
    }

    const targetColumn = relation.targetColumns[0]
    const ids = Array.isArray(entities)
      ? entities.map((dto) => (dto as Record<string, unknown>)[this.pkName])
      : [(entities as Record<string, unknown>)[this.pkName]]
    const conditions = [inArray(targetColumn, ids as never)]
    const filterCondition = this.buildWhere(filter, getTableColumns(relation.targetTable as never))
    if (filterCondition) {
      conditions.push(filterCondition)
    }

    const rows = await this.options.db
      .select({ key: targetColumn, value: count() })
      .from(relation.targetTable)
      .where(and(...conditions))
      .groupBy(targetColumn)
    const counts = new Map<unknown, number>(rows.map((row: { key: unknown; value: unknown }) => [row.key, Number(row.value)]))

    if (!Array.isArray(entities)) {
      return counts.get((entities as Record<string, unknown>)[this.pkName]) ?? 0
    }
    return new Map(entities.map((dto) => [dto, counts.get((dto as Record<string, unknown>)[this.pkName]) ?? 0]))
  }

  /** Internal shape of a relation definition in the `defineRelations()` output (rc.5). */
  private relationInfo(relationName: string):
    | {
        relationType: string
        sourceColumns: Column[]
        targetColumns: Column[]
        targetTable: unknown
        through?: unknown
        throughTable?: unknown
      }
    | undefined {
    const schema = this.options.relations as Record<string, any> | undefined
    return schema?.[this.options.relationsKey as string]?.relations?.[relationName]
  }

  /** Relational query API of the drizzle instance (requires `relationsKey` and `drizzle({ client, relations })`). */
  private get rqb(): Record<string, any> {
    const { db, relationsKey } = this.options
    if (!relationsKey) {
      throw new Error('relationsKey is required to query relations')
    }
    if (!db.query) {
      throw new Error('The drizzle instance has no relational query API: create it with drizzle({ client, relations })')
    }
    return db.query[relationsKey]
  }

  private get pkName(): string {
    return Object.entries(this.columns).find(([, column]) => column.primary)![0]
  }

  private async fetchOwnRow(
    dto: DTO,
    relationName: string,
    config: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    return await this.rqb.findFirst({
      where: { [this.pkName]: { eq: (dto as Record<string, unknown>)[this.pkName] } },
      with: { [relationName]: config }
    })
  }

  private async relatedByPk(dtos: DTO[], relationName: string, config: Record<string, unknown>): Promise<Map<unknown, unknown>> {
    const rows = await this.rqb.findMany({
      where: { [this.pkName]: { in: dtos.map((dto) => (dto as Record<string, unknown>)[this.pkName]) } },
      with: { [relationName]: config }
    })
    return new Map(rows.map((row: Record<string, unknown>) => [row[this.pkName], row[relationName]]))
  }

  private relationsQueryConfig(query: Query<any>): Record<string, unknown> {
    const config: Record<string, unknown> = {}
    const where = this.buildRelationsFilter(query.filter)
    if (where) {
      config.where = where
    }
    const orderBy = this.buildRelationsOrderBy(query.sorting)
    if (orderBy) {
      config.orderBy = orderBy
    }
    const { limit, offset } = query.paging ?? {}
    if (limit !== undefined) {
      config.limit = limit
    }
    if (offset !== undefined) {
      config.offset = offset
    }
    return config
  }

  /**
   * Maps a core filter to a relational query v2 object filter.
   * The v2 API rejects SQL conditions in `where`; groupings are the uppercase AND/OR keys.
   */
  protected buildRelationsFilter(filter: Filter<unknown> | undefined): Record<string, unknown> | undefined {
    if (!filter) {
      return undefined
    }

    const result: Record<string, unknown> = {}
    const andParts = (filter.and ?? []).map((f) => this.buildRelationsFilter(f)).filter(isDefined)
    if (andParts.length) {
      result.AND = andParts
    }
    const orParts = (filter.or ?? []).map((f) => this.buildRelationsFilter(f)).filter(isDefined)
    if (orParts.length) {
      result.OR = orParts
    }
    for (const [field, comparison] of Object.entries(filter) as unknown as [string, Record<string, unknown>][]) {
      if (field === 'and' || field === 'or') {
        continue
      }
      result[field] = this.buildRelationsComparison(comparison)
    }
    return Object.keys(result).length ? result : undefined
  }

  protected buildRelationsComparison(comparison: Record<string, unknown>): Record<string, unknown> {
    const conditions = Object.entries(comparison).map(([op, value]) => this.buildRelationsCondition(op, value))
    return conditions.length === 1 ? conditions[0] : { AND: conditions }
  }

  protected buildRelationsCondition(op: string, value: unknown): Record<string, unknown> {
    switch (op) {
      case 'eq':
      case 'is':
        return value === null ? { isNull: true } : { eq: value }
      case 'neq':
      case 'isNot':
        return value === null ? { isNotNull: true } : { ne: value }
      case 'gt':
        return { gt: value }
      case 'gte':
        return { gte: value }
      case 'lt':
        return { lt: value }
      case 'lte':
        return { lte: value }
      case 'in':
        return { in: value }
      case 'notIn':
        return { notIn: value }
      case 'between':
        return { AND: [{ gte: (value as unknown[])[0] }, { lte: (value as unknown[])[1] }] }
      case 'notBetween':
        return { OR: [{ lt: (value as unknown[])[0] }, { gt: (value as unknown[])[1] }] }
      case 'like':
        return { like: value }
      case 'notLike':
        return { notLike: value }
      // shortcut: no cross-dialect ILIKE exists; LIKE is already case-insensitive for ASCII on SQLite/MySQL,
      // use `ilike` here when Postgres support matters
      case 'iLike':
        return { like: value }
      case 'notILike':
        return { notLike: value }
      default:
        throw new Error(`Unsupported filter operator: ${op}`)
    }
  }

  protected buildRelationsOrderBy(sorting: SortField<unknown>[] | undefined): Record<string, string> | undefined {
    if (!sorting?.length) {
      return undefined
    }
    return Object.fromEntries(sorting.map((s) => [s.field as string, s.direction === SortDirection.DESC ? 'desc' : 'asc']))
  }

  private asRelatedRows<Relation extends object>(value: unknown): Relation[] {
    if (Array.isArray(value)) {
      return value as Relation[]
    }
    return value ? [value as Relation] : []
  }

  protected buildWhere(filter: Filter<DTO> | undefined, columns: Columns = this.columns): SQL | undefined {
    if (!filter) {
      return undefined
    }

    const conditions: SQL[] = []
    const andParts = (filter.and ?? []).map((f) => this.buildWhere(f, columns)).filter(isDefined)
    if (andParts.length) {
      conditions.push(and(...andParts) as SQL)
    }
    const orParts = (filter.or ?? []).map((f) => this.buildWhere(f, columns)).filter(isDefined)
    if (orParts.length) {
      conditions.push(or(...orParts) as SQL)
    }
    for (const [field, comparison] of Object.entries(filter) as unknown as [string, Record<string, unknown>][]) {
      if (field === 'and' || field === 'or') {
        continue
      }
      const column = columns[field]
      if (!column) {
        throw new Error(`Unknown filter field: ${field}`)
      }
      conditions.push(this.buildComparison(column, comparison))
    }

    if (!conditions.length) {
      return undefined
    }
    return and(...conditions)
  }

  protected buildComparison(column: Column, comparison: Record<string, unknown>): SQL {
    const conditions = Object.entries(comparison).map(([op, value]) => this.buildCondition(op, value, column))
    return and(...conditions) as SQL
  }

  protected buildCondition(op: string, value: unknown, column: Column): SQL {
    switch (op) {
      case 'eq':
      case 'is':
        return value === null ? isNull(column) : eq(column, value as never)
      case 'neq':
      case 'isNot':
        return (value === null ? not(isNull(column)) : ne(column, value as never)) as SQL
      case 'gt':
        return gt(column, value as never)
      case 'gte':
        return gte(column, value as never)
      case 'lt':
        return lt(column, value as never)
      case 'lte':
        return lte(column, value as never)
      case 'in':
        return inArray(column, value as never)
      case 'notIn':
        return notInArray(column, value as never)
      case 'between': {
        const [min, max] = value as [never, never]
        return between(column, min, max)
      }
      case 'notBetween': {
        const [min, max] = value as [never, never]
        return notBetween(column, min, max)
      }
      case 'like':
        return like(column, value as string)
      case 'notLike':
        return not(like(column, value as string)) as SQL
      // shortcut: no cross-dialect ILIKE exists; LIKE is already case-insensitive for ASCII on SQLite/MySQL,
      // upgrade to `sql` with lower() per dialect when Postgres support matters
      case 'iLike':
        return like(column, value as string)
      case 'notILike':
        return not(like(column, value as string)) as SQL
      default:
        throw new Error(`Unsupported filter operator: ${op}`)
    }
  }

  protected buildOrderBy(sorting: SortField<DTO>[] | undefined): SQL[] {
    return (sorting ?? []).map((s) => {
      const column = this.columns[s.field as string]
      if (!column) {
        throw new Error(`Unknown sort field: ${String(s.field)}`)
      }
      return s.direction === SortDirection.DESC ? desc(column) : asc(column)
    })
  }
}
