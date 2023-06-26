import { ObjectType } from '@nestjs/graphql'
import { FilterableField, PagingStrategies, QueryOptions } from '@ptc-org/nestjs-query-graphql'

@ObjectType('TodoItemOffsetFetchWithNegativeEnable')
@QueryOptions({ enableTotalCount: true, enableFetchAllWithNegative: true, pagingStrategy: PagingStrategies.OFFSET })
export class TodoItemOffsetFetchWithNegativeEnableDTO {
  @FilterableField()
  id!: number

  @FilterableField()
  title!: string

  @FilterableField()
  completed: boolean
}
