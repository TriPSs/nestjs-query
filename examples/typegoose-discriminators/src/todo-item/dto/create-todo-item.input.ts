import { Field, InputType } from '@nestjs/graphql'

@InputType()
export class CreateTodoItemInput {
  @Field()
  title!: string

  @Field()
  completed!: boolean
}
