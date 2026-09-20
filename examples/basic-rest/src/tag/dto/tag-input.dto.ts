import { Field } from '@ptc-org/nestjs-query-rest'
import { IsNotEmpty, IsString } from 'class-validator'

export class TagInputDTO {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string
}
