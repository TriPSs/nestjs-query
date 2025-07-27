import { ObjectType } from '@nestjs/graphql'
import { CursorConnection, FilterableField } from '@ptc-org/nestjs-query-graphql'

import { SubTaskDTO } from '../../sub-task/dto/sub-task.dto'
import { TodoItemDTO } from './todo-item.dto'

@ObjectType('TodoTask', { implements: () => TodoItemDTO })
@CursorConnection('subTasks', () => SubTaskDTO)
export class TodoTaskDTO extends TodoItemDTO {
  @FilterableField()
  priority!: number
}
