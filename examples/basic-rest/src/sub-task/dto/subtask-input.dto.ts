import { Field } from '@ptc-org/nestjs-query-rest'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateSubTaskDTO {
  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string

  @Field()
  @IsBoolean()
  completed!: boolean

  @Field()
  @IsNotEmpty()
  todoItemId!: string
}
