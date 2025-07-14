import { modelOptions, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@modelOptions({
  schemaOptions: {
    discriminatorKey: 'documentType'
  }
})
export class TodoItemEntity {
  id!: string;

  _id!: Types.ObjectId;

  @prop({ required: true })
  documentType!: string;

  @prop({ required: true })
  title!: string;

  @prop({ required: true, default: false })
  completed!: boolean;
}
