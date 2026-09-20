import { Directive, Field, ID, ObjectType } from '@nestjs/graphql'

// External reference to User entity from user-service
@ObjectType('User')
@Directive('@key(fields: "id")')
export class UserReferenceDTO {
  @Field(() => ID)
  id!: number
}
