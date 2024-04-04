import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, UnPagedRelation } from '@ptc-org/nestjs-query-graphql'

import { TodoItemDTO } from '../../todo-item/dto/todo-item.dto'

@ObjectType('Tag')
@UnPagedRelation('todoItems', () => TodoItemDTO, {
  update: { enabled: true },
  remove: { enabled: true }
})
export class TagDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  name!: string

  @FilterableField(() => GraphQLISODateTime)
  created!: Date

  @FilterableField(() => GraphQLISODateTime)
  updated!: Date

  todoItems!: TodoItemDTO[]
}
