import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, OffsetConnection, QueryOptions } from '@souagrosolucoes/nestjs-query-graphql'

import { SubTaskDTO } from '../../sub-task/dto/sub-task.dto'
import { TagDTO } from '../../tag/dto/tag.dto'

@ObjectType('TodoItem')
@QueryOptions({ enableTotalCount: true })
@OffsetConnection('subTasks', () => SubTaskDTO, {
  update: { enabled: true }
})
@OffsetConnection('tags', () => TagDTO, {
  update: { enabled: true },
  remove: { enabled: true }
})
export class TodoItemDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField()
  completed!: boolean

  @FilterableField(() => GraphQLISODateTime)
  created!: Date

  @FilterableField(() => GraphQLISODateTime)
  updated!: Date
}
