import { ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@souagrosolucoes/nestjs-query-graphql'

import { TodoItemDTO } from './todo-item.dto'

@ObjectType('TodoTask')
export class TodoTaskDTO extends TodoItemDTO {
  @FilterableField()
  priority!: number
}
