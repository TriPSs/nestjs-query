import { ApolloFederationDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { typeormOrmConfig } from '../../../helpers'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_mercurius_user')),
    GraphQLModule.forRoot({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 },
      subscriptions: { 'graphql-ws': {} }
    }),
    UserModule
  ]
})
export class AppModule {}
