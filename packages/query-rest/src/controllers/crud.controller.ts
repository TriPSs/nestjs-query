import { Class, DeepPartial, QueryService } from '@ptc-org/nestjs-query-core'

import { mergeBaseResolverOpts } from '../common'
import { ConnectionOptions } from '../connection/interfaces'
import { BaseResolverOptions } from '../decorators'
import { PagingStrategies } from '../types/query'
import { ControllerClass, MergePagingStrategyOpts } from './controller.interface'
import { CreateController, CreateResolverOpts } from './create.controller'
import { Deletable, DeleteResolverOpts } from './delete.controller'
import { Exportable, ExportControllerOpts } from './export.controller'
import { Readable, ReadControllerFromOpts, ReadControllerOpts } from './read.controller'
import { Updateable, UpdateController, UpdateControllerOpts } from './update.controller'

export interface CRUDControllerOpts<
  DTO,
  C = DeepPartial<DTO>,
  U = DeepPartial<DTO>,
  R = ReadControllerOpts<DTO>,
  PS extends PagingStrategies = PagingStrategies.NONE
> extends BaseResolverOptions,
    Pick<ConnectionOptions, 'enableTotalCount'> {
  /**
   * The DTO that should be used as input for create endpoints.
   */
  CreateDTOClass?: Class<C>
  /**
   * The DTO that should be used as input for update endpoints.
   */
  UpdateDTOClass?: Class<U>
  /**
   * The DTO that should be used for filter of the aggregate endpoint.
   */
  // AggregateDTOClass?: Class<DTO>
  pagingStrategy?: PS
  create?: CreateResolverOpts<DTO, C>
  read?: R
  update?: UpdateControllerOpts<DTO, U>
  delete?: DeleteResolverOpts<DTO>
  export?: ExportControllerOpts<DTO>

  basePath?: string
  tags?: string[]
}

export interface CRUDController<
  DTO,
  C,
  U,
  R extends ReadControllerOpts<DTO>,
  QS extends QueryService<DTO, C, U> = QueryService<DTO, C, U>
> extends CreateController<DTO, C, QS>,
    ReadControllerFromOpts<DTO, R, QS>,
    UpdateController<DTO, U, QS> {}

// DeleteResolver<DTO, QS>,
// AggregateResolver<DTO, QS> {

// function extractAggregateResolverOpts<DTO>(
//   opts: CRUDResolverOpts<DTO, unknown, unknown, ReadResolverOpts<DTO>, PagingStrategies>
// ): AggregateResolverOpts<DTO> {
//   const { AggregateDTOClass, enableAggregate, aggregate } = opts
//   return mergeBaseResolverOpts<AggregateResolverOpts<DTO>>({ enabled: enableAggregate, AggregateDTOClass, ...aggregate }, opts)
// }

function extractCreateResolverOpts<DTO, C>(
  opts: CRUDControllerOpts<DTO, C, unknown, ReadControllerOpts<DTO>, PagingStrategies>
): CreateResolverOpts<DTO, C> {
  const { CreateDTOClass, create } = opts
  return mergeBaseResolverOpts<CreateResolverOpts<DTO, C>>({ CreateDTOClass, ...create }, opts)
}

function extractReadResolverOpts<DTO, R extends ReadControllerOpts<DTO>, PS extends PagingStrategies>(
  opts: CRUDControllerOpts<DTO, unknown, unknown, R, PagingStrategies>
): MergePagingStrategyOpts<DTO, R, PS> {
  const { enableTotalCount, pagingStrategy, read } = opts
  return mergeBaseResolverOpts(
    {
      enableTotalCount,
      pagingStrategy,
      ...read
    } as MergePagingStrategyOpts<DTO, R, PS>,
    opts
  )
}

function extractUpdateResolverOpts<DTO, U>(
  opts: CRUDControllerOpts<DTO, unknown, U, ReadControllerOpts<DTO>, PagingStrategies>
): UpdateControllerOpts<DTO, U> {
  const { UpdateDTOClass, update } = opts
  return mergeBaseResolverOpts<UpdateControllerOpts<DTO, U>>({ UpdateDTOClass, ...update }, opts)
}

function extractDeleteResolverOpts<DTO>(
  opts: CRUDControllerOpts<DTO, unknown, unknown, ReadControllerOpts<DTO>, PagingStrategies>
): DeleteResolverOpts<DTO> {
  const { delete: deleteArgs = {} } = opts
  return mergeBaseResolverOpts<DeleteResolverOpts<DTO>>(deleteArgs, opts)
}

function extractExportResolverOpts<DTO>(
  opts: CRUDControllerOpts<DTO, unknown, unknown, ReadControllerOpts<DTO>, PagingStrategies>
): ExportControllerOpts<DTO> {
  const { export: exportArgs = {} } = opts
  return mergeBaseResolverOpts<ExportControllerOpts<DTO>>(exportArgs, opts)
}

/**
 * Factory to create a resolver that includes all CRUD methods from [[CreateResolver]], [[ReadResolver]],
 * [[UpdateResolver]], and [[DeleteResolver]].
 *
 * ```ts
 * import { CRUDResolver } from '@ptc-org/nestjs-query-graphql';
 * import { Resolver } from '@nestjs/graphql';
 * import { TodoItemDTO } from './dto/todo-item.dto';
 * import { TodoItemService } from './todo-item.service';
 *
 * @Resolver()
 * export class TodoItemResolver extends CRUDResolver(TodoItemDTO) {
 *   constructor(readonly service: TodoItemService) {
 *     super(service);
 *   }
 * }
 * ```
 * @param DTOClass - The DTO Class that the resolver is for. All methods will use types derived from this class.
 * @param opts - Options to customize the resolver.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const CRUDController = <
  DTO,
  C = DeepPartial<DTO>,
  U = DeepPartial<DTO>,
  R extends ReadControllerOpts<DTO> = ReadControllerOpts<DTO>,
  PS extends PagingStrategies = PagingStrategies.NONE
>(
  DTOClass: Class<DTO>,
  opts: CRUDControllerOpts<DTO, C, U, R, PS> = {}
): ControllerClass<DTO, QueryService<DTO, C, U>, CRUDController<DTO, C, U, MergePagingStrategyOpts<DTO, R, PS>>> => {
  const readable = Readable(DTOClass, extractReadResolverOpts(opts))
  const updatable = Updateable(DTOClass, extractUpdateResolverOpts(opts))
  const deletable = Deletable(DTOClass, extractDeleteResolverOpts(opts))
  const exportable = Exportable(DTOClass, extractExportResolverOpts(opts))

  return exportable(readable(deletable(updatable(CreateController(DTOClass, extractCreateResolverOpts(opts))))))
}
