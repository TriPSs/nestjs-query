import { ArgsType, Resolver } from '@nestjs/graphql'
import { Class, Filter, mergeQuery, QueryService } from '@souagrosolucoes/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { AuthorizerFilter, GraphQLResolveInfoResult, GraphQLResultInfo, HookArgs, ResolverQuery } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import {
  ConnectionOptions,
  FindOneArgsType,
  InferConnectionTypeFromStrategy,
  PagingStrategies,
  QueryArgsType,
  QueryArgsTypeOpts
} from '../types'
import { CursorQueryArgsTypeOpts, QueryType, StaticQueryType } from '../types/query'
import { BaseServiceResolver, ExtractPagingStrategy, ResolverClass, ResolverOpts, ServiceResolver } from './resolver.interface'

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
    authorizeFilter?: Filter<DTO>,
    resolveInfo?: GraphQLResolveInfoResult<DTO, DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, PS>>

  findById(
    id: FindOneArgsType,
    authorizeFilter?: Filter<DTO>,
    resolveInfo?: GraphQLResolveInfoResult<DTO>
  ): Promise<DTO | undefined>
}

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
    // TODO:: Remove "connectionName" here in next major version
    const { QueryArgs = QueryArgsType(DTOClass, { connectionName: `${baseName}Connection`, ...opts }) } = opts
    const { ConnectionType } = QueryArgs

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'Connection', 'withDeleted')

    @ArgsType()
    class QA extends QueryArgs {}

    @ArgsType()
    class FO extends FindOneArgsType(DTOClass) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class ReadResolverBase extends BaseClass {
      @ResolverQuery(
        () => DTOClass,
        {
          name: readOneQueryName,
          description: opts?.one?.description,
          complexity: opts?.one?.complexity
        },
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
        authorizeFilter?: Filter<DTO>,
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<DTO>
      ): Promise<DTO> {
        return this.service.getById(input.id, {
          filter: authorizeFilter,
          withDeleted: opts?.one?.withDeleted,
          relations: resolveInfo?.relations,
          resolveInfo: resolveInfo?.info
        })
      }

      @ResolverQuery(
        () => QueryArgs.ConnectionType.resolveType,
        { name: readManyQueryName, description: opts?.many?.description, complexity: opts?.many?.complexity },
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
        authorizeFilter?: Filter<DTO>,
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<DTO, DTO>
      ): Promise<InstanceType<typeof ConnectionType>> {
        return ConnectionType.createFromPromise(
          (q) =>
            this.service.query(q, {
              withDeleted: opts?.many?.withDeleted,
              resolveInfo: resolveInfo?.info
            }),
          mergeQuery(query, { filter: authorizeFilter, relations: resolveInfo?.relations }),
          (filter) =>
            this.service.count(filter, {
              withDeleted: opts?.many?.withDeleted
            })
        )
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
