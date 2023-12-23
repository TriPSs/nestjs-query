import { Field } from '@ptc-org/nestjs-query-rest'
import { IsBoolean, IsString, MaxLength } from 'class-validator'

export class TodoItemInputDTO {
  @IsString()
  @MaxLength(20)
  @Field()
  title!: string

  @IsBoolean()
  @Field()
  completed!: boolean
}
