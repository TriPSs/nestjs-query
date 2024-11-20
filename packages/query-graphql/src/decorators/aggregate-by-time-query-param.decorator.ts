import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AggregateFields, AggregateQuery } from '@rezonate/nestjs-query-core';
import { GraphQLResolveInfo } from 'graphql';
import graphqlFields from 'graphql-fields';
import { getAggregatedFields } from './aggregate-query-param.decorator';

const EXCLUDED_FIELDS = ['__typename'];
export const AggregateByTimeQueryParam = createParamDecorator(<DTO>(data: unknown, ctx: ExecutionContext) => {
  const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  const fields = graphqlFields(info as any, {}, { excludedFields: EXCLUDED_FIELDS }) as {
    aggregate: Record<
      keyof AggregateQuery<DTO>,
      Record<keyof DTO, unknown>
    >
  };

  return getAggregatedFields(fields.aggregate);
});
