import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableCursorConnection, FilterableField, KeySet } from '@souagrosolucoes/nestjs-query-graphql'

import { AuthGuard } from '../../auth/auth.guard'
import { SubTaskDTO } from '../../sub-task/dto/sub-task.dto'
import { TagDTO } from '../../tag/dto/tag.dto'

@ObjectType('TodoItem')
@KeySet(['id'])
@FilterableCursorConnection('subTasks', () => SubTaskDTO, {
  update: { enabled: true },
  guards: [AuthGuard]
})
@FilterableCursorConnection('tags', () => TagDTO, {
  update: { enabled: true },
  remove: { enabled: true },
  guards: [AuthGuard]
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

  @FilterableField()
  priority!: number

  @FilterableField({ nullable: true })
  createdBy?: string

  @FilterableField({ nullable: true })
  updatedBy?: string
}
