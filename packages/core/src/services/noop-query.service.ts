/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotImplementedException } from '@nestjs/common';

import { Class, DeepPartial } from '../common';
import {
  AggregateByTimeResponse,
  AggregateQuery,
  AggregateResponse,
  DeleteManyOptions,
  DeleteManyResponse,
  DeleteOneOptions,
  Filter,
  FindByIdOptions,
  FindRelationOptions,
  GetByIdOptions,
  ModifyRelationOptions,
  Query,
  UpdateManyResponse,
  UpdateOneOptions,
} from '../interfaces';
import { AggregateByTimeIntervalSpan, QueryService } from './query.service';

export class NoOpQueryService<DTO> implements QueryService<DTO> {
  private static instance: QueryService<unknown> = new NoOpQueryService();

  // eslint-disable-next-line @typescript-eslint/no-shadow
  static getInstance<DTO, C, U>(): QueryService<DTO> {
    return this.instance as QueryService<DTO>;
  }

  addRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>,
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('addRelations is not implemented'));
  }

  createMany(items: DeepPartial<DTO>[]): Promise<DTO[]> {
    return Promise.reject(new NotImplementedException('createMany is not implemented'));
  }

  createOne(item: DeepPartial<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('createOne is not implemented'));
  }

  deleteMany(filter: Filter<DTO>, opts?: DeleteManyOptions<DTO>): Promise<DeleteManyResponse> {
    return Promise.reject(new NotImplementedException('deleteMany is not implemented'));
  }

  deleteOne(id: number | string, opts?: DeleteOneOptions<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('deleteOne is not implemented'));
  }

  findById(id: string | number, opts?: FindByIdOptions<DTO>): Promise<DTO | undefined> {
    return Promise.reject(new NotImplementedException('findById is not implemented'));
  }

  findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>;

  findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<Map<DTO, Relation | undefined>>;

  findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    opts?: FindRelationOptions<Relation>,
  ): Promise<(Relation | undefined) | Map<DTO, Relation | undefined>> {
    return Promise.reject(new NotImplementedException('findRelation is not implemented'));
  }

  getById(id: string | number, opts?: GetByIdOptions<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('getById is not implemented'));
  }

  query(query: Query<DTO>): Promise<DTO[]> {
    return Promise.reject(new NotImplementedException('query is not implemented'));
  }

  queryIds(query: Query<DTO>, idField: keyof DTO): Promise<string[]> {
    return Promise.reject(new NotImplementedException('queryIds is not implemented'));
  }

  aggregate(filter: Filter<DTO>, aggregate: AggregateQuery<DTO>,
            groupByLimit?: number,
            maxRowsAggregationLimit?: number,
            maxRowsAggregationWithIndexLimit?: number,
            limitAggregateByTableSize?: boolean): Promise<AggregateResponse<DTO>[]> {
    return Promise.reject(new NotImplementedException('aggregate is not implemented'));
  }

  aggregateByTime(): Promise<AggregateByTimeResponse<DTO>> {
    return Promise.reject(new NotImplementedException('aggregateByTime is not implemented'));
  }

  count(filter: Filter<DTO>): Promise<number> {
    return Promise.reject(new NotImplementedException('count is not implemented'));
  }

  queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    query: Query<Relation>
  ): Promise<Relation[]>;

  queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    query: Query<Relation>
  ): Promise<Map<DTO, Relation[]>>;

  queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    query: Query<Relation>,
  ): Promise<Relation[] | Map<DTO, Relation[]>> {
    return Promise.reject(new NotImplementedException('queryRelations is not implemented'));
  }

  countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>
  ): Promise<number>;

  countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>
  ): Promise<Map<DTO, number>>;

  countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
  ): Promise<number | Map<DTO, number>> {
    return Promise.reject(new NotImplementedException('countRelations is not implemented'));
  }

  removeRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>,
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('removeRelation is not implemented'));
  }

  removeRelations<Relation>(
    relationName: string,
    id: string | number,
    relationIds: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>,
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('removeRelations is not implemented'));
  }

  setRelations<Relation>(
    relationName: string,
    id: string | number,
    relationId: (string | number)[],
    opts?: ModifyRelationOptions<DTO, Relation>,
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('setRelations is not implemented'));
  }

  setRelation<Relation>(
    relationName: string,
    id: string | number,
    relationId: string | number,
    opts?: ModifyRelationOptions<DTO, Relation>,
  ): Promise<DTO> {
    return Promise.reject(new NotImplementedException('setRelation is not implemented'));
  }

  updateMany(update: DeepPartial<DTO>, filter: Filter<DTO>): Promise<UpdateManyResponse> {
    return Promise.reject(new NotImplementedException('updateMany is not implemented'));
  }

  updateOne(id: string | number, update: DeepPartial<DTO>, opts?: UpdateOneOptions<DTO>): Promise<DTO> {
    return Promise.reject(new NotImplementedException('updateOne is not implemented'));
  }

  aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[]>;

  aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>,
	groupByLimit?: number,
	maxRowsAggregationLimit?: number,
	maxRowsAggregationWithIndexLimit?: number,
	limitAggregateByTableSize?: boolean
  ): Promise<Map<DTO, AggregateResponse<Relation>[]>>;

  aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>,
  ): Promise<AggregateResponse<Relation>[] | Map<DTO, AggregateResponse<Relation>[]>> {
    return Promise.reject(new NotImplementedException('aggregateRelations is not implemented'));
  }
}
