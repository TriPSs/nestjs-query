import { ApiOperationOptions } from '@nestjs/swagger'
import { QueryService } from '@ptc-org/nestjs-query-core'

import { DTONamesOpts } from '../common'
import { QueryOptionsDecoratorOpts, QueryResolverMethodOpts } from '../decorators'
import { PagingStrategies, QueryArgsTypeOpts } from '../types'

export type NamedEndpoint = {
  /** Specify to override the name of the graphql query or mutation * */
  path?: string
  /** Specify a description for the graphql query or mutation* */
  description?: string
  operationOptions?: ApiOperationOptions
}

export interface ResolverOpts extends QueryResolverMethodOpts, DTONamesOpts {
  /**
   * Options for single record graphql endpoints
   */
  one?: QueryResolverMethodOpts & NamedEndpoint
  /**
   * Options for multiple record graphql endpoints
   */
  many?: QueryResolverMethodOpts & NamedEndpoint
}

export type MutationOpts = Omit<ResolverOpts, 'many'>

/** @internal */
export interface ServiceResolver<DTO, QS extends QueryService<DTO, unknown, unknown>> {
  service: QS
}

/** @internal */
export interface ResolverClass<DTO, QS extends QueryService<DTO, unknown, unknown>, Resolver extends ServiceResolver<DTO, QS>> {
  new (service: QS): Resolver
}

/**
 * @internal
 * Base Resolver that takes in a service as a constructor argument.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class BaseServiceResolver<DTO, QS> {
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
