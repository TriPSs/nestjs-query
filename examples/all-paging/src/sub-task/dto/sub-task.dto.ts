import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, QueryOptions, Relation } from '@souagrosolucoes/nestjs-query-graphql'

import { TodoItemDTO } from '../../todo-item/dto/todo-item.dto'

@ObjectType('SubTask')
@QueryOptions({ enableTotalCount: true })
@Relation('todoItem', () => TodoItemDTO, {
  update: { enabled: true }
})
export class SubTaskDTO {
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
  todoItemId!: string
}
