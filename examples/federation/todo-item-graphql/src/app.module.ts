import { ApolloFederationDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { typeormOrmConfig } from '../../../helpers'
import { TodoItemModule } from './todo-item/todo-item.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_todo_item')),
    GraphQLModule.forRoot({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: { version: 2, importUrl: 'https://specs.apollo.dev/federation/v2.7' } }
    }),
    TodoItemModule
  ]
})
export class AppModule {}
