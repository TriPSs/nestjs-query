import { GraphQLISODateTime, ObjectType } from '@nestjs/graphql'
import { CursorConnection, FilterableField } from '@ptc-org/nestjs-query-graphql'

import { SubTaskDTO } from '../../sub-task/dto/sub-task.dto'
import { TodoItemDTO } from './todo-item.dto'

@ObjectType('TodoAppointment', { implements: () => TodoItemDTO })
@CursorConnection('subTasks', () => SubTaskDTO)
export class TodoAppointmentDTO extends TodoItemDTO {
  @FilterableField(() => GraphQLISODateTime)
  dateTime!: Date

  @FilterableField(() => [String])
  participants!: string[]
}
