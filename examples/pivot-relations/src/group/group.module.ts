import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { GroupDTO } from './dto/group.dto'
import { GroupEntity } from './group.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([GroupEntity])],
      resolvers: [{ DTOClass: GroupDTO, EntityClass: GroupEntity }]
    })
  ]
})
export class GroupModule {}
