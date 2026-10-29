import { ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'

@ObjectType('Group')
export class GroupDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  name!: string
}
