import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTodoTaskInput {
  @Field()
  title!: string;

  @Field()
  completed!: boolean;

  @Field()
  priority!: number;
}
