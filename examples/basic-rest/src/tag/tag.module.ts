import { Module } from '@nestjs/common'
import { NestjsQueryRestModule } from '@ptc-org/nestjs-query-rest'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TagDTO } from './dto/tag.dto'
import { TagInputDTO } from './dto/tag-input.dto'
import { TagEntity } from './tag.entity'

@Module({
  imports: [
    NestjsQueryRestModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TagEntity])],
      endpoints: [
        {
          DTOClass: TagDTO,
          EntityClass: TagEntity,
          CreateDTOClass: TagInputDTO,
          UpdateDTOClass: TagInputDTO
        }
      ]
    })
  ]
})
export class TagModule {}
