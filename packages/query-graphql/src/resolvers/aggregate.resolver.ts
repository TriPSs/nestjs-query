import { Args, ArgsType, Resolver } from '@nestjs/graphql'
import { AggregateQuery, AggregateResponse, Class, Filter, mergeFilter, QueryService } from '@souagrosolucoes/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { AggregateQueryParam, AuthorizerFilter, ResolverMethodOpts, ResolverQuery } from '../decorators'
import { AuthorizerInterceptor } from '../interceptors'
import { AggregateArgsType, AggregateResponseType } from '../types'
import { GroupByAggregateMixin } from './aggregate/group-by-aggregate.resolver'
import { transformAndValidate } from './helpers'
import { BaseServiceResolver, NamedEndpoint, ResolverClass, ServiceResolver } from './resolver.interface'

export interface AggregateResolverOpts<DTO> extends ResolverMethodOpts, NamedEndpoint {
  AggregateDTOClass?: Class<DTO>
  enabled?: boolean
}

export interface AggregateResolver<DTO, QS extends QueryService<DTO, unknown, unknown>> extends ServiceResolver<DTO, QS> {
  aggregate(
    filter: AggregateArgsType<DTO>,
    aggregateQuery: AggregateQuery<DTO>,
    authFilter?: Filter<DTO>
  ): Promise<AggregateResponse<DTO>[]>
}

/**
 * @internal
 * Mixin to add `aggregate` graphql endpoints.
 */
export const Aggregateable =
  <DTO, QS extends QueryService<DTO, unknown, unknown>>(DTOClass: Class<DTO>, opts?: AggregateResolverOpts<DTO>) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<AggregateResolver<DTO, QS>> & B => {
    if (!opts || !opts.enabled) {
      return BaseClass as never
    }

    const { baseNameLower } = getDTONames(DTOClass)
    const commonResolverOpts = omit(
      opts,
      'dtoName',
      'one',
      'many',
      'QueryArgs',
      'Connection',
      'name',
      'description',
      'AggregateDTOClass'
    )
    const queryName = opts.name || `${baseNameLower}Aggregate`
    const [AR, GroupByType] = AggregateResponseType(DTOClass)

    @ArgsType()
    class AA extends AggregateArgsType(opts.AggregateDTOClass || DTOClass) {}

    @Resolver(() => AR, { isAbstract: true })
    class AggregateResolverBase extends BaseClass {
      @ResolverQuery(
        () => [AR],
        { name: queryName, description: opts?.description, complexity: opts?.complexity },
        commonResolverOpts,
        { interceptors: [AuthorizerInterceptor(DTOClass)] },
        opts ?? {}
      )
      async aggregate(
        @Args() args: AA,
        @AggregateQueryParam() query: AggregateQuery<DTO>,
        @AuthorizerFilter({
          operationGroup: OperationGroup.AGGREGATE,
          many: true
        })
        authFilter?: Filter<DTO>
      ): Promise<AggregateResponse<DTO>[]> {
        const qa = await transformAndValidate(AA, args)
        return this.service.aggregate(mergeFilter(qa.filter || {}, authFilter ?? {}), query)
      }
    }

    return GroupByAggregateMixin(DTOClass, GroupByType)(AggregateResolverBase)
  }
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const AggregateResolver = <DTO, QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>>(
  DTOClass: Class<DTO>,
  opts?: AggregateResolverOpts<DTO>
): ResolverClass<DTO, QS, AggregateResolver<DTO, QS>> => Aggregateable(DTOClass, opts)(BaseServiceResolver)
