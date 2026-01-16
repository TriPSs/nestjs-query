import { Directive, ObjectType } from '@nestjs/graphql'

import { FilterableField, Relation } from '../../../../src'
import { TodoListDto } from './todo-list.dto'

@Relation('list', () => TodoListDto)
@ObjectType('TodoItem')
@Directive('@key(fields: "id")')
export class TodoItemDto {
  @FilterableField()
  id: number

  @FilterableField()
  listId: number

  @FilterableField()
  content: string
}
