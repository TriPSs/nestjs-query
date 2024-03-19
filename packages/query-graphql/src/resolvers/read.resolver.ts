import { ArgsType, Resolver } from '@nestjs/graphql'
import { Class, Filter, mergeQuery, QueryService } from '@rezonate/nestjs-query-core'
import { flatten } from 'flat'
import omit from 'lodash.omit'
import Papa from 'papaparse'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { AuthorizerFilter, getQueryOptions, HookArgs, ResolverQuery } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import {
  ConnectionOptions,
  FilterType,
  FindOneArgsType,
  InferConnectionTypeFromStrategy,
  PagingStrategies,
  QueryArgsType,
  QueryArgsTypeOpts
} from '../types'
import { CursorQueryArgsTypeOpts, QueryType, StaticQueryType } from '../types/query'
import { DEFAULT_QUERY_OPTS } from '../types/query/query-args'
import { BaseServiceResolver, ExtractPagingStrategy, ResolverClass, ResolverOpts, ServiceResolver } from './resolver.interface'

const QUERY_ARGS_TOKEN = Symbol('QUERY_ARGS_TOKEN')

export type ReadResolverFromOpts<
  DTO,
  Opts extends ReadResolverOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown>
> = ReadResolver<DTO, ExtractPagingStrategy<DTO, Opts>, QS>

export type ReadResolverOpts<DTO> = {
  QueryArgs?: StaticQueryType<DTO, PagingStrategies>
} & ResolverOpts &
  QueryArgsTypeOpts<DTO> &
  Pick<ConnectionOptions, 'enableTotalCount'>

export interface ReadResolver<DTO, PS extends PagingStrategies, QS extends QueryService<DTO, unknown, unknown>>
  extends ServiceResolver<DTO, QS> {
  queryMany(
    query: QueryType<DTO, PagingStrategies>,
    authorizeFilter?: Filter<DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, PS>>

  queryManyToCSV(query: QueryType<DTO, PagingStrategies>, authorizeFilter?: Filter<DTO>): Promise<string>

  findById(id: FindOneArgsType, authorizeFilter?: Filter<DTO>): Promise<DTO | undefined>
}

export const getQueryArgs = <DTO>(DTOClass: Class<DTO>) => FilterType(DTOClass)

/**
 * @internal
 * Mixin to add `read` graphql endpoints.
 */
export const Readable =
  <DTO, ReadOpts extends ReadResolverOpts<DTO>, QS extends QueryService<DTO, unknown, unknown>>(
    DTOClass: Class<DTO>,
    opts: ReadOpts
  ) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<ReadResolverFromOpts<DTO, ReadOpts, QS>> & B => {
    const { baseNameLower, pluralBaseNameLower, baseName } = getDTONames(DTOClass, opts)
    const readOneQueryName = opts.one?.name ?? baseNameLower
    const readManyQueryName = opts.many?.name ?? pluralBaseNameLower
    const { QueryArgs = QueryArgsType(DTOClass, { ...opts, connectionName: `${baseName}Connection` }) } = opts
    const { ConnectionType } = QueryArgs

    Reflect.defineMetadata(QUERY_ARGS_TOKEN, QueryArgs, DTOClass)

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'Connection', 'withDeleted')

    @ArgsType()
    class QA extends QueryArgs {}

    @ArgsType()
    class FO extends FindOneArgsType(DTOClass) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class ReadResolverBase extends BaseClass {
      @ResolverQuery(
        () => DTOClass,
        { name: readOneQueryName, description: opts?.one?.description },
        commonResolverOpts,
        { interceptors: [HookInterceptor(HookTypes.BEFORE_FIND_ONE, DTOClass), AuthorizerInterceptor(DTOClass)] },
        opts.one ?? {}
      )
      async findById(
        @HookArgs() input: FO,
        @AuthorizerFilter({
          operationGroup: OperationGroup.READ,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        return this.service.getById(input.id, {
          filter: authorizeFilter,
          withDeleted: opts?.one?.withDeleted
        })
      }

      @ResolverQuery(
        () => QueryArgs.ConnectionType.resolveType,
        { name: readManyQueryName, description: opts?.many?.description },
        commonResolverOpts,
        { interceptors: [HookInterceptor(HookTypes.BEFORE_QUERY_MANY, DTOClass), AuthorizerInterceptor(DTOClass)] },
        opts.many ?? {}
      )
      async queryMany(
        @HookArgs() query: QA,
        @AuthorizerFilter({
          operationGroup: OperationGroup.READ,
          many: true
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<InstanceType<typeof ConnectionType>> {
        return ConnectionType.createFromPromise(
          (q) => this.service.query(q),
          mergeQuery(query, { filter: authorizeFilter }),
          (filter) => this.service.count(filter)
        )
      }

      @ResolverQuery(
        () => String,
        { name: `${readManyQueryName}CSV`, description: opts?.many?.description },
        commonResolverOpts,
        { interceptors: [HookInterceptor(HookTypes.BEFORE_QUERY_MANY, DTOClass), AuthorizerInterceptor(DTOClass)] },
        opts.many ?? {}
      )
      async queryManyToCSV(
        @HookArgs() query: QA,
        @AuthorizerFilter({
          operationGroup: OperationGroup.READ,
          many: true
        })
        authorizeFilter?: Filter<DTO>
      ) {
        const limitValue = getQueryOptions(DTOClass).CSVPageLimit || DEFAULT_QUERY_OPTS.CSVPageLimit
        const res = await this.service.query({ ...query, paging: { ...query.paging, limit: limitValue } })
        return Papa.unparse(res.map((r) => flatten(r)))
      }
    }

    return ReadResolverBase as Class<ReadResolverFromOpts<DTO, ReadOpts, QS>> & B
  }
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const ReadResolver = <
  DTO,
  ReadOpts extends ReadResolverOpts<DTO> = CursorQueryArgsTypeOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  opts: ReadOpts = {} as ReadOpts
): ResolverClass<DTO, QS, ReadResolverFromOpts<DTO, ReadOpts, QS>> => Readable(DTOClass, opts)(BaseServiceResolver)
