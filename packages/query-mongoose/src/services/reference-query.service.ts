/* eslint-disable no-underscore-dangle */
import {
  AggregateQuery,
  AggregateResponse,
  AssemblerFactory,
  Class,
  Filter,
  FindRelationOptions,
  GetByIdOptions,
  mergeFilter,
  ModifyRelationOptions,
  Query
} from '@ptc-org/nestjs-query-core'
import { Document, Model as MongooseModel, PipelineStage, Types, UpdateQuery } from 'mongoose'

import {
  isEmbeddedSchemaTypeOptions,
  isSchemaTypeWithReferenceOptions,
  isVirtualTypeWithReferenceOptions,
  VirtualReferenceOptions,
  VirtualTypeWithOptions
} from '../mongoose-types.helper'
import { AggregateBuilder, FilterQueryBuilder } from '../query'

export abstract class ReferenceQueryService<Entity extends Document> {
  public abstract readonly Model: MongooseModel<Entity>

  public abstract getById(id: string | number, opts?: GetByIdOptions<Entity>): Promise<Entity>

  public aggregateRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<Map<Entity, AggregateResponse<Relation>[]>>

  public aggregateRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[]>

  public async aggregateRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    filter: Filter<Relation>,
    aggregateQuery: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[] | Map<Entity, AggregateResponse<Relation>[]>> {
    this.checkForReference('AggregateRelations', relationName)
    if (Array.isArray(dto)) {
      return this.batchAggregateRelations(RelationClass, relationName, dto, filter, aggregateQuery)
    }
    const assembler = AssemblerFactory.getAssembler(RelationClass, Document)
    const relationModel = this.getReferenceModel(relationName)
    const referenceQueryBuilder = this.getReferenceQueryBuilder(relationName)
    const refFilter = this.getReferenceFilter(relationName, dto, assembler.convertQuery({ filter }).filter)
    if (!refFilter) {
      return []
    }
    const { filterQuery, aggregate, options } = referenceQueryBuilder.buildAggregateQuery(
      assembler.convertAggregateQuery(aggregateQuery),
      refFilter
    )
    const aggPipeline: PipelineStage[] = [{ $match: filterQuery }, { $group: aggregate }]
    if (options.sort) {
      aggPipeline.push({ $sort: options.sort ?? {} })
    }
    const aggResult = await relationModel.aggregate<Record<string, unknown>>(aggPipeline).exec()
    return AggregateBuilder.convertToAggregateResponse(aggResult)
  }

