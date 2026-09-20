import { Directive, ObjectType } from '@nestjs/graphql'

import { FilterableField, UnPagedRelation } from '../../../../src'
import { TodoItemDto } from './todo-item.dto'

@UnPagedRelation('items', () => TodoItemDto)
@ObjectType('TodoList')
@Directive('@key(fields: "id")')
export class TodoListDto {
  @FilterableField()
  id: number

  @FilterableField()
  name: string
}
