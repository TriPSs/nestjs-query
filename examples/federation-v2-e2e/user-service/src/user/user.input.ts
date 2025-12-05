import { Field, InputType } from '@nestjs/graphql'

@InputType('CreateUser')
export class CreateUserInput {
  @Field()
  name!: string

  @Field()
  email!: string
}

@InputType('UpdateUser')
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  email?: string
}
