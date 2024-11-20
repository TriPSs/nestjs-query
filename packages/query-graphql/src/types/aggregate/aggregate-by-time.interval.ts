import { Field, InputType } from '@nestjs/graphql';
import { AggregateByTimeIntervalSpan } from '@rezonate/nestjs-query-core';

@InputType()
export class AggregateByTimeInterval {
	@Field(() => Number, { nullable: true, description: 'number of interval time spans (default 1)' })
	count: number;

	@Field(() => AggregateByTimeIntervalSpan, { nullable: true, description: 'time span for interval (default day)' })
	span: AggregateByTimeIntervalSpan;
}