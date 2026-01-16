import { Directive, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@souagrosolucoes/nestjs-query-graphql'

@ObjectType('User')
@Directive('@key(fields: "id")')
export class UserDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  name!: string

  @FilterableField()
  email!: string

  @FilterableField()
  created!: Date

  @FilterableField()
  updated!: Date
}
