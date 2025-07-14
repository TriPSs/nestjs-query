import { Field, GraphQLISODateTime, InputType } from '@nestjs/graphql'

@InputType()
export class CreateTodoAppointmentInput {
  @Field()
  title!: string

  @Field()
  completed!: boolean

  @Field(() => GraphQLISODateTime)
  dateTime!: Date

  @Field(() => [String])
  participants!: string[]
}
