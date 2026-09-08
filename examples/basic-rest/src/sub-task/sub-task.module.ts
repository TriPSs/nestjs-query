import { Module } from '@nestjs/common'
import { NestjsQueryRestModule } from '@ptc-org/nestjs-query-rest'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { SubTaskDTO } from './dto/sub-task.dto'
import { CreateSubTaskDTO } from './dto/subtask-input.dto'
import { SubTaskUpdateDTO } from './dto/subtask-update.dto'
import { SubTaskEntity } from './sub-task.entity'

@Module({
  imports: [
    NestjsQueryRestModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([SubTaskEntity])],
      endpoints: [
        {
          DTOClass: SubTaskDTO,
          EntityClass: SubTaskEntity,
          CreateDTOClass: CreateSubTaskDTO,
          UpdateDTOClass: SubTaskUpdateDTO
        }
      ]
    })
  ]
})
export class SubTaskModule {}
