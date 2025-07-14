import { prop } from '@typegoose/typegoose'

import { TodoItemEntity } from './todo-item.entity'

export class TodoAppointmentEntity extends TodoItemEntity {
  @prop({ required: true })
  dateTime!: Date

  @prop({ required: true, type: () => [String] })
  participants!: string[]
}
