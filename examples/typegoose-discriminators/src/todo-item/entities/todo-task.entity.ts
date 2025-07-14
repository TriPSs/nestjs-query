import { prop } from '@typegoose/typegoose'

import { TodoItemEntity } from './todo-item.entity'

export class TodoTaskEntity extends TodoItemEntity {
  @prop({ required: true, default: 1 })
  priority!: number
}
