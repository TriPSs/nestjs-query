import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

@InputType('JsonTaskUpdate')
export class JsonTaskUpdateDTO {
  @Field()
  @IsNotEmpty()
  @IsString()
  title!: string

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Field({ nullable: true })
  @IsOptional()
  display?: object

  @Field({ nullable: true })
  @IsOptional()
  createdBy?: string

  @Field({ nullable: true })
  @IsOptional()
  updatedBy?: string
}
