import { Field, InputType } from '@nestjs/graphql'

@InputType('CreateTodoItem')
export class CreateTodoItemInput {
  @Field()
  title!: string

  @Field({ nullable: true })
  description?: string

  @Field({ defaultValue: false })
  completed!: boolean

  @Field({ nullable: true })
  assigneeId?: number
}

@InputType('UpdateTodoItem')
export class UpdateTodoItemInput {
  @Field({ nullable: true })
  title?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  completed?: boolean

  @Field({ nullable: true })
  assigneeId?: number
}
