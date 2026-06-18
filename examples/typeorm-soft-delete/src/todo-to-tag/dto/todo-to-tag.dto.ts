import { ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, Relation } from '@ptc-org/nestjs-query-graphql'

import { TagDTO } from '../../tag/dto/tag.dto'
import { TodoItemEntity } from '../../todo-item/todo-item.entity'

@ObjectType('TodoItemToTag')
@Relation('tag', () => TagDTO, { nullable: true })
export class TodoToTagDTO {
  @FilterableField(() => ID)
  todoID: number

  todoItem: TodoItemEntity

  @FilterableField(() => ID)
  tagID: number

  tag!: TagDTO
}
