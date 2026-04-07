import { Collection, EntityData, EntityKey, EntityRepository, FilterQuery, QueryOrder, QueryOrderMap, Reference, wrap } from '@mikro-orm/core'
import { OperatorMap } from '@mikro-orm/core/typings'
import {
  AggregateOptions,
  AggregateQuery,
  AggregateResponse,
  Assembler,
  AssemblerFactory,
  Class,
  CountOptions,
  DeepPartial,
  DeleteManyOptions,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FilterComparisons,
  FindByIdOptions,
  FindRelationOptions,
  GetByIdOptions,
  NoOpQueryService,
  Query,
  QueryOptions,
  QueryRelationsOptions,
  SortDirection,
  SortField,
  SortNulls,
  UpdateManyResponse,
  UpdateOneOptions
} from '@ptc-org/nestjs-query-core'

export class MikroOrmQueryService<DTO extends object, Entity extends object = DTO> extends NoOpQueryService<DTO, Entity> {
  constructor(
    protected repo: EntityRepository<Entity>,
    protected assembler?: Assembler<DTO, Entity>
  ) {
    super()
  }

  async getById(id: string | number, opts?: GetByIdOptions<DTO>): Promise<DTO> {
    const where = this.convertFilter(opts?.filter)
    const meta = this.repo.getEntityManager().getMetadata().get(this.repo.getEntityName())
    const pkField = meta.primaryKeys[0]
    const entity = await this.repo.findOneOrFail({
      ...where,
      [pkField]: id
    } as unknown as FilterQuery<Entity>)

    if (this.assembler) {
      return this.assembler.convertToDTO(entity)
    }
    return entity as unknown as DTO
  }

  async findById(id: string | number, opts?: FindByIdOptions<DTO>): Promise<DTO | undefined> {
    const where = this.convertFilter(opts?.filter)
    const meta = this.repo.getEntityManager().getMetadata().get(this.repo.getEntityName())
    const pkField = meta.primaryKeys[0]
    const entity = await this.repo.findOne({
      ...where,
      [pkField]: id
    } as unknown as FilterQuery<Entity>)

    if (!entity) return undefined

    if (this.assembler) {
      return this.assembler.convertToDTO(entity)
    }
    return entity as unknown as DTO
  }

  async query(query: Query<DTO>, _opts?: QueryOptions<DTO>): Promise<DTO[]> {
    const convertedQuery = this.assembler?.convertQuery?.(query) ?? query
    const orderBy = this.convertSorting(convertedQuery.sorting as SortField<unknown>[] | undefined)
    const { limit, offset } = convertedQuery.paging ?? {}
    const where = this.convertFilter(convertedQuery.filter)
    const entities = await this.repo.findAll({
      orderBy,
      limit,
      offset,
      where
    })

    if (this.assembler) {
      return this.assembler.convertToDTOs(entities)
    }
    return entities as unknown as DTO[]
  }

  async count(filter: Filter<DTO>, opts?: CountOptions): Promise<number> {
    if (opts?.withDeleted) {
      throw new Error('MikroOrmQueryService does not support withDeleted on count')
    }

    const convertedFilter = this.assembler?.convertQuery?.({ filter })?.filter ?? filter
    const where = this.convertFilter(convertedFilter)
    return this.repo.count(where)
  }

  async createOne(record: DeepPartial<DTO>): Promise<DTO> {
    const em = this.repo.getEntityManager()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entity = em.create(this.repo.getEntityName(), record as any)
    await em.persistAndFlush(entity)

    if (this.assembler) {
      return this.assembler.convertToDTO(entity as Entity)
    }
    return entity as unknown as DTO
  }

  async createMany(records: DeepPartial<DTO>[]): Promise<DTO[]> {
    const em = this.repo.getEntityManager()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entities = records.map((r) => em.create(this.repo.getEntityName(), r as any))
    await em.persistAndFlush(entities)

    if (this.assembler) {
      return this.assembler.convertToDTOs(entities as Entity[])
    }
    return entities as unknown as DTO[]
  }

