import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule, PagingStrategies } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { SubTaskDTO } from './dto/sub-task.dto'
import { CreateSubTaskDTO } from './dto/subtask-input.dto'
import { SubTaskUpdateDTO } from './dto/subtask-update.dto'
import { SubTaskEntity } from './sub-task.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([SubTaskEntity])],
      resolvers: [
        {
          DTOClass: SubTaskDTO,
          EntityClass: SubTaskEntity,
          CreateDTOClass: CreateSubTaskDTO,
          UpdateDTOClass: SubTaskUpdateDTO,
          read: {
            pagingStrategy: PagingStrategies.NONE
          }
        },
        {
          DTOClass: SubTaskDTO,
          EntityClass: SubTaskEntity,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: {
            connectionName: 'SubTaskOffsetConnection',
            pagingStrategy: PagingStrategies.OFFSET,
            one: { disabled: true },
            many: { name: 'subTasksOffset' }
          }
        },
        {
          DTOClass: SubTaskDTO,
          EntityClass: SubTaskEntity,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: {
            connectionName: 'SubTaskCursorConnection',
            one: { disabled: true },
            many: { name: 'subTasksCursor' }
          }
        }
      ]
    })
  ]
})
export class SubTaskModule {}
