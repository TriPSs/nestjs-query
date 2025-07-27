import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql'
import { CreateTodoItemInput } from './create-todo-item.input'

@InputType()
export class CreateTodoAppointmentInput extends CreateTodoItemInput {
  @Field(() => GraphQLISODateTime)
  dateTime!: Date

  @Field(() => [String])
  participants!: string[]
}