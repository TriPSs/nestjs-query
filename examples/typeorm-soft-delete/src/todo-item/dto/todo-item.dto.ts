import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, FilterableUnPagedRelation } from '@ptc-org/nestjs-query-graphql'

import { SubTaskDTO } from '../../sub-task/dto/sub-task.dto'
import { SubTaskEntity } from '../../sub-task/sub-task.entity'

@ObjectType('TodoItem')
@FilterableUnPagedRelation('subTasks', () => SubTaskDTO, { disableRemove: true })
export class TodoItemDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField()
  completed!: boolean

  @FilterableField()
  subTasksCount!: number

  @FilterableField(() => GraphQLISODateTime)
  created!: Date

  @FilterableField(() => GraphQLISODateTime)
  updated!: Date

  subTasks!: SubTaskEntity[]
}
