import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { AuthGuard } from '../auth.guard'
import { JsonTaskCreateDTO } from './dto/json-create.dto'
import { JsonTaskDto } from './dto/json-task.dto'
import { JsonTaskUpdateDTO } from './dto/json-task-update.dto'
import { JsonTaskEntity } from './json-task.entity'
import { JsonTaskService } from './json-task.service'

const guards = [AuthGuard]

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([JsonTaskEntity])],
      services: [JsonTaskService],
      resolvers: [
        {
          // ServiceClass: JsonTaskService,
          DTOClass: JsonTaskDto,
          EntityClass: JsonTaskEntity,
          ServiceClass: JsonTaskService,
          // CreateDTOClass: JsonTaskCreateDTO,
          // UpdateDTOClass: JsonTaskUpdateDTO,
          enableAggregate: true,
          aggregate: { guards },
          create: { guards },
          update: { guards },
          delete: { guards }
        }
      ]
    })
  ]
  // providers: [JsonTaskService]
})
export class JsonTaskModule {}
