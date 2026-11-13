import { Class, DeepPartial } from '../common'
import { mergeQuery } from '../helpers'
import {
  AggregateQuery,
  AggregateResponse,
  Filter,
  FindRelationOptions,
  Query,
  QueryOptions,
  QueryRelationsOptions
} from '../interfaces'
import { NoOpQueryService } from './noop-query.service'
import { ProxyQueryService } from './proxy-query.service'
import { QueryService } from './query.service'

/**
 * `FindRelationOptions.filter` is merged into the query before it is issued, and `lookedAhead` describes a relation
 * the wrapped service does not own, so both are dropped and every other option is forwarded. Naming only the
 * exclusions means an option added to `FindRelationOptions` later is forwarded without anyone remembering to.
 */
function toQueryOptions<Relation>(opts?: FindRelationOptions<Relation>): QueryOptions<Relation> | undefined {
  if (!opts) {
    return undefined
  }

  const { filter, lookedAhead, ...queryOptions } = opts

  return queryOptions
}

export type QueryServiceRelation<DTO, Relation> = {
  service: QueryService<Relation, unknown, unknown>
  query: (dto: DTO) => Query<Relation>
}

export class RelationQueryService<DTO, C = DeepPartial<DTO>, U = DeepPartial<DTO>> extends ProxyQueryService<DTO, C, U> {
  readonly relations: Record<string, QueryServiceRelation<DTO, unknown>>

  constructor(queryService: QueryService<DTO, C, U>, relations: Record<string, QueryServiceRelation<DTO, unknown>>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(relations: Record<string, QueryServiceRelation<DTO, any>>)

  constructor(
    queryService: QueryService<DTO, C, U> | Record<string, QueryServiceRelation<DTO, unknown>>,
    relations?: Record<string, QueryServiceRelation<DTO, unknown>>
  ) {
    if (typeof queryService.query === 'function') {
      super(queryService as QueryService<DTO, C, U>)
      this.relations = relations
    } else {
      super(NoOpQueryService.getInstance())
      this.relations = queryService as Record<string, QueryServiceRelation<DTO, unknown>>
    }
  }

  /**
   * Query for relations for an array of DTOs. This method will return a map with the DTO as the key and the relations as the value.
   * @param RelationClass - The class of the relation.
   * @param relationName - The name of the relation to load.
   * @param dtos - the dtos to find relations for.
   * @param query - A query to use to filter, page, and sort relations.
   */
  async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, Relation[]>>

  /**
   * Query for an array of relations.
   * @param RelationClass - The class to serialize the relations into.
   * @param dto - The dto to query relations for.
   * @param relationName - The name of relation to query for.
   * @param query - A query to filter, page and sort relations.
   */
  async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[]>

  async queryRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    query: Query<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Relation[] | Map<DTO, Relation[]>> {
    const serviceRelation = this.getRelation<Relation>(relationName)
    if (!serviceRelation) {
      return super.queryRelations(RelationClass, relationName, dto as DTO, query, opts)
    }

    const { query: qf, service } = serviceRelation
    if (Array.isArray(dto)) {
      const map = new Map<DTO, Relation[]>()
      await Promise.all(
        dto.map(async (d) => {
          const relations = await service.query(mergeQuery(query, qf(d)), opts)
          map.set(d, relations)
        })
      )
      return map
    }
    return service.query(mergeQuery(query, qf(dto)), opts)
  }

  async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[]>

  async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<Map<DTO, AggregateResponse<Relation>[]>>

  async aggregateRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
    aggregate: AggregateQuery<Relation>
  ): Promise<AggregateResponse<Relation>[] | Map<DTO, AggregateResponse<Relation>[]>> {
    const serviceRelation = this.getRelation<Relation>(relationName)
    if (!serviceRelation) {
      return super.aggregateRelations(RelationClass, relationName, dto as DTO, filter, aggregate)
    }
    const { query: qf, service } = serviceRelation
    if (Array.isArray(dto)) {
      const map = new Map<DTO, AggregateResponse<Relation>[]>()
      await Promise.all(
        dto.map(async (d) => {
          const relations = await service.aggregate(mergeQuery({ filter }, qf(d)).filter ?? {}, aggregate)
          map.set(d, relations)
        })
      )
      return map
    }
    return service.aggregate(mergeQuery({ filter }, qf(dto)).filter ?? {}, aggregate)
  }

  countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dtos: DTO[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<Map<DTO, number>>

  countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number>

  async countRelations<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    filter: Filter<Relation>,
    opts?: QueryRelationsOptions
  ): Promise<number | Map<DTO, number>> {
    const serviceRelation = this.getRelation<Relation>(relationName)
    if (!serviceRelation) {
      return super.countRelations(RelationClass, relationName, dto as DTO, filter, opts)
    }
    const { query: qf, service } = serviceRelation
    if (Array.isArray(dto)) {
      const map = new Map<DTO, number>()
      await Promise.all(
        dto.map(async (d) => {
          const count = await service.count(mergeQuery({ filter }, qf(d)).filter, opts)
          map.set(d, count)
        })
      )
      return map
    }
    return service.count(mergeQuery({ filter }, qf(dto)).filter, opts)
  }

  /**
   * Find a relation for an array of DTOs. This will return a Map where the key is the DTO and the value is to relation or undefined if not found.
   * @param RelationClass - the class of the relation
   * @param relationName - the name of the relation to load.
   * @param dtos - the dtos to find the relation for.
   * @param filter - Additional filter to apply when finding relations
   */
  async findRelation<Relation>(
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
  async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO,
    opts?: FindRelationOptions<Relation>
  ): Promise<Relation | undefined>

  async findRelation<Relation>(
    RelationClass: Class<Relation>,
    relationName: string,
    dto: DTO | DTO[],
    opts?: FindRelationOptions<Relation>
  ): Promise<(Relation | undefined) | Map<DTO, Relation | undefined>> {
    const serviceRelation = this.getRelation<Relation>(relationName)
    if (!serviceRelation) {
      return super.findRelation(RelationClass, relationName, dto as DTO, opts)
    }
    const { query: qf, service } = serviceRelation
    if (Array.isArray(dto)) {
      const map = new Map<DTO, Relation | undefined>()
      await Promise.all(
        dto.map(async (d) => {
          const relation = await service.query(
            mergeQuery(qf(d), { paging: { limit: 1 }, filter: opts?.filter }),
            toQueryOptions(opts)
          )
          map.set(d, relation[0])
        })
      )
      return map
    }
    return (await service.query(mergeQuery(qf(dto), { paging: { limit: 1 }, filter: opts?.filter }), toQueryOptions(opts)))[0]
  }

  getRelation<Relation>(name: string): QueryServiceRelation<DTO, Relation> | undefined {
    const relation = this.relations[name]
    if (relation) {
      return relation as QueryServiceRelation<DTO, Relation>
    }
    return undefined
  }
}
