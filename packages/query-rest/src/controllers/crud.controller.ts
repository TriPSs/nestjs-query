import { Class, DeepPartial, QueryService } from '@ptc-org/nestjs-query-core'

import { mergeBaseResolverOpts } from '../common'
import { ConnectionOptions } from '../connection/interfaces'
import { BaseResolverOptions } from '../decorators'
import { PagingStrategies } from '../types/query'
import { ControllerClass, MergePagingStrategyOpts } from './controller.interface'
import { CreateController, CreateResolverOpts } from './create.controller'
import { Deletable, DeleteController, DeleteResolverOpts } from './delete.controller'
import { Exportable, ExportController, ExportControllerOpts } from './export.controller'
import { Readable, ReadControllerFromOpts, ReadControllerOpts } from './read.controller'
import { Updateable, UpdateController, UpdateControllerOpts } from './update.controller'

export interface CRUDControllerOpts<
  DTO,
  C = DeepPartial<DTO>,
  U = DeepPartial<DTO>,
  R = ReadControllerOpts<DTO>,
  PS extends PagingStrategies = PagingStrategies.NONE,
  E = DeepPartial<DTO>
>
  extends BaseResolverOptions, Pick<ConnectionOptions, 'enableTotalCount'> {
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
  delete?: DeleteResolverOpts
  export?: ExportControllerOpts<DTO, E>

  basePath?: string
  tags?: string[]
}

export interface CRUDController<
  DTO,
  C,
  U,
  R extends ReadControllerOpts<DTO>,
  QS extends QueryService<DTO, C, U> = QueryService<DTO, C, U>
>
  extends
    CreateController<DTO, C, QS>,
    ReadControllerFromOpts<DTO, R, QS>,
    UpdateController<DTO, U, QS>,
    DeleteController<DTO, QS>,
    ExportController<DTO, QS> {}

// DeleteResolver<DTO, QS>,
// AggregateResolver<DTO, QS> {

// function extractAggregateResolverOpts<DTO>(
//   opts: CRUDResolverOpts<DTO, unknown, unknown, ReadResolverOpts<DTO>, PagingStrategies>
// ): AggregateResolverOpts<DTO> {
//   const { AggregateDTOClass, enableAggregate, aggregate } = opts
//   return mergeBaseResolverOpts<AggregateResolverOpts<DTO>>({ enabled: enableAggregate, AggregateDTOClass, ...aggregate }, opts)
// }

function extractCreateResolverOpts<DTO, C>(
  opts: CRUDControllerOpts<DTO, C, unknown, ReadControllerOpts<DTO>, PagingStrategies, unknown>
): CreateResolverOpts<DTO, C> {
  const { CreateDTOClass, create } = opts
  return mergeBaseResolverOpts<CreateResolverOpts<DTO, C>>({ CreateDTOClass, ...create }, opts)
}

function extractReadResolverOpts<DTO, R extends ReadControllerOpts<DTO>, PS extends PagingStrategies>(
  opts: CRUDControllerOpts<DTO, unknown, unknown, R, PagingStrategies, unknown>
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
  opts: CRUDControllerOpts<DTO, unknown, U, ReadControllerOpts<DTO>, PagingStrategies, unknown>
): UpdateControllerOpts<DTO, U> {
  const { UpdateDTOClass, update } = opts
  return mergeBaseResolverOpts<UpdateControllerOpts<DTO, U>>({ UpdateDTOClass, ...update }, opts)
}

function extractDeleteResolverOpts<DTO>(
  opts: CRUDControllerOpts<DTO, unknown, unknown, ReadControllerOpts<DTO>, PagingStrategies, unknown>
): DeleteResolverOpts {
  const { delete: deleteArgs = {} } = opts
  return mergeBaseResolverOpts<DeleteResolverOpts>(deleteArgs, opts)
}

function extractExportResolverOpts<DTO, E>(
  opts: CRUDControllerOpts<DTO, unknown, unknown, ReadControllerOpts<DTO>, PagingStrategies, E>
): ExportControllerOpts<DTO, E> {
  const { export: exportArgs = {} } = opts
  return mergeBaseResolverOpts<ExportControllerOpts<DTO, E>>(exportArgs, opts)
}

/**
 * Factory to create a controller that includes create, read, update, delete, and export endpoints.
 *
 * ```ts
 * import { Controller } from '@nestjs/common'
 * import { CRUDController } from '@ptc-org/nestjs-query-rest'
 *
 * @Controller('todo-items')
 * export class TodoItemController extends CRUDController(TodoItemDTO) {
 *   constructor(readonly service: TodoItemService) {
 *     super(service)
 *   }
 * }
 * ```
 * @param DTOClass - The DTO class that the controller is for. All endpoints use types derived from this class.
 * @param opts - Options to customize the controller endpoints.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const CRUDController = <
  DTO,
  C = DeepPartial<DTO>,
  U = DeepPartial<DTO>,
  R extends ReadControllerOpts<DTO> = ReadControllerOpts<DTO>,
  PS extends PagingStrategies = PagingStrategies.NONE,
  E = DeepPartial<DTO>
>(
  DTOClass: Class<DTO>,
  opts: CRUDControllerOpts<DTO, C, U, R, PS, E> = {}
): ControllerClass<DTO, QueryService<DTO, C, U>, CRUDController<DTO, C, U, MergePagingStrategyOpts<DTO, R, PS>>> => {
  const readable = Readable(DTOClass, extractReadResolverOpts(opts))
  const updatable = Updateable(DTOClass, extractUpdateResolverOpts(opts))
  const deletable = Deletable(DTOClass, extractDeleteResolverOpts(opts))
  const exportable = Exportable(DTOClass, extractExportResolverOpts(opts))

  return exportable(readable(deletable(updatable(CreateController(DTOClass, extractCreateResolverOpts(opts))))))
}
