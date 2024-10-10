import { Param } from '@nestjs/common'
import { Class, Filter, mergeQuery, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { ConnectionOptions, InferConnectionTypeFromStrategy } from '../connection/interfaces'
import { AuthorizerFilter, Get, QueryHookArgs } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { QueryArgsType } from '../types'
import { FindOneArgsType } from '../types/find-one-args.type'
import { OffsetQueryArgsTypeOpts, PagingStrategies, QueryArgsTypeOpts, QueryType, StaticQueryType } from '../types/query'
import { BaseServiceResolver, ExtractPagingStrategy, ResolverClass, ResolverOpts, ServiceResolver } from './resolver.interface'

export type ReadResolverFromOpts<
  DTO,
  Opts extends ReadResolverOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown>
> = ReadResolver<DTO, ExtractPagingStrategy<DTO, Opts>, QS>

export type ReadResolverOpts<DTO> = {
  QueryArgs?: StaticQueryType<DTO, PagingStrategies>

  /**
   * DTO to return with finding one record
   */
  FindDTOClass?: Class<DTO>
} & ResolverOpts &
  QueryArgsTypeOpts<DTO> &
  Pick<ConnectionOptions, 'enableTotalCount'>

export interface ReadResolver<DTO, PS extends PagingStrategies, QS extends QueryService<DTO, unknown, unknown>>
  extends ServiceResolver<DTO, QS> {
  queryMany(
    query: QueryType<DTO, PagingStrategies>,
    authorizeFilter?: Filter<DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, PS>>

  findById(id: FindOneArgsType, authorizeFilter?: Filter<DTO>): Promise<DTO | undefined>
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
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)
    const {
      QueryArgs = QueryArgsType(DTOClass, { ...opts, connectionName: `${dtoNames.baseName}Connection` }),
      FindDTOClass = DTOClass
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'FindDTOClass', 'Connection', 'withDeleted')

    class QA extends QueryArgs {}

    class FOP extends FindOneArgsType(DTOClass) {}

    Object.defineProperty(QA, 'name', {
      writable: false,
      // set a unique name otherwise DI does not inject a unique one for each request
      value: `Query${DTOClass.name}Args`
    })

    Object.defineProperty(FOP, 'name', {
      writable: false,
      // set a unique name otherwise DI does not inject a unique one for each request
      value: `Find${DTOClass.name}Args`
    })

    class ReadResolverBase extends BaseClass {
      @Get(
        () => FindDTOClass,
        {
          path: opts?.one?.path ?? ':id',
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.findById`,
            tags: [...(opts.tags || []), ...(opts.one?.tags ?? [])],
            description: opts?.one?.description,
            ...opts?.one?.operationOptions
          }
        },
        { interceptors: [HookInterceptor(HookTypes.BEFORE_FIND_ONE, DTOClass), AuthorizerInterceptor(DTOClass)] },
        commonResolverOpts,
        opts.one ?? {}
      )
      public async findById(
        @Param() params: FOP,
        @AuthorizerFilter({
          operationGroup: OperationGroup.READ,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        return this.service.getById(params.id, {
          filter: authorizeFilter,
          withDeleted: opts?.one?.withDeleted
        })
      }

      @Get(
        () => QueryArgs.ConnectionType,
        {
          path: opts?.many?.path,
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.queryMany`,
            tags: [...(opts.tags || []), ...(opts.many?.tags ?? [])],
            description: opts?.many?.description,
            ...opts?.many?.operationOptions
          }
        },
        { interceptors: [HookInterceptor(HookTypes.BEFORE_QUERY_MANY, DTOClass), AuthorizerInterceptor(DTOClass)] },
        commonResolverOpts,
        opts.many ?? {}
      )
      public async queryMany(
        @QueryHookArgs() query: QA,
        @AuthorizerFilter({
          operationGroup: OperationGroup.READ,
          many: true
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<InstanceType<typeof QueryArgs.ConnectionType>> {
        return QueryArgs.ConnectionType.createFromPromise(
          (q) =>
            this.service.query(q, {
              withDeleted: opts?.many?.withDeleted
            }),
          mergeQuery(query, { filter: authorizeFilter }),
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
  ReadOpts extends ReadResolverOpts<DTO> = OffsetQueryArgsTypeOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  opts: ReadOpts = {} as ReadOpts
): ResolverClass<DTO, QS, ReadResolverFromOpts<DTO, ReadOpts, QS>> => Readable(DTOClass, opts)(BaseServiceResolver)
