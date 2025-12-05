import { Directive, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'

@ObjectType('Tag')
@Directive('@key(fields: "id")')
export class TagDTO {
  // UUID as string ID - tests string ID type in Federation
  @FilterableField(() => ID)
  id!: string

  @FilterableField()
  name!: string

  @FilterableField({ nullable: true })
  color?: string

  @FilterableField()
  created!: Date

  @FilterableField()
  updated!: Date
}
