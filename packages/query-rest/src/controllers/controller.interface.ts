import { ApiOperationOptions } from '@nestjs/swagger'
import { QueryService } from '@ptc-org/nestjs-query-core'

import { DTONamesOpts } from '../common'
import { QueryMethodOpts, QueryOptionsDecoratorOpts } from '../decorators'
import { PagingStrategies, QueryArgsTypeOpts } from '../types/query'

export type NamedEndpoint = {
  /** Specify the REST endpoint path. */
  path?: string
  /** Specify a description for the REST endpoint. */
  description?: string
  operationOptions?: ApiOperationOptions
}

export interface ControllerOpts extends QueryMethodOpts, DTONamesOpts {
  /**
   * Options for single-record REST endpoints.
   */
  one?: QueryMethodOpts & NamedEndpoint
  /**
   * Options for multiple-record REST endpoints.
   */
  many?: QueryMethodOpts & NamedEndpoint
}

export type MutationOpts = Omit<ControllerOpts, 'many'>

/** @internal */
export interface ServiceController<DTO, QS extends QueryService<DTO, unknown, unknown>> {
  service: QS
}

/** @internal */
export interface ControllerClass<
  DTO,
  QS extends QueryService<DTO, unknown, unknown>,
  Controller extends ServiceController<DTO, QS>
> {
  new (service: QS): Controller
}

/**
 * @internal
 * Base controller that takes in a service as a constructor argument.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class BaseServiceController<DTO, QS> {
  constructor(readonly service: QS) {}
}

export type ExtractPagingStrategy<DTO, Opts extends QueryArgsTypeOpts<DTO>> = Opts['pagingStrategy'] extends PagingStrategies
  ? Opts['pagingStrategy']
  : PagingStrategies.NONE

export type MergePagingStrategyOpts<
  DTO,
  Opts extends QueryOptionsDecoratorOpts<DTO>,
  S extends PagingStrategies = PagingStrategies.NONE
> = Opts['pagingStrategy'] extends PagingStrategies
  ? Opts
  : S extends PagingStrategies
    ? Omit<Opts, 'pagingStrategy'> & {
        pagingStrategy: S
      }
    : Opts
