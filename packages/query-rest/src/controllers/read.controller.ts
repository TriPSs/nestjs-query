import { Class, Filter, GetByIdOptions, mergeFilter, mergeQuery, omit, QueryService } from '@ptc-org/nestjs-query-core'

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
import { getDTONames, mergeArrays } from '../common'
import { ConnectionOptions, InferConnectionTypeFromStrategy } from '../connection/interfaces'
import { QueryHookArgs } from '../decorators/hook-args.decorator'
import { ParamArgs } from '../decorators/param-args.decorator'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { PagingStrategies, QueryArgsTypeOpts, StaticQueryType } from '../types/query'
import {
  BaseServiceController,
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

  one?: ControllerOpts['one'] & {
    /** DTO used for single-record response serialization and OpenAPI. Defaults to DTOClass. */
    ReturnDTOClass?: Class<unknown>
    /** Default relations to load when finding a single record. */
    relations?: GetByIdOptions<DTO>['relations']
  }
  many?: ControllerOpts['many'] & {
    /** DTO defining collection items, filters, sorting, and query defaults. Defaults to DTOClass. */
    ReturnDTOClass?: Class<unknown>
    /** Default relations to load for collection queries. */
    relations?: GetByIdOptions<DTO>['relations']
  }
} & ControllerOpts &
  QueryArgsTypeOpts<DTO> &
  Pick<ConnectionOptions, 'enableTotalCount'>

export interface ReadController<
  DTO,
  PS extends PagingStrategies,
  QS extends QueryService<DTO, unknown, unknown>
> extends ServiceController<DTO, QS> {
  queryMany(
    query: QueryType<DTO, PagingStrategies>,
    authorizeFilter?: Filter<DTO>
  ): Promise<InferConnectionTypeFromStrategy<DTO, PS>>

  findById(params: ParamArgsType, authorizeFilter?: Filter<DTO>): Promise<DTO | undefined>
}

/**
 * @internal
 * Mixin to add `read` REST endpoints.
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
    const ManyReturnDTOClass = (opts.many?.ReturnDTOClass ?? DTOClass) as Class<DTO>
    const { QueryArgs = QueryArgsType(ManyReturnDTOClass, { ...opts, connectionName: `${dtoNames.baseName}Connection` }) } = opts

    const commonControllerOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'Connection', 'withDeleted')
    const OneReturnDTOClass = opts.one?.ReturnDTOClass ?? DTOClass

    class QA extends QueryArgs {}

    @ApiSchema({ name: `Find${DTOClass.name}Args` })
    class FOP extends ParamArgsType(DTOClass) {}

    @ApiSchema({ name: `Query${DTOClass.name}Args` })
    class QOP extends QueryParamArgsType(DTOClass) {}

    Object.defineProperty(QA, 'name', {
      writable: false,
      // set a unique name otherwise DI does not inject a unique one for each request
      value: `Query${DTOClass.name}Args`
    })

    class ReadControllerBase extends BaseClass {
      @Get(
        () => OneReturnDTOClass,
        {
          path: opts?.one?.path ?? ':id',
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.findById`,
            tags: mergeArrays(opts.tags, opts.one?.tags),
            description: opts?.one?.description,
            ...opts?.one?.operationOptions
          }
        },
        { interceptors: [HookInterceptor(HookTypes.BEFORE_FIND_ONE, DTOClass), AuthorizerInterceptor(DTOClass)] },
        commonControllerOpts,
        omit(opts.one ?? {}, 'ReturnDTOClass', 'relations')
      )
      public async findById(
        @ParamArgs() params: FOP,
        @AuthorizerFilter({
          operationGroup: OperationGroup.READ,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        return this.service.getById(params.getId(), {
          filter: authorizeFilter,
          relations: opts?.one?.relations,
          withDeleted: opts?.one?.withDeleted
        })
      }

      @Get(
        () => QueryArgs.ResponseType ?? QueryArgs.ConnectionType,
        {
          path: opts?.many?.path,
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.queryMany`,
            tags: mergeArrays(opts.tags, opts.many?.tags),
            description: opts?.many?.description,
            ...opts?.many?.operationOptions
          }
        },
        { interceptors: [HookInterceptor(HookTypes.BEFORE_QUERY_MANY, DTOClass), AuthorizerInterceptor(DTOClass)] },
        commonControllerOpts,
        omit(opts.many ?? {}, 'ReturnDTOClass', 'relations')
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
          mergeQuery(
            { ...query, relations: [...(opts.many?.relations ?? []), ...(query.relations ?? [])] },
            { filter: mergeFilter(params.getFilter(), authorizeFilter ?? {}) }
          ),
          (filter) =>
            this.service.count(filter, {
              withDeleted: opts?.many?.withDeleted
            })
        )
      }
    }

    return ReadControllerBase as Class<ReadControllerFromOpts<DTO, ReadOpts, QS>> & B
  }

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const ReadController = <
  DTO,
  ReadOpts extends ReadControllerOpts<DTO> = OffsetQueryArgsTypeOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  opts: ReadOpts = {} as ReadOpts
): ControllerClass<DTO, QS, ReadControllerFromOpts<DTO, ReadOpts, QS>> => Readable(DTOClass, opts)(BaseServiceController)
