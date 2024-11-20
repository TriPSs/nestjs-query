// eslint-disable-next-line max-classes-per-file
import { Args, ArgsType, Resolver } from '@nestjs/graphql';
import {
  AggregateByTimeResponse,
  AggregateQuery,
  AggregateResponse,
  Class,
  Filter,
  mergeFilter,
  QueryService,
} from '@rezonate/nestjs-query-core';
import omit from 'lodash.omit';

import { OperationGroup } from '../auth';
import { getDTONames } from '../common';
import {  AuthorizerFilter, ResolverQuery } from '../decorators';
import { AuthorizerInterceptor } from '../interceptors';
import { transformAndValidate } from './helpers';
import { BaseServiceResolver, ResolverClass, ServiceResolver } from './resolver.interface';
import { AggregateByTimeResponseType } from '../types/aggregate/aggregate-by-time-response.type';
import { AggregateByTimeArgsType } from '../types/aggregate/aggregate-by-time-args.type';
import { AggregateResolverOpts } from './aggregate.resolver';
import { AggregateByTimeQueryParam } from '../decorators/aggregate-by-time-query-param.decorator';

export interface AggregateByTimeResolver<DTO, QS extends QueryService<DTO, unknown, unknown>> extends ServiceResolver<DTO, QS> {
  aggregateByTime(
    filter: AggregateByTimeArgsType<DTO>,
    aggregateQuery: AggregateQuery<DTO>,
    authFilter?: Filter<DTO>
  ): Promise<AggregateResponse<DTO>[]>
}

/**
 * @internal
 * Mixin to add `aggregate` graphql endpoints.
 */
export const AggregateableByTime =
  <DTO, QS extends QueryService<DTO, unknown, unknown>>(DTOClass: Class<DTO>, opts?: AggregateResolverOpts) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<AggregateByTimeResolver<DTO, QS>> & B => {
    if (!opts || !opts.enabled) {
      return BaseClass as never;
    }

    const { baseNameLower } = getDTONames(DTOClass);
    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'QueryArgs', 'Connection');
    const queryName = `${baseNameLower}AggregateByTime`;
    const AR = AggregateByTimeResponseType(DTOClass);

    @ArgsType()
    class AA extends AggregateByTimeArgsType(DTOClass) {}

    @Resolver(() => AR, { isAbstract: true })
    class AggregateByTimeResolverBase extends BaseClass {
      @ResolverQuery(
        () => [AR],
        { name: queryName },
        commonResolverOpts,
        { interceptors: [AuthorizerInterceptor(DTOClass)] },
        opts ?? {},
      )
      async aggregateByTime(
        @Args({ type: () => AA }) args: AA,
        @AggregateByTimeQueryParam() query: AggregateQuery<DTO>,
        @AuthorizerFilter({
          operationGroup: OperationGroup.AGGREGATE,
          many: true,
        })
        authFilter?: Filter<DTO>,
      ): Promise<AggregateByTimeResponse<DTO>> {
        const qa = await transformAndValidate(AA, args);
        const filter = mergeFilter(qa.filter || {}, authFilter ?? {});

        return this.service.aggregateByTime(
          filter,
          query,
          args.field,
          args.from,
          args.to ?? new Date(),
          args.interval.count,
          args.interval.span,
          args.accumulate,
          qa.groupByLimit,
          opts.maxRowsForAggregate,
          opts.maxRowsForAggregateWithIndex,
          opts.limitAggregateByTableSize,
        );
      }
    }

    return AggregateByTimeResolverBase;
  };
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const AggregateByTimeResolver = <
  DTO,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>,
>(
  DTOClass: Class<DTO>,
  opts?: AggregateResolverOpts,
): ResolverClass<DTO, QS, AggregateByTimeResolver<DTO, QS>> => AggregateableByTime(DTOClass, opts)(BaseServiceResolver);
