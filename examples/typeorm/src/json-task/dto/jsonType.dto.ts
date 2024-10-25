import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsEmpty, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator'

@ObjectType()
class CustomObject {
  @Field()
  @IsString()
  key: string

  @Field()
  @IsString()
  value: string
}

@InputType('JsonType')
export class JsonTypeDTO {
  @Field(() => CustomObject, { nullable: true })
  @IsString()
  @IsOptional()
  contains: CustomObject

  constructor(contains: CustomObject) {
    this.contains = contains
  }
}
