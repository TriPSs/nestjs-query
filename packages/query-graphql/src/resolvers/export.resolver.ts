import { Args, ArgsType, Resolver } from '@nestjs/graphql'
import {
  Class,
  DeepPartial,
  EXPORT_TRANSFORM_GROUP,
  Filter,
  mergeQuery,
  QueryService,
  SelectRelation
} from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { AuthorizerFilter, GraphQLResolveInfoResult, GraphQLResultInfo, HookArgs, ResolverQuery } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { ExportArgsType, ExportFieldInput } from '../types'
import { getDTOFieldPaths } from '../types/export/export-args.helpers'
import { OffsetQueryArgsTypeOpts, PagingStrategies, QueryArgsType, QueryType, StaticQueryType } from '../types/query'
import { BaseServiceResolver, ResolverClass, ResolverOpts, ServiceResolver } from './resolver.interface'

export type ExportResolverOpts<DTO, ExportDTO = DeepPartial<DTO>> = {
  enabled?: boolean

  QueryArgs?: StaticQueryType<DTO, PagingStrategies.OFFSET>

  /** Maximum number of records per export. Defaults to 1000; additional records are omitted. */
  limit?: number

  /**
   * DTO used to transform records before CSV field selection.
   * Must be a GraphQL object type; its GraphQL fields define the allowed columns.
   */
  ExportDTOClass?: Class<ExportDTO>
} & ResolverOpts &
  OffsetQueryArgsTypeOpts<DTO>

export interface ExportResolver<DTO, QS extends QueryService<DTO, unknown, unknown>> extends ServiceResolver<DTO, QS> {
  exportMany(
    query: QueryType<DTO, PagingStrategies.OFFSET>,
    args: ExportArgsType,
    authorizeFilter?: Filter<DTO>,
    resolveInfo?: GraphQLResolveInfoResult<DTO, DTO>
  ): Promise<string>
}

const getPathValue = (item: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((value, segment) => {
    if (Array.isArray(value)) {
      return value.map((entry: unknown) => getPathValue(entry, segment))
    }
    if (typeof value !== 'object' || value === null || !(segment in value)) {
      return undefined
    }
    return (value as Record<string, unknown>)[segment]
  }, item)

const createExportRelations = <DTO>(fields: ExportFieldInput[]): SelectRelation<DTO>[] => {
  const relationPaths = fields.map(({ field }) => field.split('.').slice(0, -1)).filter((path) => path.length > 0)

  const createRelations = (paths: string[][]): SelectRelation<unknown>[] => {
    const names = [...new Set(paths.map(([name]) => name))]
    return names.map((name) => {
      const childPaths = paths.filter(([parent]) => parent === name).map(([, ...children]) => children)
      const nestedPaths = childPaths.filter((path) => path.length > 0)
      return {
        name,
        query: nestedPaths.length > 0 ? { relations: createRelations(nestedPaths) } : {}
      }
    })
  }

  return createRelations(relationPaths) as SelectRelation<DTO>[]
}

export const stringifyExportCsv = async <DTO>(items: DTO[], fields: ExportFieldInput[]): Promise<string> => {
  let stringifyCsv: typeof import('csv-stringify/sync').stringify
  try {
    const { stringify } = await import('csv-stringify/sync')
    stringifyCsv = stringify
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code
    if (code && code !== 'MODULE_NOT_FOUND' && code !== 'ERR_MODULE_NOT_FOUND') {
      throw error
    }
    throw new Error('csv-stringify is required for CSV export; install it with `npm install csv-stringify`')
  }

  const rows = items.map((item) => Object.fromEntries<unknown>(fields.map(({ field }) => [field, getPathValue(item, field)])))

  return stringifyCsv(rows, {
    header: true,
    columns: Object.fromEntries(fields.map(({ field, label }) => [field, label || field])),
    delimiter: ',',
    defaultEncoding: 'utf8',
    quoted_string: true,
    cast: {
      date: (value) => value.toISOString(),
      boolean: (value) => value.toString()
    },
    escape_formulas: true
  })
}

/**
 * @internal
 * Mixin to add an `export` GraphQL query.
 */
export const Exportable =
  <DTO, ExportDTO, QS extends QueryService<DTO, unknown, unknown>>(
    DTOClass: Class<DTO>,
    opts: ExportResolverOpts<DTO, ExportDTO>
  ) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<ExportResolver<DTO, QS>> & B => {
    if (!opts.enabled) {
      return BaseClass as never
    }

    const fieldPaths = getDTOFieldPaths<DTO | ExportDTO>(opts.ExportDTOClass ?? DTOClass)

    const { pluralBaseName } = getDTONames(DTOClass, opts)
    const exportManyQueryName = opts.many?.name ?? `export${pluralBaseName}`
    const {
      QueryArgs = QueryArgsType(DTOClass, {
        ...opts,
        pagingStrategy: PagingStrategies.OFFSET,
        defaultResultSize: opts.limit ?? 1000,
        maxResultsSize: opts.limit ?? 1000
      })
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'Connection', 'withDeleted')

    @ArgsType()
    class EQA extends QueryArgs {}

    @ArgsType()
    class EF extends ExportArgsType(DTOClass, opts.ExportDTOClass) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class ExportResolverBase extends BaseClass {
      @ResolverQuery(
        () => String,
        {
          name: exportManyQueryName,
          description: opts.many?.description,
          complexity: opts.many?.complexity
        },
        commonResolverOpts,
        { interceptors: [HookInterceptor(HookTypes.BEFORE_QUERY_MANY, DTOClass), AuthorizerInterceptor(DTOClass)] },
        opts.many ?? {}
      )
      async exportMany(
        @HookArgs() query: EQA,
        @Args() args: EF,
        @AuthorizerFilter({
          operationGroup: OperationGroup.EXPORT,
          many: true
        })
        authorizeFilter?: Filter<DTO>,
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<DTO, DTO>
      ): Promise<string> {
        const fields = args.fields.map(({ field, label }) => ({
          field: fieldPaths.get(field) ?? field,
          label: label || field
        }))

        const items = await this.service.exportMany(
          mergeQuery(query, {
            filter: authorizeFilter,
            relations: createExportRelations<DTO>(fields)
          }),
          {
            withDeleted: opts.many?.withDeleted,
            resolveInfo: resolveInfo?.info
          }
        )

        const exportItems = plainToInstance<DTO | ExportDTO, DTO>(opts.ExportDTOClass ?? DTOClass, items, {
          groups: [EXPORT_TRANSFORM_GROUP]
        })

        return stringifyExportCsv<DTO | ExportDTO>(exportItems, fields)
      }
    }

    return ExportResolverBase as Class<ExportResolver<DTO, QS>> & B
  }

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const ExportResolver = <
  DTO,
  ExportDTO = DeepPartial<DTO>,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  opts: ExportResolverOpts<DTO, ExportDTO> = {}
): ResolverClass<DTO, QS, ExportResolver<DTO, QS>> => Exportable<DTO, ExportDTO, QS>(DTOClass, opts)(BaseServiceResolver)