  async updateOne(id: string | number, update: DeepPartial<DTO>, opts?: UpdateOneOptions<DTO>): Promise<DTO> {
    const entity = await this.getEntityById(id, opts?.filter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrap(entity).assign(update as any)
    await this.repo.getEntityManager().flush()

    if (this.assembler) {
      return this.assembler.convertToDTO(entity)
    }
    return entity as unknown as DTO
  }

  async updateMany(update: DeepPartial<DTO>, filter: Filter<DTO>): Promise<UpdateManyResponse> {
    const em = this.repo.getEntityManager()
    const where = this.convertFilter(filter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedCount = await em.nativeUpdate(this.repo.getEntityName(), where, update as any)
    return { updatedCount }
  }

  async deleteOne(id: string | number, opts?: DeleteOneOptions<DTO>): Promise<DTO> {
    if (opts?.useSoftDelete) {
      throw new Error('MikroOrmQueryService does not support useSoftDelete on deleteOne')
    }

    const entity = await this.getEntityById(id, opts?.filter)
    const dto = this.assembler ? this.assembler.convertToDTO(entity) : (entity as unknown as DTO)
    await this.repo.getEntityManager().removeAndFlush(entity)
    return dto
  }

  async deleteMany(filter: Filter<DTO>, opts?: DeleteManyOptions<DTO>): Promise<DeleteManyResponse> {
    if (opts?.useSoftDelete) {
      throw new Error('MikroOrmQueryService does not support useSoftDelete on deleteMany')
    }

    const em = this.repo.getEntityManager()
    const where = this.convertFilter(filter)
    const deletedCount = await em.nativeDelete(this.repo.getEntityName(), where)
    return { deletedCount }
  }

  async aggregate(
    filter: Filter<DTO>,
    aggregateQuery: AggregateQuery<DTO>,
    opts?: AggregateOptions
  ): Promise<AggregateResponse<DTO>[]> {
    if (opts?.withDeleted) {
      throw new Error('MikroOrmQueryService does not support withDeleted on aggregate')
    }

    const em = this.repo.getEntityManager()
    const meta = em.getMetadata().get(this.repo.getEntityName())
    const tableName = meta.tableName
    const where = this.convertFilter(filter)

    const selects: string[] = []
    const groupByFields: string[] = []

    if (aggregateQuery.count) {
      for (const { field } of aggregateQuery.count) {
        selects.push(`COUNT(${String(field)}) as count_${String(field)}`)
      }
    }

    if (aggregateQuery.sum) {
      for (const { field } of aggregateQuery.sum) {
        selects.push(`SUM(${String(field)}) as sum_${String(field)}`)
      }
    }

    if (aggregateQuery.avg) {
      for (const { field } of aggregateQuery.avg) {
        selects.push(`AVG(${String(field)}) as avg_${String(field)}`)
      }
    }

    if (aggregateQuery.max) {
      for (const { field } of aggregateQuery.max) {
        selects.push(`MAX(${String(field)}) as max_${String(field)}`)
      }
    }

    if (aggregateQuery.min) {
      for (const { field } of aggregateQuery.min) {
        selects.push(`MIN(${String(field)}) as min_${String(field)}`)
      }
    }

    if (aggregateQuery.groupBy) {
      for (const { field } of aggregateQuery.groupBy) {
        const fieldName = String(field)
        selects.push(`${fieldName} as groupBy_${fieldName}`)
        groupByFields.push(fieldName)
      }
    }

    if (selects.length === 0) {
      return []
    }

    const entities = await this.repo.findAll({ where })
    return this.computeAggregateInMemory(entities, aggregateQuery)
  }

  private computeAggregateInMemory(
    entities: Entity[],
    aggregateQuery: AggregateQuery<DTO>
  ): AggregateResponse<DTO>[] {
    if (!aggregateQuery.groupBy || aggregateQuery.groupBy.length === 0) {
      return [this.computeAggregateForGroup(entities, aggregateQuery)]
    }

    const groups = new Map<string, Entity[]>()
    for (const entity of entities) {
      const keyParts = aggregateQuery.groupBy.map(({ field }) => {
        const value = (entity as Record<string, unknown>)[String(field)]
        return JSON.stringify(value)
      })
      const key = keyParts.join('|')
      const group = groups.get(key) ?? []
      group.push(entity)
      groups.set(key, group)
    }

    const results: AggregateResponse<DTO>[] = []
    for (const [, groupEntities] of groups) {
      const result = this.computeAggregateForGroup(groupEntities, aggregateQuery)
      if (aggregateQuery.groupBy && groupEntities.length > 0) {
        result.groupBy = {} as Partial<DTO>
        for (const { field } of aggregateQuery.groupBy) {
          const value = (groupEntities[0] as Record<string, unknown>)[String(field)]
          ;(result.groupBy as Record<string, unknown>)[String(field)] = value
        }
      }
      results.push(result)
    }

    return results
  }

  private computeAggregateForGroup(entities: Entity[], aggregateQuery: AggregateQuery<DTO>): AggregateResponse<DTO> {
    const response: AggregateResponse<DTO> = {}

    if (aggregateQuery.count) {
      response.count = {}
      for (const { field } of aggregateQuery.count) {
        ;(response.count as Record<string, number>)[String(field)] = entities.length
      }
    }

    if (aggregateQuery.sum) {
      response.sum = {}
      for (const { field } of aggregateQuery.sum) {
        const sum = entities.reduce((acc, e) => {
          const val = (e as Record<string, unknown>)[String(field)]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
        ;(response.sum as Record<string, number>)[String(field)] = sum
      }
    }

    if (aggregateQuery.avg) {
      response.avg = {}
      for (const { field } of aggregateQuery.avg) {
        const sum = entities.reduce((acc, e) => {
          const val = (e as Record<string, unknown>)[String(field)]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
        ;(response.avg as Record<string, number>)[String(field)] = entities.length > 0 ? sum / entities.length : 0
      }
    }

    if (aggregateQuery.max) {
      response.max = {}
      for (const { field } of aggregateQuery.max) {
        let max: unknown = undefined
        for (const e of entities) {
          const val = (e as Record<string, unknown>)[String(field)]
          if (max === undefined || (val !== undefined && val !== null && (val as number) > (max as number))) {
            max = val
          }
        }
        ;(response.max as Record<string, unknown>)[String(field)] = max
      }
    }

    if (aggregateQuery.min) {
      response.min = {}
      for (const { field } of aggregateQuery.min) {
        let min: unknown = undefined
        for (const e of entities) {
          const val = (e as Record<string, unknown>)[String(field)]
          if (min === undefined || (val !== undefined && val !== null && (val as number) < (min as number))) {
            min = val
          }
        }
        ;(response.min as Record<string, unknown>)[String(field)] = min
      }
    }

    return response
  }

  private async getEntityById(id: string | number, filter?: Filter<DTO>): Promise<Entity> {
    const where = this.convertFilter(filter)
    const meta = this.repo.getEntityManager().getMetadata().get(this.repo.getEntityName())
    const pkField = meta.primaryKeys[0]
    return this.repo.findOneOrFail({
      ...where,
      [pkField]: id
    } as unknown as FilterQuery<Entity>)
  }

  protected convertFilter(filter: Filter<DTO> | Filter<Entity> | undefined): FilterQuery<Entity> {
    if (!filter) {
      return {} as FilterQuery<Entity>
    }

    const convertedFilter = this.assembler?.convertQuery?.({ filter } as Query<DTO>)?.filter ?? filter

    if ((convertedFilter?.and || convertedFilter?.or) && Object.keys(convertedFilter).length > 1) {
      throw new Error('filter must contain either only `and` or `or` property, or other properties')
    }

    if (convertedFilter?.and) {
      return {
        $and: convertedFilter.and.map((f) => this.convertFilter(f as Filter<DTO> | Filter<Entity>))
      } as FilterQuery<Entity>
    }

    if (convertedFilter?.or) {
      return {
        $or: convertedFilter.or.map((f) => this.convertFilter(f as Filter<DTO> | Filter<Entity>))
      } as FilterQuery<Entity>
    }

    return this.expandFilter(convertedFilter)
  }

  protected expandFilter(comparisons: FilterComparisons<unknown>): FilterQuery<Entity> {
    const filters = Object.entries(comparisons).map(([k, v]) => {
      return this.expandFilterComparison(k, v)
    })

    return Object.fromEntries(filters) as FilterQuery<Entity>
  }

  protected expandFilterComparison(k: string, v: unknown): [string, unknown] {
    if (k === 'eq' || k === 'is') {
      return ['$eq', v as string] satisfies ['$eq', OperatorMap<string>['$eq']]
    }

    if (k === 'neq' || k === 'isNot') {
      return ['$ne', v as string] satisfies ['$ne', OperatorMap<string>['$ne']]
    }

    if (k === 'gt') {
      return ['$gt', v as string] satisfies ['$gt', OperatorMap<string>['$gt']]
    }

    if (k === 'gte') {
      return ['$gte', v as string] satisfies ['$gte', OperatorMap<string>['$gte']]
    }

    if (k === 'lt') {
      return ['$lt', v as string] satisfies ['$lt', OperatorMap<string>['$lt']]
    }

    if (k === 'lte') {
      return ['$lte', v as string] satisfies ['$lte', OperatorMap<string>['$lte']]
    }

    if (k === 'in') {
      return ['$in', v as string[]] satisfies ['$in', OperatorMap<string>['$in']]
    }

    if (k === 'notIn') {
      return ['$nin', v as string[]] satisfies ['$nin', OperatorMap<string>['$nin']]
    }

    if (k === 'like') {
      return ['$like', v as string] satisfies ['$like', OperatorMap<string>['$like']]
    }

    if (k === 'notLike') {
      return ['$not', { $like: v as string }]
    }

    if (k === 'iLike') {
      return ['$ilike', v as string] satisfies ['$ilike', OperatorMap<string>['$ilike']]
    }

    if (k === 'notILike') {
      return ['$not', { $ilike: v as string }]
    }

    return [k, this.expandFilter(v as FilterComparisons<unknown>)]
  }

  async findRelation<Relation extends object>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: DTO | DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<DTO, Relation | undefined> | Relation | undefined> {
    if (!Array.isArray(entities)) {
      const dto = entities
      const entity = this.assembler ? await Promise.resolve(this.assembler.convertToEntity(dto)) : (dto as unknown as Entity)
      const relation = await this.findRelationForEntity<Relation>(entity, relationName, opts)
      return relation
    }

    const entries = await Promise.all(
      entities.map(async (dto) => {
        const entity = this.assembler ? await Promise.resolve(this.assembler.convertToEntity(dto)) : (dto as unknown as Entity)
        const relation = await this.findRelationForEntity<Relation>(entity, relationName, opts)
        return [dto, relation] as const
      })
    )

    return new Map(entries)
  }

  private async findRelationForEntity<Relation extends object>(
    entity: Entity,
    relationName: string,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined> {
    if (opts?.withDeleted) {
      throw new Error('MikroOrmQueryService does not support withDeleted on findRelation')
    }

    const relation = await this.loadRelationForEntity<Relation>(entity, relationName)
    if (!relation) return undefined

    if (opts?.filter && Object.keys(opts.filter).length > 0) {
      return this.matchesFilter(relation, opts.filter)
    }

    return relation
  }

  private async loadRelationForEntity<Relation extends object>(
    entity: Entity,
    relationName: string
  ): Promise<Relation | undefined> {
    const relationRef = (entity as Record<typeof relationName, Reference<Relation> | Relation | undefined>)[relationName]
    if (!relationRef) {
      const em = this.repo.getEntityManager()
      await em.populate(entity, [relationName as never])
      const loadedRef = (entity as Record<typeof relationName, Reference<Relation> | Relation | undefined>)[relationName]
      if (!loadedRef) return undefined
      if ('load' in loadedRef) {
        return (await loadedRef.load()) ?? undefined
      }
      return loadedRef
    }
    if ('load' in relationRef) {
      const relation = (await relationRef.load()) ?? undefined
      return relation
    }
    const wrapped = wrap(relationRef)
    if (!wrapped.isInitialized()) {
      const em = this.repo.getEntityManager()
      await em.refresh(relationRef)
    }
    return relationRef
  }

  private async matchesFilter<Relation extends object>(
    relation: Relation,
    filter: Filter<Relation>
  ): Promise<Relation | undefined> {
    const em = this.repo.getEntityManager()
    const where = this.convertFilter(filter as unknown as Filter<Entity>) as unknown as FilterQuery<Relation>
    const wrapped = wrap(relation, true)
    const pk = wrapped.getPrimaryKey()

    const found = await em.findOne(
      relation.constructor as Class<Relation>,
      {
        ...where,
        [wrapped.__meta.primaryKeys[0]]: pk
      } as FilterQuery<Relation>
    )

    return (found as Relation) ?? undefined
  }

  async countRelations<RelationDTO>(
    RelationClass: Class<RelationDTO>,
    relationName: string,
    dto: DTO,
    filter: Filter<RelationDTO>,
    opts?: QueryRelationsOptions
  ): Promise<number>
  async countRelations<RelationDTO>(
    RelationClass: Class<RelationDTO>,
    relationName: string,
    dto: DTO[],
    filter: Filter<RelationDTO>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, number>>
  async countRelations<RelationDTO extends object>(
    RelationClass: Class<RelationDTO>,
    relationName: string,
    entities: DTO[] | DTO,
    filter: Filter<RelationDTO>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, number> | number> {
    if (opts?.withDeleted) {
      throw new Error('MikroOrmQueryService does not support withDeleted on countRelations')
    }
    if (!Array.isArray(entities)) {
      const dto = entities
      const entity = this.assembler ? await Promise.resolve(this.assembler.convertToEntity(dto)) : (dto as unknown as Entity)
      const count = await this.countRelationsForEntity<RelationDTO>(entity, relationName, filter)
      return count
    }

    const entries = await Promise.all(
      entities.map(async (dto) => {
        const entity = this.assembler ? await Promise.resolve(this.assembler.convertToEntity(dto)) : (dto as unknown as Entity)
        const count = await this.countRelationsForEntity<RelationDTO>(entity, relationName, filter)
        return [dto, count] as const
      })
    )

    return new Map(entries)
  }

  private async countRelationsForEntity<RelationDTO extends object, RelationEntity extends object = RelationDTO>(
    entity: Entity,
    relationName: string,
    filter: Filter<RelationEntity>
  ): Promise<number> {
    const where = this.convertFilter(filter as unknown as Filter<Entity>) as unknown as FilterQuery<RelationEntity>

    const collection = (entity as Record<typeof relationName, Collection<RelationEntity>>)[relationName]

    const count = await collection.loadCount({ where })
    return count
  }

  async queryRelations<RelationDTO>(
    RelationClass: Class<RelationDTO>,
    relationName: string,
    entities: DTO,
    query: Query<RelationDTO>,
    opts?: QueryRelationsOptions
  ): Promise<RelationDTO[]>
  async queryRelations<RelationDTO>(
    RelationClass: Class<RelationDTO>,
    relationName: string,
    entities: DTO[],
    query: Query<RelationDTO>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, RelationDTO[]>>
  async queryRelations<RelationDTO extends object>(
    RelationClass: Class<RelationDTO>,
    relationName: string,
    entities: DTO[] | DTO,
    query: Query<RelationDTO>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, RelationDTO[]> | RelationDTO[]> {
    if (opts?.withDeleted) {
      throw new Error('MikroOrmQueryService does not support withDeleted on queryRelations')
    }
    if (!Array.isArray(entities)) {
      const dto = entities
      const entity = this.assembler ? await Promise.resolve(this.assembler.convertToEntity(dto)) : (dto as unknown as Entity)
      const relations = await this.queryRelationsForEntity<RelationDTO>(RelationClass, entity, relationName, query)
      return relations
    }

    const entries = await Promise.all(
      entities.map(async (dto) => {
        const entity = this.assembler ? await Promise.resolve(this.assembler.convertToEntity(dto)) : (dto as unknown as Entity)
        const relations = await this.queryRelationsForEntity<RelationDTO>(RelationClass, entity, relationName, query)
        return [dto, relations] as const
      })
    )

    return new Map(entries)
  }

  private async queryRelationsForEntity<RelationDTO extends object, RelationEntity extends object = RelationDTO>(
    relationDtoClass: Class<RelationDTO>,
    entity: Entity,
    relationName: string,
    query: Query<RelationEntity>
  ): Promise<RelationDTO[]> {
    const { offset, limit } = query.paging ?? {}
    const where = this.convertFilter(query.filter as unknown as Filter<Entity>) as unknown as FilterQuery<RelationEntity>
    const orderBy = this.convertSorting(query.sorting as unknown as SortField<unknown>[] | undefined) as unknown as Array<
      QueryOrderMap<RelationEntity>
    >

    const collection = (entity as Record<typeof relationName, Collection<RelationEntity>>)[relationName]
    const relationEntities =
      !offset && !limit
        ? await collection.loadItems({ orderBy, where })
        : await collection.matching({
            orderBy,
            where,
            offset,
            limit
          })

    if (relationEntities.length === 0) {
      return []
    }
    const [relationEntity] = relationEntities
    const entityClass = (Object.getPrototypeOf(relationEntity) as { constructor: Class<RelationEntity> }).constructor

    if ((relationDtoClass as unknown) === (entityClass as unknown)) {
      return relationEntities as unknown as RelationDTO[]
    }

    const assembler = AssemblerFactory.getAssembler<RelationDTO, RelationEntity>(relationDtoClass, entityClass)
    const relationDtos = await assembler.convertToDTOs(relationEntities)

    return relationDtos
  }

  convertSorting<T = Entity>(sorting: Array<SortField<unknown>> | undefined): Array<QueryOrderMap<T>> {
    return (sorting ?? []).map((s): QueryOrderMap<T> => {
      const direction: QueryOrder = this.convertSortDirection(s)
      return {
        [s.field as EntityKey<T>]: direction
      } as unknown as Record<EntityKey<T>, boolean>
    })
  }

  private convertSortDirection(s: SortField<unknown>): QueryOrder {
    switch (s.direction) {
      case SortDirection.ASC:
        return s.nulls === SortNulls.NULLS_FIRST
          ? QueryOrder.ASC_NULLS_FIRST
          : s.nulls === SortNulls.NULLS_LAST
            ? QueryOrder.ASC_NULLS_LAST
            : QueryOrder.ASC

      case SortDirection.DESC:
        return s.nulls === SortNulls.NULLS_FIRST
          ? QueryOrder.DESC_NULLS_FIRST
          : s.nulls === SortNulls.NULLS_LAST
            ? QueryOrder.DESC_NULLS_LAST
            : QueryOrder.DESC
    }
  }
}
