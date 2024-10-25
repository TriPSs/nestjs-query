import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsObject, IsString } from 'class-validator'

@InputType('JsonTaskInput')
export class JsonTaskCreateDTO {
  @Field()
  @IsNotEmpty()
  @IsString()
  title!: string

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Field({ nullable: true })
  @IsObject()
  display?: object

  @Field({ nullable: true })
  @IsString()
  createdBy?: string

  @Field({ nullable: true })
  @IsString()
  updatedBy?: string
}
