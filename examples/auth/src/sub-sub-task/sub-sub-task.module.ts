import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { SubSubTaskDTO } from './dto/sub-sub-task.dto'
import { SubSubTaskEntity } from './sub-sub-task.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([SubSubTaskEntity])],
      resolvers: [
        {
          DTOClass: SubSubTaskDTO,
          EntityClass: SubSubTaskEntity
        }
      ]
    })
  ]
})
export class SubSubTaskModule {}
