import { ID, InterfaceType } from '@nestjs/graphql'
import { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql'

@InterfaceType({
  resolveType: (value) => {
    if (value.documentType === 'TodoTaskEntity') {
      return import('./todo-task.dto').then((m) => m.TodoTaskDTO)
    }
    if (value.documentType === 'TodoAppointmentEntity') {
      return import('./todo-appointment.dto').then((m) => m.TodoAppointmentDTO)
    }
    return undefined
  }
})
export abstract class TodoItemDTO {
  @IDField(() => ID)
  id!: string

  @FilterableField()
  title!: string

  @FilterableField()
  completed!: boolean

  @FilterableField()
  documentType!: string
}
