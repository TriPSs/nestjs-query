import { Class, DeepPartial } from '../common'
import {
  AggregateOptions,
  AggregateQuery,
  AggregateResponse,
  CountOptions,
  CreateManyOptions,
  CreateOneOptions,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
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

export class ProxyQueryService<DTO, C = DeepPartial<DTO>, U = DeepPartial<DTO>> implements QueryService<DTO, C, U> {
  constructor(readonly proxied: QueryService<DTO, C, U>) {}

  public addRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.proxied.addRelations(relationName, id, relationIds, opts)
  }

  public removeRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.proxied.removeRelation(relationName, id, relationId, opts)
  }

  public removeRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.proxied.removeRelations(relationName, id, relationIds, opts)
  }

  public setRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.proxied.setRelations(relationName, id, relationIds, opts)
  }

  public setRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return this.proxied.setRelation(relationName, id, relationId, opts)
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
      return this.proxied.queryRelations(RelationClass, relationName, dto, query)
    }
    return this.proxied.queryRelations(RelationClass, relationName, dto, query)
  }

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>
  ): Promise<Map<DTO, number>>

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>
  ): Promise<number>

  public async countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>
  ): Promise<number | Map<DTO, number>> {
    if (Array.isArray(dto)) {
      return this.proxied.countRelations(RelationClass, relationName, dto, filter)
    }
    return this.proxied.countRelations(RelationClass, relationName, dto, filter)
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
      return this.proxied.findRelation(RelationClass, relationName, dto, opts)
    }
    return this.proxied.findRelation(RelationClass, relationName, dto, opts)
  }

  public createMany(items: C[], opts?: CreateManyOptions<DTO>): Promise<DTO[]> {
    return this.proxied.createMany(items, opts)
  }

  public createOne(item: C, opts?: CreateOneOptions<DTO>): Promise<DTO> {
    return this.proxied.createOne(item, opts)
  }

  public async deleteMany(filter: Filter<DTO>): Promise<DeleteManyResponse> {
    return this.proxied.deleteMany(filter)
  }

  public deleteOne(id: number | string, opts?: DeleteOneOptions<DTO>): Promise<DTO> {
    return this.proxied.deleteOne(id, opts)
  }

  public async findById(id: string | number, opts?: FindByIdOptions<DTO>): Promise<DTO | undefined> {
    return this.proxied.findById(id, opts)
  }

  public getById(id: string | number, opts?: GetByIdOptions<DTO>): Promise<DTO> {
    return this.proxied.getById(id, opts)
  }

  public query(query: Query<DTO>, opts?: QueryOptions<DTO>): Promise<DTO[]> {
    return this.proxied.query(query, opts)
  }

  public aggregate(filter: Filter<DTO>, query: AggregateQuery<DTO>, opts?: AggregateOptions): Promise<AggregateResponse<DTO>[]> {
    return this.proxied.aggregate(filter, query, opts)
  }

  public count(filter: Filter<DTO>, opts?: CountOptions): Promise<number> {
    return this.proxied.count(filter, opts)
  }

  public updateMany(update: U, filter: Filter<DTO>): Promise<UpdateManyResponse> {
    return this.proxied.updateMany(update, filter)
  }

  public updateOne(id: string | number, update: U, opts?: UpdateOneOptions<DTO>): Promise<DTO> {
    return this.proxied.updateOne(id, update, opts)
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
      return this.proxied.aggregateRelations(RelationClass, relationName, dto, filter, aggregate)
    }
    return this.proxied.aggregateRelations(RelationClass, relationName, dto, filter, aggregate)
  }
}
