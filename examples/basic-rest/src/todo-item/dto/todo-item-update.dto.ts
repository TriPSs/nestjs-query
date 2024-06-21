import { Field } from '@ptc-org/nestjs-query-rest'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

export class TodoItemUpdateDTO {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Field({ nullable: true })
  title?: string

  @IsOptional()
  @IsBoolean()
  @Field({ nullable: true })
  completed?: boolean
}
