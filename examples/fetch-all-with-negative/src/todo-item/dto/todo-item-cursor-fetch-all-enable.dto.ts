import { ObjectType } from '@nestjs/graphql'
import { FilterableField, QueryOptions } from '@souagrosolucoes/nestjs-query-graphql'

@ObjectType('TodoItemCursorFetchWithNegativeEnable')
@QueryOptions({ enableTotalCount: true, enableFetchAllWithNegative: true })
export class TodoItemCursorFetchWithNegativeEnableDTO {
  @FilterableField()
  id!: number

  @FilterableField()
  title!: string

  @FilterableField()
  completed: boolean
}
