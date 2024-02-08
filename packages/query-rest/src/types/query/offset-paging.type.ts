import { ApiProperty } from '@nestjs/swagger'
import { Paging } from '@ptc-org/nestjs-query-core'
import { Expose, Type } from 'class-transformer'
import { IsNumber, IsOptional, Max, Min } from 'class-validator'

export class OffsetPaging implements Paging {
  @Expose()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  @ApiProperty({
    nullable: true,
    required: false
  })
  limit?: number

  @Expose()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    nullable: true,
    required: false
  })
  offset?: number
}
