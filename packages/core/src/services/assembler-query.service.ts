import { Assembler } from '../assemblers'
import { Class, DeepPartial } from '../common'
import {
  AggregateOptions,
  AggregateQuery,
  AggregateResponse,
  CountOptions,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  Filterable,
  FindByIdOptions,
  FindRelationOptions,
  GetByIdOptions,
  ModifyRelationOptions,
  Query,
  QueryOptions,
  UpdateManyResponse,
  UpdateOneOptions
} from '../interfaces'
import { QueryService } from './query.service'

export class AssemblerQueryService<DTO, Entity, C = DeepPartial<DTO>, CE = DeepPartial<Entity>, U = C, UE = CE>
  implements QueryService<DTO, C, U>
{
  constructor(readonly assembler: Assembler<DTO, Entity, C, CE, U, UE>, readonly queryService: QueryService<Entity, CE, UE>) {}

  public addRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(
      this.queryService.addRelations(relationName, id, relationIds, this.convertModifyRelationsOptions(opts))
    )
  }

  public createMany(items: C[]): Promise<DTO[]> {
    const { assembler } = this
    const converted = assembler.convertToCreateEntities(items)
    return this.assembler.convertAsyncToDTOs(this.queryService.createMany(converted))
  }

  public createOne(item: C): Promise<DTO> {
    const c = this.assembler.convertToCreateEntity(item)
    return this.assembler.convertAsyncToDTO(this.queryService.createOne(c))
  }

  public async deleteMany(filter: Filter<DTO>): Promise<DeleteManyResponse> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.queryService.deleteMany(this.assembler.convertQuery({ filter }).filter)
  }

  public deleteOne(id: number | string, opts?: DeleteOneOptions<DTO>): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(this.queryService.deleteOne(id, this.convertFilterable(opts)))
  }

  public async findById(id: string | number, opts?: FindByIdOptions<DTO>): Promise<DTO | undefined> {
    const entity = await this.queryService.findById(id, this.convertFilterable(opts))
    if (!entity) {
      return undefined
    }
    return this.assembler.convertToDTO(entity)
  }

  public getById(id: string | number, opts?: GetByIdOptions<DTO>): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(this.queryService.getById(id, this.convertFilterable(opts)))
  }

  public query(query: Query<DTO>, opts?: QueryOptions<DTO>): Promise<DTO[]> {
    return this.assembler.convertAsyncToDTOs(this.queryService.query(this.assembler.convertQuery(query), opts as never))
  }

  public async aggregate(
    filter: Filter<DTO>,
    aggregate: AggregateQuery<DTO>,
    opts?: AggregateOptions
  ): Promise<AggregateResponse<DTO>[]> {
    const aggregateResponse = await this.queryService.aggregate(
      this.assembler.convertQuery({ filter }).filter || {},
      this.assembler.convertAggregateQuery(aggregate),
      opts
    )

    return aggregateResponse.map((agg) => this.assembler.convertAggregateResponse(agg))
  }

  public count(filter: Filter<DTO>, opts?: CountOptions): Promise<number> {
    return this.queryService.count(this.assembler.convertQuery({ filter }).filter || {}, opts)
  }

  /**
   * Query for relations for an array of DTOs. This method will return a map with the DTO as the key and the relations as the value.
   * @param RelationClass - The class of the relation.
   * @param relationName - The name of the relation to load.
   * @param dtos - the dtos to find relations for.
   * @param query - A query to use to filter, page, and sort relations.
   */
  public queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    query: Query<Relation>
  ): Promise<Map<DTO, Relation[]>>

  /**
   * Query for an array of relations.
   * @param RelationClass - The class to serialize the relations into.
   * @param dto - The dto to query relations for.
   * @param relationName - The name of relation to query for.
   * @param query - A query to filter, page and sort relations.
   */
  public queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    query: Query<Relation>
  ): Promise<Relation[]>

  public async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    query: Query<Relation>
  ): Promise<Relation[] | Map<DTO, Relation[]>> {
    if (Array.isArray(dto)) {
      const entities = this.assembler.convertToEntities(dto)
      const relationMap = await this.queryService.queryRelations(RelationClass, relationName, entities, query)

      return entities.reduce((map, e, index) => {
        const entry = relationMap.get(e) ?? []

        map.set(dto[index], entry)

        return map
      }, new Map<DTO, Relation[]>())
    }

    return this.queryService.queryRelations(RelationClass, relationName, this.assembler.convertToEntity(dto), query)
  }

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>
  ): Promise<number>

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO[],
    filter: Filter<Relation>
  ): Promise<Map<DTO, number>>

  public async countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>
  ): Promise<number | Map<DTO, number>> {
    if (Array.isArray(dto)) {
      const entities = this.assembler.convertToEntities(dto)
      const relationMap = await this.queryService.countRelations(RelationClass, relationName, entities, filter)
      return entities.reduce((map, e, index) => {
        const entry = relationMap.get(e) ?? 0
        map.set(dto[index], entry)
        return map
      }, new Map<DTO, number>())
    }
    return this.queryService.countRelations(RelationClass, relationName, this.assembler.convertToEntity(dto), filter)
  }

  /**
   * Find a relation for an array of DTOs. This will return a Map where the key is the DTO and the value is to relation or undefined if not found.
   * @param RelationClass - the class of the relation
   * @param relationName - the name of the relation to load.
   * @param dtos - the dtos to find the relation for.
   * @param filter - Additional filter to apply when finding relations
   */
  public async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<DTO, Relation | undefined>>

  /**
   * Finds a single relation.
   * @param RelationClass - The class to serialize the relation into.
   * @param dto - The dto to find the relation for.
   * @param relationName - The name of the relation to query for.
   * @param filter - Additional filter to apply when finding relations
   */
  public async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>

  public async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<(Relation | undefined) | Map<DTO, Relation | undefined>> {
    if (Array.isArray(dto)) {
      const entities = this.assembler.convertToEntities(dto)
      const relationMap = await this.queryService.findRelation(RelationClass, relationName, entities, opts)
      return entities.reduce((map, e, index) => {
        map.set(dto[index], relationMap.get(e))
        return map
      }, new Map<DTO, Relation | undefined>())
    }
    return this.queryService.findRelation(RelationClass, relationName, this.assembler.convertToEntity(dto))
  }

  public removeRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(
      this.queryService.removeRelation(relationName, id, relationId, this.convertModifyRelationsOptions(opts))
    )
  }

  public removeRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(
      this.queryService.removeRelations(relationName, id, relationIds, this.convertModifyRelationsOptions(opts))
    )
  }

  public setRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(
      this.queryService.setRelations(relationName, id, relationIds, this.convertModifyRelationsOptions(opts))
    )
  }

  public setRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(
      this.queryService.setRelation(relationName, id, relationId, this.convertModifyRelationsOptions(opts))
    )
  }

  public updateMany(update: U, filter: Filter<DTO>): Promise<UpdateManyResponse> {
    return this.queryService.updateMany(
      this.assembler.convertToUpdateEntity(update),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.assembler.convertQuery({ filter }).filter
    )
  }

  public updateOne(id: string | number, update: U, opts?: UpdateOneOptions<DTO>): Promise<DTO> {
    return this.assembler.convertAsyncToDTO(
      this.queryService.updateOne(id, this.assembler.convertToUpdateEntity(update), this.convertFilterable(opts))
    )
  }

  public aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[]>
  public aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<Map<DTO, AggregateResponse<Relation>[]>>
  public async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[] | Map<DTO, AggregateResponse<Relation>[]>> {
    if (Array.isArray(dto)) {
      const entities = this.assembler.convertToEntities(dto)
      const relationMap = await this.queryService.aggregateRelations(RelationClass, relationName, entities, filter, aggregate)
      return entities.reduce((map, e, index) => {
        const entry = relationMap.get(e) ?? []
        map.set(dto[index], entry)
        return map
      }, new Map<DTO, AggregateResponse<Relation>[]>())
    }
    return this.queryService.aggregateRelations(
      RelationClass,
      relationName,
      this.assembler.convertToEntity(dto),
      filter,
      aggregate
    )
  }

  private convertFilterable(filterable?: Filterable<DTO>): Filterable<Entity> | undefined {
    if (!filterable) {
      return undefined
    }

    return { ...filterable, filter: this.assembler.convertQuery({ filter: filterable?.filter }).filter }
  }

  private convertModifyRelationsOptions<Relation>(
    modifyRelationOptions?: ModifyRelationOptions<DTO, Relation>
  ): ModifyRelationOptions<Entity, Relation> | undefined {
    if (!modifyRelationOptions) {
      return undefined
    }
    return {
      filter: this.assembler.convertQuery({ filter: modifyRelationOptions?.filter }).filter,
      relationFilter: modifyRelationOptions.relationFilter
    }
  }
}
