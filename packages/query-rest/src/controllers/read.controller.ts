import { Class, Filter, mergeFilter, mergeQuery, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import {
  ApiSchema,
  AuthorizerFilter,
  Get,
  HookTypes,
  OffsetQueryArgsTypeOpts,
  OperationGroup,
  ParamArgsType,
  ParamHookArgs,
  QueryArgsType,
  QueryParamArgsType,
  QueryType
} from '../'
import { getDTONames } from '../common'
import { ConnectionOptions, InferConnectionTypeFromStrategy } from '../connection/interfaces'
import { QueryHookArgs } from '../decorators/hook-args.decorator'
import { ParamArgs } from '../decorators/param-args.decorator'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { PagingStrategies, QueryArgsTypeOpts, StaticQueryType } from '../types/query'
import {
  BaseServiceResolver,
  ControllerClass,
  ControllerOpts,
  ExtractPagingStrategy,
  ServiceController
} from './controller.interface'

export type ReadControllerFromOpts<
  DTO,
  Opts extends ReadControllerOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown>
> = ReadController<DTO, ExtractPagingStrategy<DTO, Opts>, QS>

export type ReadControllerOpts<DTO> = {
  QueryArgs?: StaticQueryType<DTO, PagingStrategies>

  /**
   * DTO to return with finding one record
   */
  FindDTOClass?: Class<DTO>
} & ControllerOpts &
  QueryArgsTypeOpts<DTO> &
  Pick<ConnectionOptions, 'enableTotalCount'>

export interface ReadController<DTO, PS extends PagingStrategies, QS extends QueryService<DTO, unknown, unknown>>
  extends ServiceController<DTO, QS> {
  queryMany(
    query: QueryType<DTO, PagingStrategies>,
    authorizeFilter?: Filter<DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, PS>>

  findById(params: ParamArgsType, authorizeFilter?: Filter<DTO>): Promise<DTO | undefined>
}

/**
 * @internal
 * Mixin to add `read` graphql endpoints.
 */
export const Readable =
  <DTO, ReadOpts extends ReadControllerOpts<DTO>, QS extends QueryService<DTO, unknown, unknown>>(
    DTOClass: Class<DTO>,
    opts: ReadOpts
  ) =>
  <B extends Class<ServiceController<DTO, QS>>>(BaseClass: B): Class<ReadControllerFromOpts<DTO, ReadOpts, QS>> & B => {
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

    @ApiSchema({ name: `Find${DTOClass.name}Args` })
    class FOP extends ParamArgsType(FindDTOClass) {}

    @ApiSchema({ name: `Query${DTOClass.name}Args` })
    class QOP extends QueryParamArgsType(DTOClass) {}

    Object.defineProperty(QA, 'name', {
      writable: false,
      // set a unique name otherwise DI does not inject a unique one for each request
      value: `Query${DTOClass.name}Args`
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
        @ParamArgs() params: FOP,
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
        @ParamHookArgs() params: QOP,
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
          mergeQuery(query, { filter: mergeFilter(params.getFilter(), authorizeFilter) }),
          (filter) =>
            this.service.count(filter, {
              withDeleted: opts?.many?.withDeleted
            })
        )
      }
    }

    return ReadResolverBase as Class<ReadControllerFromOpts<DTO, ReadOpts, QS>> & B
  }

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const ReadController = <
  DTO,
  ReadOpts extends ReadControllerOpts<DTO> = OffsetQueryArgsTypeOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  opts: ReadOpts = {} as ReadOpts
): ControllerClass<DTO, QS, ReadControllerFromOpts<DTO, ReadOpts, QS>> => Readable(DTOClass, opts)(BaseServiceResolver)