  public countRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>
  ): Promise<Map<Entity, number>>

  public countRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    filter: Filter<Relation>
  ): Promise<number>

  async countRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    filter: Filter<Relation>
  ): Promise<number | Map<Entity, number>> {
    this.checkForReference('CountRelations', relationName)
    if (Array.isArray(dto)) {
      return this.batchCountRelations(RelationClass, relationName, dto, filter)
    }
    const assembler = AssemblerFactory.getAssembler(RelationClass, Document)
    const relationModel = this.getReferenceModel(relationName)
    const referenceQueryBuilder = this.getReferenceQueryBuilder(relationName)
    const refFilter = this.getReferenceFilter(relationName, dto, assembler.convertQuery({ filter }).filter)
    if (!refFilter) {
      return 0
    }
    return relationModel.countDocuments(referenceQueryBuilder.buildFilterQuery(refFilter)).exec()
  }

  public findRelation<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: Entity[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<Entity, Relation | undefined>>

  public findRelation<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>

  public async findRelation<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    opts?: FindRelationOptions<Relation>
  ): Promise<(Relation | undefined) | Map<Entity, Relation | undefined>> {
    this.checkForReference('FindRelation', relationName)
    if (Array.isArray(dto)) {
      return this.batchFindRelations(RelationClass, relationName, dto, opts)
    }

    const foundEntity = await this.Model.findById(dto._id ?? dto.id)
    if (!foundEntity) {
      return undefined
    }

    const assembler = AssemblerFactory.getAssembler(RelationClass, Document)
    const referenceQueryBuilder = this.getReferenceQueryBuilder(relationName)
    const filterQuery = referenceQueryBuilder.buildFilterQuery(assembler.convertQuery({ filter: opts?.filter }).filter)
    const populated = await foundEntity.populate({ path: relationName, match: filterQuery })
    const populatedRef: unknown = populated.get(relationName)

    return populatedRef ? assembler.convertToDTO(populatedRef as Document) : undefined
  }

  /**
   * Query for an array of relations for multiple dtos.
   * @param RelationClass - The class to serialize the relations into.
   * @param dtos - The entities to query relations for.
   * @param relationName - The name of relation to query for.
   * @param opts - A query to filter, page or sort relations.
   * @param withDeleted - Also query the soft deleted records
   */
  private async batchQueryRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: Entity[],
    opts: Query<Relation>,
    withDeleted?: boolean
  ): Promise<Map<Entity, Relation[]>> {
    const assembler = AssemblerFactory.getAssembler(RelationClass, Document)
    const refFilter = this.getReferenceFilter(relationName, dtos, assembler.convertQuery({ filter: opts?.filter }).filter)

    const results = new Map<Entity, Relation[]>()
    if (!refFilter) {
      return results
    }

    const refFieldMap = this.getReferenceFieldMap(relationName)
    if (!refFieldMap) {
      return results
    }

    const referenceModel = this.getReferenceModel<Relation>(relationName)
    const referenceQueryBuilder = this.getReferenceQueryBuilder(relationName)
    const entityRelations = await referenceModel.find(referenceQueryBuilder.buildFilterQuery(refFilter)).exec()

    for (const dto of dtos) {
      const referenceIds = this.getReferenceIds(refFieldMap.localField, dto)
      const refs = entityRelations.filter((er) => {
        return referenceIds.some((rid) => {
          const oneOrManyIds = er[refFieldMap.foreignField as keyof Relation]
          const ids = (Array.isArray(oneOrManyIds) ? oneOrManyIds : [oneOrManyIds]) as Types.ObjectId[]
          return ids.some((id) => id.equals(rid as Types.ObjectId))
        })
      })
      results.set(dto, await assembler.convertToDTOs(refs))
    }

    return results
  }

  /**
   * Query for an array of relations for multiple dtos.
   * @param RelationClass - The class to serialize the relations into.
   * @param entities - The entities to query relations for.
   * @param relationName - The name of relation to query for.
   * @param filter - Filter.
   * @param query - A query to filter, page or sort relations.
   */
  private async batchAggregateRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>,
    query: AggregateQuery<Relation>
  ): Promise<Map<Entity, AggregateResponse<Relation>[]>> {
    const entityRelations = await Promise.all(
      entities.map((e) => this.aggregateRelations(RelationClass, relationName, e, filter, query))
    )

    return entityRelations.reduce((results, relationAggregate, index) => {
      const e = entities[index]
      results.set(e, relationAggregate)
      return results
    }, new Map<Entity, AggregateResponse<Relation>[]>())
  }

  /**
   * Count the number of relations for multiple dtos.
   * @param RelationClass - The class to serialize the relations into.
   * @param entities - The entities to query relations for.
   * @param relationName - The name of relation to query for.
   * @param filter - The filter to apply to the relation query.
   */
  private async batchCountRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    filter: Filter<Relation>
  ): Promise<Map<Entity, number>> {
    const entityRelations = await Promise.all(entities.map((e) => this.countRelations(RelationClass, relationName, e, filter)))
    return entityRelations.reduce((results, relationCount, index) => {
      const e = entities[index]
      results.set(e, relationCount)
      return results
    }, new Map<Entity, number>())
  }

  /**
   * Query for a relation for multiple dtos.
   * @param RelationClass - The class to serialize the relations into.
   * @param dtos - The dto to query relations for.
   * @param relationName - The name of relation to query for.
   * @param opts - A query to filter, page or sort relations.
   */
  private async batchFindRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: Entity[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<Entity, Relation | undefined>> {
    const batchResults = await this.batchQueryRelations(
      RelationClass,
      relationName,
      dtos,
      {
        paging: { limit: dtos.length },
        filter: opts?.filter
      },
      opts?.withDeleted
    )

    const results = new Map<Entity, Relation>()
    batchResults.forEach((relation, dto) => {
      // get just the first one.
      results.set(dto, relation[0])
    })

    return results
  }

  public queryRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    entities: Entity[],
    query: Query<Relation>
  ): Promise<Map<Entity, Relation[]>>

  public queryRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity,
    query: Query<Relation>
  ): Promise<Relation[]>

  public async queryRelations<Relation extends Document>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: Entity | Entity[],
    query: Query<Relation>
  ): Promise<Relation[] | Map<Entity, Relation[]>> {
    this.checkForReference('QueryRelations', relationName)
    if (Array.isArray(dto)) {
      return this.batchQueryRelations(RelationClass, relationName, dto, query)
    }
    const foundEntity = await this.Model.findById(dto._id ?? dto.id)
    if (!foundEntity) {
      return []
    }
    const assembler = AssemblerFactory.getAssembler(RelationClass, Document)
    const referenceQueryBuilder = this.getReferenceQueryBuilder(relationName)
    const { filterQuery, options } = referenceQueryBuilder.buildQuery(assembler.convertQuery(query))
    const populated = await foundEntity.populate({ path: relationName, match: filterQuery, options })
    return assembler.convertToDTOs(populated.get(relationName) as Document[])
  }

  public async addRelations<Relation extends Document>(
    relationName: string,
    id: string,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    this.checkForReference('AddRelations', relationName, false)
    const entity = await this.getById(id, opts)
    const refCount = await this.getRefCount(relationName, relationIds, opts?.relationFilter)
    if (relationIds.length !== refCount) {
      throw new Error(`Unable to find all ${relationName} to add to ${this.Model.modelName}`)
    }
    await entity.updateOne({ $push: { [relationName]: { $each: relationIds } } } as UpdateQuery<Entity>).exec()
    // reload the document
    return this.getById(id)
  }

  public async setRelations<Relation extends Document>(
    relationName: string,
    id: string,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    this.checkForReference('AddRelations', relationName, false)
    const entity = await this.getById(id, opts)
    const refCount = await this.getRefCount(relationName, relationIds, opts?.relationFilter)
    if (relationIds.length !== refCount) {
      throw new Error(`Unable to find all ${relationName} to set on ${this.Model.modelName}`)
    }
    await entity.updateOne({ [relationName]: relationIds } as UpdateQuery<Entity>).exec()
    // reload the document
    return this.getById(id)
  }

  public async setRelation<Relation extends Document>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    this.checkForReference('SetRelation', relationName, false)
    const entity = await this.getById(id, opts)
    const refCount = await this.getRefCount(relationName, [relationId], opts?.relationFilter)
    if (refCount !== 1) {
      throw new Error(`Unable to find ${relationName} to set on ${this.Model.modelName}`)
    }
    await entity.updateOne({ [relationName]: relationId } as UpdateQuery<Entity>).exec()
    // reload the document
    return this.getById(id)
  }

  public async removeRelation<Relation extends Document>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    this.checkForReference('RemoveRelation', relationName, false)
    const entity = await this.getById(id, opts)
    const refCount = await this.getRefCount(relationName, [relationId], opts?.relationFilter)
    if (refCount !== 1) {
      throw new Error(`Unable to find ${relationName} to remove from ${this.Model.modelName}`)
    }
    await entity
      .updateOne({
        $unset: { [relationName]: relationId }
      } as UpdateQuery<Entity>)
      .exec()
    // reload the document
    return this.getById(id)
  }

  public async removeRelations<Relation extends Document>(
    relationName: string,
    id: string | number,
    relationIds: string[] | number[],
    opts?: ModifyRelationOptions<Entity, Relation>
  ): Promise<Entity> {
    this.checkForReference('RemoveRelations', relationName, false)
    const entity = await this.getById(id, opts)
    const refCount = await this.getRefCount(relationName, relationIds, opts?.relationFilter)
    if (relationIds.length !== refCount) {
      throw new Error(`Unable to find all ${relationName} to remove from ${this.Model.modelName}`)
    }
    if (this.isVirtualPath(relationName)) {
      throw new Error(`RemoveRelations not supported for virtual relation ${relationName}`)
    }
    await entity
      .updateOne({
        $pullAll: { [relationName]: relationIds }
      } as UpdateQuery<Entity>)
      .exec()
    // reload the document
    return this.getById(id)
  }

  private checkForReference(operation: string, refName: string, allowVirtual = true): void {
    if (this.isReferencePath(refName)) {
      return
    }
    if (this.isVirtualPath(refName)) {
      if (allowVirtual) {
        return
      }
      throw new Error(`${operation} not supported for virtual relation ${refName}`)
    }
    throw new Error(`Unable to find reference ${refName} on ${this.Model.modelName}`)
  }

  private isReferencePath(refName: string): boolean {
    return !!this.Model.schema.path(refName)
  }

  private isVirtualPath(refName: string): boolean {
    return !!this.Model.schema.virtualpath(refName)
  }

  private getReferenceQueryBuilder<Ref extends Document>(refName: string): FilterQueryBuilder<Ref> {
    return new FilterQueryBuilder<Ref>(this.getReferenceModel(refName))
  }

  private getReferenceModel<Ref extends Document>(refName: string): MongooseModel<Ref> {
    const { db } = this.Model
    if (this.isReferencePath(refName)) {
      const schemaType = this.Model.schema.path(refName)
      if (isEmbeddedSchemaTypeOptions(schemaType)) {
        return db.model<Ref>(schemaType.$embeddedSchemaType.options.ref)
      }
      if (isSchemaTypeWithReferenceOptions(schemaType)) {
        return db.model<Ref>(schemaType.options.ref)
      }
    } else if (this.isVirtualPath(refName)) {
      const schemaType = this.Model.schema.virtualpath(refName)
      if (isVirtualTypeWithReferenceOptions(schemaType)) {
        return db.model<Ref>(schemaType.options.ref)
      }
    }
    throw new Error(`Unable to lookup reference type for ${refName}`)
  }

  private getReferenceFilter<Relation extends Document>(
    refName: string,
    entity: Entity | Entity[],
    filter?: Filter<Relation>
  ): Filter<Relation> | undefined {
    const refFieldMap = this.getReferenceFieldMap(refName)
    if (!refFieldMap) {
      return undefined
    }
    const referenceIds = this.getReferenceIds(refFieldMap.localField, entity)

    const refFilter = {
      [refFieldMap.foreignField as keyof Relation]: { in: referenceIds }
    } as unknown as Filter<Relation>

    return mergeFilter(filter ?? ({} as Filter<Relation>), refFilter)
  }

  private getReferenceIds(localField: string, entity: Entity | Entity[]) {
    const entities = Array.isArray(entity) ? entity : [entity]
    return entities.flatMap((e) => e[localField as keyof Entity]).filter((id) => !!id)
  }

  private getReferenceFieldMap(refName: string): Omit<VirtualReferenceOptions, 'ref'> | undefined {
    if (this.isReferencePath(refName)) {
      return {
        foreignField: '_id',
        localField: refName
      }
    }
    if (this.isVirtualPath(refName)) {
      const virtualType = this.Model.schema.virtualpath(refName)
      if (!isVirtualTypeWithReferenceOptions(virtualType)) {
        throw new Error(`Unable to lookup reference type for ${refName}`)
      }
      return {
        foreignField: virtualType.options.foreignField,
        localField: virtualType.options.localField
      }
    }
    return undefined
  }

  private getRefCount<Relation extends Document>(
    relationName: string,
    relationIds: (string | number)[],
    filter?: Filter<Relation>
  ): Promise<number> {
    const referenceModel = this.getReferenceModel<Relation>(relationName)
    const referenceQueryBuilder = this.getReferenceQueryBuilder<Relation>(relationName)
    return referenceModel.countDocuments(referenceQueryBuilder.buildIdFilterQuery(relationIds, filter)).exec()
  }
}
