import { Field, InputType } from '@nestjs/graphql'

@InputType()
export class CreateTagInput {
  @Field()
  name!: string

  @Field({ nullable: true })
  color?: string
}

@InputType()
export class UpdateTagInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  color?: string
}
