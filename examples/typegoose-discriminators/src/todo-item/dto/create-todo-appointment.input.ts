import { InputType, Field, GraphQLISODateTime } from '@nestjs/graphql';

@InputType()
export class CreateTodoAppointmentInput {
  @Field()
  title!: string;

  @Field()
  completed!: boolean;

  @Field(() => GraphQLISODateTime)
  dateTime!: Date;

  @Field(() => [String])
  participants!: string[];
}
