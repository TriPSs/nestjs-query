import { ApolloFederationDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { typeormOrmConfig } from '../../../helpers'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_user')),
    GraphQLModule.forRoot({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: { version: 2, importUrl: 'https://specs.apollo.dev/federation/v2.7' } }
    }),
    UserModule
  ]
})
export class AppModule {}
