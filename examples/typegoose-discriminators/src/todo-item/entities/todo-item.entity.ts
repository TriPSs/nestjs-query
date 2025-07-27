import { modelOptions, prop, Ref } from '@typegoose/typegoose'
import { Types } from 'mongoose'

import { SubTaskEntity } from '../../sub-task/sub-task.entity'

@modelOptions({
  schemaOptions: {
    discriminatorKey: 'documentType',
    virtuals: true,
    toJSON: {
      virtuals: true
    }
  }
})
export class TodoItemEntity {
  id!: string

  _id!: Types.ObjectId

  @prop({ required: true })
  documentType!: string

  @prop({ required: true })
  title!: string

  @prop({ required: true, default: false })
  completed!: boolean

  @prop({
    ref: () => SubTaskEntity,
    foreignField: 'todoItem',
    localField: '_id',
    justOne: false
  })
  subTasks!: Ref<SubTaskEntity>[]
}
