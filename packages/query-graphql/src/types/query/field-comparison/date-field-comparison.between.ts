import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { IsDate } from 'class-validator';

@InputType()
export class DateFieldComparisonBetween {
	@Field(() => GraphQLISODateTime, { nullable: false })
	@IsDate()
	lower!: Date;

	@Field(() => GraphQLISODateTime, { nullable: false })
	@IsDate()
	upper!: Date;
}