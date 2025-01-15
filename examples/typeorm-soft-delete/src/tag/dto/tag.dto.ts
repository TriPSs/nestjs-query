import { Field, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'

@ObjectType('Tag')
export class TagDTO {
  @FilterableField(() => ID)
  id!: number

  @Field()
  name!: string
}
