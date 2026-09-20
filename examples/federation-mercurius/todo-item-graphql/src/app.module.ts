import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { MercuriusFederationDriver } from '@nestjs/mercurius'
import { TypeOrmModule } from '@nestjs/typeorm'

import { typeormOrmConfig } from '../../../helpers'
import { TodoItemModule } from './todo-item/todo-item.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_mercurius_todo_item')),
    GraphQLModule.forRoot({
      driver: MercuriusFederationDriver,
      autoSchemaFile: { federation: 2 },
      subscription: true
    }),
    TodoItemModule
  ]
})
export class AppModule {}
