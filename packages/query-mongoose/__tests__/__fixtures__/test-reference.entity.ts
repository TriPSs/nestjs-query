import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, SchemaTypes, Types } from 'mongoose'

@Schema()
export class TestReference extends Document<string> {
  @Prop({ required: true })
  referenceName!: string

  @Prop({ type: SchemaTypes.ObjectId, ref: 'TestEntity' })
  testEntity?: Types.ObjectId | string
}

export const TestReferenceSchema = SchemaFactory.createForClass(TestReference)
TestReferenceSchema.virtual('virtualTestEntity', {
  ref: 'TestEntity',
  localField: 'testEntity',
  foreignField: '_id',
  justOne: true
})
