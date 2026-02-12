/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotImplementedException } from '@nestjs/common'

import { Class, DeepPartial } from '../common'
import {
  AggregateOptions,
  AggregateQuery,
  AggregateResponse,
  CountOptions,
  DeleteManyOptions,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FindByIdOptions,
  FindRelationOptions,
  GetByIdOptions,
  ModifyRelationOptions,
  Query,
  QueryOptions,
  QueryRelationsOptions,
  UpdateManyResponse,
  UpdateOneOptions
} from '../interfaces'
import { QueryService } from './query.service'

export class NoOpQueryService<DTO, C = DeepPartial<DTO>, U = DeepPartial<DTO>> implements QueryService<DTO, C, U> {
  private static instance: QueryService<unknown, unknown, unknown> = new NoOpQueryService()

  // eslint-disable-next-line @typescript-eslint/no-shadow
  static getInstance<DTO, C, U>(): QueryService<DTO, C, U> {
    return this.instance as QueryService<DTO, C, U>
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  public addRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('addRelations is not implemented'))
  }

  public createMany(items: C[]): Promise<DTO[]> {
    return Promise.reject(new NotImplementedException('createMany is not implemented'))
  }

  public createOne(item: C): Promise<DTO> {
    return Promise.reject(new NotImplementedException('createOne is not implemented'))
  }

  public deleteMany(filter: Filter<DTO>, opts?: DeleteManyOptions<DTO>): Promise<DeleteManyResponse> {
    return Promise.reject(new NotImplementedException('deleteMany is not implemented'))
  }

  public deleteOne(id: number | string, opts?: DeleteOneOptions<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('deleteOne is not implemented'))
  }

  public findById(id: string | number, opts?: FindByIdOptions<DTO>): Promise<DTO | undefined> {
    return Promise.reject(new NotImplementedException('findById is not implemented'))
  }

  public findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>

  public findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<DTO, Relation | undefined>>

  public findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<(Relation | undefined) | Map<DTO, Relation | undefined>> {
    return Promise.reject(new NotImplementedException('findRelation is not implemented'))
  }

  public getById(id: string | number, opts?: GetByIdOptions<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('getById is not implemented'))
  }

  public query(query: Query<DTO>, opts?: QueryOptions<DTO>): Promise<DTO[]> {
    return Promise.reject(new NotImplementedException('query is not implemented'))
  }

  public aggregate(
    filter: Filter<DTO>,
    aggregate: AggregateQuery<DTO>,
    opts?: AggregateOptions
  ): Promise<AggregateResponse<DTO>[]> {
    return Promise.reject(new NotImplementedException('aggregate is not implemented'))
  }

  public count(filter: Filter<DTO>, opts?: CountOptions): Promise<number> {
    return Promise.reject(new NotImplementedException('count is not implemented'))
  }

  public queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[]>

  public queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, Relation[]>>

  public queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[] | Map<DTO, Relation[]>> {
    return Promise.reject(new NotImplementedException('queryRelations is not implemented'))
  }

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number>

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, number>>

  public countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number | Map<DTO, number>> {
    return Promise.reject(new NotImplementedException('countRelations is not implemented'))
  }

  public removeRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('removeRelation is not implemented'))
  }

  public removeRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('removeRelations is not implemented'))
  }

  public setRelations<Relation>(
    relationName: string,
    id: string | number,
    relationId: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('setRelations is not implemented'))
  }

  public setRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('setRelation is not implemented'))
  }

  public updateMany(update: U, filter: Filter<DTO>): Promise<UpdateManyResponse> {
    return Promise.reject(new NotImplementedException('updateMany is not implemented'))
  }

  public updateOne(id: string | number, update: U, opts?: UpdateOneOptions<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('updateOne is not implemented'))
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

  public aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[] | Map<DTO, AggregateResponse<Relation>[]>> {
    return Promise.reject(new NotImplementedException('aggregateRelations is not implemented'))
  }
}
