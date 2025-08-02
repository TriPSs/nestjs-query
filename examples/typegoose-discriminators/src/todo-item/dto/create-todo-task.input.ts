import { Field, InputType, Int } from '@nestjs/graphql'

import { CreateTodoItemInput } from './create-todo-item.input'

@InputType()
export class CreateTodoTaskInput extends CreateTodoItemInput {
  @Field(() => Int)
  priority!: number
}
