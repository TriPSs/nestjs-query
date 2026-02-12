import { Paging } from '@ptc-org/nestjs-query-core'

import { Field } from '../../decorators'
import { IsInt } from 'class-validator'

export class OffsetPaging implements Paging {
  @Field({
    type: Number,
    description: 'The maximum number of results to return.',
    nullable: true,
    default: 25,
    minimum: 1,
    maximum: 50
  })
  @IsInt()
  limit?: number

  @Field({
    type: Number,
    description: 'The offset to start returning results from.',
    nullable: true,
    required: false,
    minimum: 0
  })
  @IsInt()
  offset?: number
}
