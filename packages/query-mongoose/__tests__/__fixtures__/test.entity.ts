import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, SchemaTypes, Types } from 'mongoose'

@Schema()
export class TestEntity extends Document<any> {
  // Mongoose 9's `Document<any>` no longer surfaces the `id` virtual on the type; declare it for tests.
  declare id: string

  @Prop({ required: true })
  stringType!: string

  @Prop({ required: true })
  boolType!: boolean

  @Prop({ required: true })
  numberType!: number

  @Prop({ required: true })
  dateType!: Date

  @Prop({ type: SchemaTypes.ObjectId, ref: 'TestReference' })
  testReference?: Types.ObjectId | string

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'TestReference' }])
  testReferences?: Types.ObjectId[] | string[]
}

export const TestEntitySchema = SchemaFactory.createForClass(TestEntity)
TestEntitySchema.virtual('virtualTestReferences', {
  ref: 'TestReference',
  localField: '_id',
  foreignField: 'testEntity'
})
