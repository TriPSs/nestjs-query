import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { MembershipDTO } from '../membership/dto/membership.dto'
import { MembershipEntity } from '../membership/membership.entity'
import { UserDTO } from './dto/user.dto'
import { UserEntity } from './user.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([UserEntity, MembershipEntity])],
      resolvers: [{ DTOClass: UserDTO, EntityClass: UserEntity }],
      // The membership is only ever read and written through the `groups` relation, so it gets a
      // service but no resolver of its own.
      queryServices: [{ DTOClass: MembershipDTO, EntityClass: MembershipEntity }]
    })
  ]
})
export class UserModule {}
