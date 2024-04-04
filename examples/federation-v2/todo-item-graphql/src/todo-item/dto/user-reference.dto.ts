import { Directive, Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType('User')
@Directive('@key(fields: "id")')
export class UserReferenceDTO {
  @Field(() => ID)
  id!: number
}
