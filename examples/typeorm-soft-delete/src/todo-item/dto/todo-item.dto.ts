import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, FilterableUnPagedRelation, UnPagedRelation } from '@ptc-org/nestjs-query-graphql'

import { SubTaskDTO } from '../../sub-task/dto/sub-task.dto'
import { SubTaskEntity } from '../../sub-task/sub-task.entity'
import { TodoToTagDTO } from '../../todo-to-tag/dto/todo-to-tag.dto'
import { TodoToTagEntity } from '../../todo-to-tag/todo-to-tag.entity'

@ObjectType('TodoItem')
@FilterableUnPagedRelation('subTasks', () => SubTaskDTO, {
  update: { enabled: true },
  withDeleted: true
})
@UnPagedRelation('toTags', () => TodoToTagDTO)
export class TodoItemDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField()
  completed!: boolean

  toTags!: TodoToTagEntity[]

  @FilterableField()
  subTasksCount!: number

  @FilterableField(() => GraphQLISODateTime)
  created!: Date

  @FilterableField(() => GraphQLISODateTime)
  updated!: Date

  subTasks!: SubTaskEntity[]
}
