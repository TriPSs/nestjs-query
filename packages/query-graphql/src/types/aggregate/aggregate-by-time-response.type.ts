import {  Field, ObjectType } from '@nestjs/graphql';
import {
  AggregateByTimeResponse, AggregateResponse,
  Class,
  MapReflector,
} from '@rezonate/nestjs-query-core';
import { AggregateResponseType } from '@rezonate/nestjs-query-graphql';
import { getGraphqlObjectName } from '../../common';

const reflector = new MapReflector('nestjs-query:aggregate-by-time-response-type');

export type AggregateResponseOpts = { prefix: string };

export function AggregateByTimeResponseType<DTO>(
  DTOClass: Class<DTO>,
  opts?: AggregateResponseOpts,
): Class<AggregateByTimeResponse<DTO>[0]> {
  const objName = getGraphqlObjectName(DTOClass, 'Unable to make AggregationByTimeResponseType.');
  const prefix = opts?.prefix ?? objName;
  const aggName = `${prefix}AggregateByTimeResponse`;
  const AggResponseType = AggregateResponseType(DTOClass, opts);

  return reflector.memoize(DTOClass, aggName, () => {

    @ObjectType(aggName)
    class AggByTimeResponse {
      @Field(() => Date, { nullable: false })
      time: Date;

      @Field(() => [AggResponseType], { nullable: false })
      aggregate: AggregateResponse<DTO>[];
    }

    return AggByTimeResponse;
  });
}
