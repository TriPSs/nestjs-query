import { MethodNotAllowedException, NotFoundException } from '@nestjs/common'
import {
  AggregateQuery,
  AggregateResponse,
  AssemblerFactory,
  Class,
  DeepPartial,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FindRelationOptions,
  GetByIdOptions,
  ModifyRelationOptions,
  Query,
  QueryService,
  UpdateManyResponse,
  UpdateOneOptions,
  AggregateOptions,
  CountOptions,
  FindByIdOptions,
  QueryOptions,
  QueryRelationsOptions,
  DeleteManyOptions
} from '@ptc-org/nestjs-query-core'
import {
  EntityManager,
  EntityRepository,
  FilterQuery,
  FindOptions,
  QueryOrder,
  wrap,
  EntityMetadata,
  AnyEntity,
  Collection,
  ref,
  Reference,
  EntityData
} from '@mikro-orm/core'
import lodashOmit from 'lodash.omit'

import { FilterQueryBuilder } from '../query'

export interface MikroOrmQueryServiceOpts<Entity extends object> {
  useSoftDelete?: boolean
  filterQueryBuilder?: FilterQueryBuilder<Entity>
}

export class MikroOrmQueryService<Entity extends object>
  implements QueryService<Entity, DeepPartial<Entity>, DeepPartial<Entity>>
{
  readonly filterQueryBuilder: FilterQueryBuilder<Entity>
  readonly useSoftDelete: boolean

  constructor(
    readonly repo: EntityRepository<Entity>,
    opts?: MikroOrmQueryServiceOpts<Entity>
  ) {
    const metadata = this.repo.getEntityManager().getMetadata().get(this.EntityClass.name) as EntityMetadata<Entity>
    this.filterQueryBuilder = opts?.filterQueryBuilder ?? new FilterQueryBuilder<Entity>(metadata)
    this.useSoftDelete = opts?.useSoftDelete ?? false
  }

  get EntityClass(): Class<Entity> {
    return this.repo.getEntityManager().getMetadata().get(this.repo.getEntityName()).class as Class<Entity>
  }

  get em(): EntityManager {
    return this.repo.getEntityManager()
  }

  private get metadata(): EntityMetadata<Entity> {
    return this.em.getMetadata().get(this.EntityClass.name)
  }

  async query(query: Query<Entity>, opts?: QueryOptions<Entity>): Promise<Entity[]> {
    const { where, options } = this.filterQueryBuilder.buildQuery(query)
    return this.repo.find(where, options)
  }

  async aggregate(
    filter: Filter<Entity>,
    aggregate: AggregateQuery<Entity>,
    opts?: AggregateOptions
  ): Promise<AggregateResponse<Entity>[]> {
    const where = this.filterQueryBuilder.buildFilter(filter)
    const qb = (this.em as unknown as { createQueryBuilder: <T extends object>(entityName: Class<T>) => unknown }).createQueryBuilder(this.EntityClass) as {
      where: (where: unknown) => unknown
      count: (field: string, distinct?: boolean) => unknown
      addSelect: (field: string, alias?: string) => unknown
      groupBy: (field: string) => unknown
      execute: <T>() => Promise<T>
    }

    qb.where(where)

    const aggregateFields: string[] = []
    const response: AggregateResponse<Entity> = {}

    if (aggregate.count) {
      for (const field of aggregate.count) {
        const fieldName = field.field as string
        if (fieldName === '*' || fieldName === 'id') {
          qb.count('*', true)
          aggregateFields.push('count')
        } else {
          qb.count(fieldName, true)
          aggregateFields.push(`count_${fieldName}`)
        }
      }
    }

    if (aggregate.sum) {
      for (const field of aggregate.sum) {
        const fieldName = field.field as string
        qb.addSelect(`SUM(${fieldName})`, `sum_${fieldName}`)
        aggregateFields.push(`sum_${fieldName}`)
      }
    }

    if (aggregate.avg) {
      for (const field of aggregate.avg) {
        const fieldName = field.field as string
        qb.addSelect(`AVG(${fieldName})`, `avg_${fieldName}`)
        aggregateFields.push(`avg_${fieldName}`)
      }
    }

    if (aggregate.min) {
      for (const field of aggregate.min) {
        const fieldName = field.field as string
        qb.addSelect(`MIN(${fieldName})`, `min_${fieldName}`)
        aggregateFields.push(`min_${fieldName}`)
      }
    }

    if (aggregate.max) {
      for (const field of aggregate.max) {
        const fieldName = field.field as string
        qb.addSelect(`MAX(${fieldName})`, `max_${fieldName}`)
        aggregateFields.push(`max_${fieldName}`)
      }
    }

    if (aggregate.groupBy) {
      for (const field of aggregate.groupBy) {
        const fieldName = field.field as string
        qb.addSelect(fieldName)
        qb.groupBy(fieldName)
      }
    }

    const result = await qb.execute<Record<string, unknown>[]>()

    return this.convertAggregateResult(result, aggregate)
  }

  private convertAggregateResult(
    result: Record<string, unknown>[],
    aggregate: AggregateQuery<Entity>
  ): AggregateResponse<Entity>[] {
    return result.map((row) => {
      const response: AggregateResponse<Entity> = {}

      if (aggregate.count) {
        response.count = {}
        for (const field of aggregate.count) {
          const fieldName = field.field as string
          const countKey = fieldName === '*' || fieldName === 'id' ? 'count' : `count_${fieldName}`
          ;(response.count as Record<string, number>)[fieldName] = Number(row[countKey] ?? row['count'] ?? 0)
        }
      }

      if (aggregate.sum) {
        response.sum = {}
        for (const field of aggregate.sum) {
          const fieldName = field.field as string
          ;(response.sum as Record<string, number>)[fieldName] = Number(row[`sum_${fieldName}`] ?? 0)
        }
      }

      if (aggregate.avg) {
        response.avg = {}
        for (const field of aggregate.avg) {
          const fieldName = field.field as string
          ;(response.avg as Record<string, number>)[fieldName] = Number(row[`avg_${fieldName}`] ?? 0)
        }
      }

      if (aggregate.min) {
        response.min = {}
        for (const field of aggregate.min) {
          const fieldName = field.field as string
          ;(response.min as Record<string, unknown>)[fieldName] = row[`min_${fieldName}`]
        }
      }

      if (aggregate.max) {
        response.max = {}
        for (const field of aggregate.max) {
          const fieldName = field.field as string
          ;(response.max as Record<string, unknown>)[fieldName] = row[`max_${fieldName}`]
        }
      }

      if (aggregate.groupBy) {
        response.groupBy = {}
        for (const field of aggregate.groupBy) {
          const fieldName = field.field as string
          ;(response.groupBy as Record<string, unknown>)[fieldName] = row[fieldName]
        }
      }

      return response
    })
  }

  async count(filter: Filter<Entity>, opts?: CountOptions): Promise<number> {
    const where = this.filterQueryBuilder.buildFilter(filter)
    return this.repo.count(where)
  }

  async findById(id: string | number, opts?: FindByIdOptions<Entity>): Promise<Entity | undefined> {
    const primaryKey = this.getPrimaryKeyName()
    const where: FilterQuery<Entity> = { [primaryKey]: id } as FilterQuery<Entity>

    if (opts?.filter) {
      const additionalWhere = this.filterQueryBuilder.buildFilter(opts.filter)
      Object.assign(where, additionalWhere)
    }

    const result = await this.repo.findOne(where)
    return result ?? undefined
  }

  async getById(id: string | number, opts?: GetByIdOptions<Entity>): Promise<Entity> {
    const entity = await this.findById(id, opts)
    if (!entity) {
      throw new NotFoundException(`Unable to find ${this.EntityClass.name} with id: ${id}`)
    }
    return entity
  }

  async createOne(record: DeepPartial<Entity>): Promise<Entity> {
    const entity = this.repo.create(record as Entity)
    await this.em.persistAndFlush(entity)
    return entity
  }

  async createMany(records: DeepPartial<Entity>[]): Promise<Entity[]> {
    const entities = records.map((record) => this.repo.create(record as Entity))
    await this.em.persistAndFlush(entities)
    return entities
  }

  async updateOne(id: number | string, update: DeepPartial<Entity>, opts?: UpdateOneOptions<Entity>): Promise<Entity> {
    const entity = await this.getById(id, opts)
    ;(wrap(entity) as { assign: (data: unknown) => void }).assign(update)
    await this.em.flush()
    return entity
  }

  async updateMany(update: DeepPartial<Entity>, filter: Filter<Entity>): Promise<UpdateManyResponse> {
    const where = this.filterQueryBuilder.buildFilter(filter)
    const entities = await this.repo.find(where)

    for (const entity of entities) {
      ;(wrap(entity) as { assign: (data: unknown) => void }).assign(update)
    }

    await this.em.flush()
    return { updatedCount: entities.length }
  }

  async deleteOne(id: string | number, opts?: DeleteOneOptions<Entity>): Promise<Entity> {
    const entity = await this.getById(id, opts)

    if (this.useSoftDelete || opts?.useSoftDelete) {
      return this.softDeleteEntity(entity)
    }

    await this.em.removeAndFlush(entity)
    return entity
  }

  async deleteMany(filter: Filter<Entity>, opts?: DeleteManyOptions<Entity>): Promise<DeleteManyResponse> {
    const where = this.filterQueryBuilder.buildFilter(filter)
    const entities = await this.repo.find(where)

    if (this.useSoftDelete || opts?.useSoftDelete) {
      for (const entity of entities) {
        await this.softDeleteEntity(entity)
      }
      return { deletedCount: entities.length }
    }

    const count = entities.length
    await this.em.removeAndFlush(entities)
    return { deletedCount: count }
  }

  private async softDeleteEntity(entity: Entity): Promise<Entity> {
    const deletedAtField = this.findDeletedAtField()
    if (!deletedAtField) {
      throw new MethodNotAllowedException(`Entity ${this.EntityClass.name} does not have a deletedAt field for soft delete`)
    }
    ;(entity as Record<string, unknown>)[deletedAtField] = new Date()
    await this.em.flush()
    return entity
  }

  private findDeletedAtField(): string | undefined {
    const props = this.metadata.properties
    for (const [key, prop] of Object.entries(props)) {
      if (key === 'deletedAt' || key === 'deleted_at') {
        return key
      }
    }
    return undefined
  }

  async restoreOne(id: string | number, opts?: { filter?: Filter<Entity> }): Promise<Entity> {
    this.ensureSoftDeleteEnabled()
    const entity = await this.getById(id, { ...opts, withDeleted: true } as GetByIdOptions<Entity>)
    const deletedAtField = this.findDeletedAtField()
    if (deletedAtField) {
      ;(entity as Record<string, unknown>)[deletedAtField] = null
    }
    await this.em.flush()
    return entity
  }

  async restoreMany(filter: Filter<Entity>): Promise<UpdateManyResponse> {
    this.ensureSoftDeleteEnabled()
    const where = this.filterQueryBuilder.buildFilter(filter)
    const entities = await this.repo.find(where)
    const deletedAtField = this.findDeletedAtField()

    if (deletedAtField) {
      for (const entity of entities) {
        ;(entity as Record<string, unknown>)[deletedAtField] = null
      }
    }

    await this.em.flush()
    return { updatedCount: entities.length }
  }

  async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<Entity, Relation[]>>

  async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[]>

  async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[] | Map<Entity, Relation[]>> {
    if (Array.isArray(dto)) {
      return this.batchQueryRelations(RelationClass, relationName, dto, query)
    }

    await this.em.populate(dto, [relationName as never])

    const relationValue = (dto as Record<string, unknown>)[relationName]
    if (!relationValue) {
      return []
    }

    let relations: Relation[]
    if (relationValue instanceof Collection) {
      relations = relationValue.getItems() as Relation[]
    } else if (Array.isArray(relationValue)) {
      relations = relationValue as Relation[]
    } else {
      relations = [relationValue as Relation]
    }

    return this.filterAndSortRelations(relations, query)
  }

  async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<Map<Entity, AggregateResponse<Relation>[]>>

  async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[]>

  async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[] | Map<Entity, AggregateResponse<Relation>[]>> {
    if (Array.isArray(dto)) {
      const results = new Map<Entity, AggregateResponse<Relation>[]>()
      for (const entity of dto) {
        const aggResult = await this.aggregateRelations(RelationClass, relationName, entity, filter, aggregate)
        results.set(entity, aggResult)
      }
      return results
    }

    return []
  }

  async countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<Entity, number>>

  async countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number>

  async countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number | Map<Entity, number>> {
    if (Array.isArray(dto)) {
      const results = new Map<Entity, number>()
      for (const entity of dto) {
        const count = await this.countRelations(RelationClass, relationName, entity, filter, opts)
        results.set(entity, count)
      }
      return results
    }

    await this.em.populate(dto, [relationName as never])
    const relationValue = (dto as Record<string, unknown>)[relationName]

    if (!relationValue) {
      return 0
    }

    if (relationValue instanceof Collection) {
      return relationValue.count()
    }

    if (Array.isArray(relationValue)) {
      return relationValue.length
    }

    return 1
  }

  async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: Entity[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<Entity, Relation | undefined>>

  async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>

  async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    opts?: FindRelationOptions<Relation>
  ): Promise<(Relation | undefined) | Map<Entity, Relation | undefined>> {
    if (Array.isArray(dto)) {
      const results = new Map<Entity, Relation | undefined>()
      for (const entity of dto) {
        const relation = await this.findRelation(RelationClass, relationName, entity, opts)
        results.set(entity, relation)
      }
      return results
    }

    await this.em.populate(dto, [relationName as never])
    const relationValue = (dto as Record<string, unknown>)[relationName]

    if (!relationValue) {
      return undefined
    }

    if (relationValue instanceof Collection) {
      const items = relationValue.getItems()
      return items.length > 0 ? (items[0] as Relation) : undefined
    }

    if (relationValue instanceof Reference) {
      return relationValue.unwrap() as Relation
    }

    return relationValue as Relation
  }

  async addRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    const entity = await this.getById(id, opts)
    await this.em.populate(entity, [relationName as never])

    const collection = (entity as Record<string, unknown>)[relationName]
    if (!(collection instanceof Collection)) {
      throw new Error(`Relation ${relationName} is not a collection`)
    }

    const relationMeta = this.getRelationMetadata(relationName)
    const RelationClass = relationMeta.type as Class<Relation>

    for (const relationId of relationIds) {
      const relationEntity = await this.em.findOne(RelationClass, relationId as FilterQuery<Relation>)
      if (relationEntity) {
        collection.add(relationEntity)
      }
    }

    await this.em.flush()
    return entity
  }

  async setRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    const entity = await this.getById(id, opts)
    await this.em.populate(entity, [relationName as never])

    const collection = (entity as Record<string, unknown>)[relationName]
    if (!(collection instanceof Collection)) {
      throw new Error(`Relation ${relationName} is not a collection`)
    }

    collection.removeAll()

    const relationMeta = this.getRelationMetadata(relationName)
    const RelationClass = relationMeta.type as Class<Relation>

    for (const relationId of relationIds) {
      const relationEntity = await this.em.findOne(RelationClass, relationId as FilterQuery<Relation>)
      if (relationEntity) {
        collection.add(relationEntity)
      }
    }

    await this.em.flush()
    return entity
  }

  async setRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    const entity = await this.getById(id, opts)

    const relationMeta = this.getRelationMetadata(relationName)
    const RelationClass = relationMeta.type as Class<Relation>

    const relationEntity = await this.em.findOne(RelationClass, relationId as FilterQuery<Relation>)
    if (!relationEntity) {
      throw new Error(`Unable to find ${relationName} to set on ${this.EntityClass.name}`)
    }

    ;(entity as Record<string, unknown>)[relationName] = relationEntity
    await this.em.flush()
    return entity
  }

  async removeRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    const entity = await this.getById(id, opts)
    await this.em.populate(entity, [relationName as never])

    const collection = (entity as Record<string, unknown>)[relationName]
    if (!(collection instanceof Collection)) {
      throw new Error(`Relation ${relationName} is not a collection`)
    }

    const relationMeta = this.getRelationMetadata(relationName)
    const RelationClass = relationMeta.type as Class<Relation>

    for (const relationId of relationIds) {
      const relationEntity = await this.em.findOne(RelationClass, relationId as FilterQuery<Relation>)
      if (relationEntity) {
        collection.remove(relationEntity)
      }
    }

    await this.em.flush()
    return entity
  }

  async removeRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    const entity = await this.getById(id, opts)

    const relationMeta = this.getRelationMetadata(relationName)

    if (relationMeta.kind === '1:1' || relationMeta.kind === 'm:1') {
      ;(entity as Record<string, unknown>)[relationName] = null
    } else {
      await this.em.populate(entity, [relationName as never])
      const collection = (entity as Record<string, unknown>)[relationName]
      if (collection instanceof Collection) {
        const RelationClass = relationMeta.type as Class<Relation>
        const relationEntity = await this.em.findOne(RelationClass, relationId as FilterQuery<Relation>)
        if (relationEntity) {
          collection.remove(relationEntity)
        }
      }
    }

    await this.em.flush()
    return entity
  }

  private async batchQueryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    query: Query<Relation>
  ): Promise<Map<Entity, Relation[]>> {
    const results = new Map<Entity, Relation[]>()

    for (const entity of entities) {
      const relations = await this.queryRelations(RelationClass, relationName, entity, query)
      results.set(entity, relations)
    }

    return results
  }

  private filterAndSortRelations<Relation>(relations: Relation[], query: Query<Relation>): Relation[] {
    let result = [...relations]

    if (query.sorting && query.sorting.length > 0) {
      result.sort((a, b) => {
        for (const sort of query.sorting!) {
          const field = sort.field as keyof Relation
          const aVal = a[field]
          const bVal = b[field]

          if (aVal < bVal) return sort.direction === 'ASC' ? -1 : 1
          if (aVal > bVal) return sort.direction === 'ASC' ? 1 : -1
        }
        return 0
      })
    }

    if (query.paging) {
      const { offset = 0, limit } = query.paging
      if (limit !== undefined) {
        result = result.slice(offset, offset + limit)
      } else if (offset > 0) {
        result = result.slice(offset)
      }
    }

    return result
  }

  private getRelationMetadata(relationName: string) {
    const prop = this.metadata.properties[relationName]
    if (!prop) {
      throw new Error(`Unable to find relation ${relationName} on ${this.EntityClass.name}`)
    }
    return prop
  }

  private getPrimaryKeyName(): string {
    const pkProp = this.metadata.primaryKeys[0]
    return pkProp || 'id'
  }

  private ensureSoftDeleteEnabled(): void {
    if (!this.useSoftDelete) {
      throw new MethodNotAllowedException(`Restore not allowed for non soft deleted entity ${this.EntityClass.name}.`)
    }
  }
}
