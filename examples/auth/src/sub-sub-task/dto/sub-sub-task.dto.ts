import { Field, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, QueryOptions } from '@ptc-org/nestjs-query-graphql'

@ObjectType('SubSubTask')
@QueryOptions({ enableTotalCount: true })
export class SubSubTaskDTO {
  @FilterableField(() => ID)
  id!: number

  @Field()
  title!: string

  @FilterableField()
  public!: boolean
}
