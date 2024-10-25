import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { JsonTaskCreateDTO } from './dto/json-create.dto'
import { JsonTaskDto } from './dto/json-task.dto'
import { JsonTaskUpdateDTO } from './dto/json-task-update.dto'
import { JsonTaskEntity } from './json-task.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([JsonTaskEntity])],
      resolvers: [
        {
          // ServiceClass: JsonTaskService,
          DTOClass: JsonTaskDto,
          EntityClass: JsonTaskEntity,
          CreateDTOClass: JsonTaskCreateDTO,
          UpdateDTOClass: JsonTaskUpdateDTO
        }
      ]
    })
  ]
  // providers: [JsonTaskService]
})
export class JsonTaskModule {}
