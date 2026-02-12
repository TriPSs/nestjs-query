import { Header } from '@nestjs/common'
import { ApiProduces } from '@nestjs/swagger'
import { Class, Filter, mergeQuery, QueryService } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'
import { stringify as stringifyCsv } from 'csv-stringify/sync'
import omit from 'lodash.omit'

import { AuthorizerFilter, Get, HookTypes, NonePagingQueryArgsTypeOpts, OperationGroup, QueryType } from '../'
import { getDTONames } from '../common'
import { QueryHookArgs } from '../decorators/hook-args.decorator'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { PagingStrategies, StaticQueryType } from '../types/query'
import { createExportQueryArgs } from '../types/query/query-args/export-paging-query-args.type'
import { BaseServiceResolver, ControllerClass, ControllerOpts, ServiceController } from './controller.interface'

export type ExportControllerFromOpts<DTO, QS extends QueryService<DTO, unknown, unknown>> = ExportController<DTO, QS>

export type ExportControllerOpts<DTO> = {
  QueryArgs?: StaticQueryType<DTO, PagingStrategies>

  limit?: number

  /**
   * DTO to return with finding one record
   */
  ExportDTOClass?: Class<DTO>
} & ControllerOpts &
  NonePagingQueryArgsTypeOpts<DTO>

export interface ExportController<DTO, QS extends QueryService<DTO, unknown, unknown>> extends ServiceController<DTO, QS> {
  exportMany(query: QueryType<DTO, PagingStrategies.NONE>, authorizeFilter?: Filter<DTO>): Promise<string>
}

/**
 * @internal
 * Mixin to add `export` rest endpoint.
 */
export const Exportable =
  <DTO, ReadOpts extends ExportControllerOpts<DTO>, QS extends QueryService<DTO, unknown, unknown>>(
    DTOClass: Class<DTO>,
    opts: ReadOpts
  ) =>
  <B extends Class<ServiceController<DTO, QS>>>(BaseClass: B): Class<ExportControllerFromOpts<DTO, QS>> & B => {
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)
    const {
      QueryArgs = createExportQueryArgs(DTOClass, {
        ...opts,
        connectionName: `${dtoNames.baseName}Connection`
      }),
      ExportDTOClass = DTOClass
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'FindDTOClass', 'Connection', 'withDeleted')

    class EQA extends QueryArgs {}

    Object.defineProperty(EQA, 'name', {
      writable: false,
      // set a unique name otherwise DI does not inject a unique one for each request
      value: `Export${DTOClass.name}Args`
    })

    class ExportResolverBase extends BaseClass {
      // Returns CSV
      @Get(
        () => String,
        {
          path: `${opts?.many?.path ?? ''}/export`,
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.exportMany`,
            tags: [...(opts.tags || []), ...(opts.many?.tags ?? [])],
            description: opts?.many?.description,
            ...opts?.many?.operationOptions
          }
        },
        { interceptors: [HookInterceptor(HookTypes.BEFORE_QUERY_MANY, DTOClass), AuthorizerInterceptor(DTOClass)] },
        commonResolverOpts,
        opts.many ?? {}
      )
      @Header('content-type', 'text/csv')
      @ApiProduces('text/csv')
      public async exportMany(
        @QueryHookArgs() query: EQA,
        @AuthorizerFilter({
          operationGroup: OperationGroup.EXPORT,
          many: true
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<string> {
        // TODO:: Add export many to query service
        const method = 'exportMany' in this.service ? 'exportMany' : 'query'

        const items: DTO[] = await this.service[method](
          mergeQuery(query, {
            filter: authorizeFilter,
            paging: {
              limit: opts?.limit ?? 1000,
              offset: 0
            }
          }),
          {
            withDeleted: opts?.many?.withDeleted
          }
        )

        return stringifyCsv(plainToInstance(ExportDTOClass, items, { excludeExtraneousValues: true }), {
          header: true,
          delimiter: ',',
          defaultEncoding: 'utf8',
          quoted_string: true
        })
      }
    }

    return ExportResolverBase as Class<ExportControllerFromOpts<DTO, QS>> & B
  }

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const ExportController = <
  DTO,
  ReadOpts extends ExportControllerOpts<DTO> = ExportControllerOpts<DTO>,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  opts: ReadOpts = {} as ReadOpts
): ControllerClass<DTO, QS, ExportControllerFromOpts<DTO, QS>> => Exportable(DTOClass, opts)(BaseServiceResolver)
