// eslint-disable-next-line import/no-extraneous-dependencies
import { ApolloFederationDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
// eslint-disable-next-line import/no-extraneous-dependencies
import { TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { NestjsQueryGraphQLModule, PagingStrategies } from '../../../../src'
import { TodoItemDto } from '../dtos/todo-item.dto'
import { TodoItem } from '../entities/todo-item.entity'
import { TodoList } from '../entities/todo-list.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoItem, TodoList]),
    GraphQLModule.forRoot({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 }
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItem])],
      resolvers: [
        {
          EntityClass: TodoItem,
          DTOClass: TodoItemDto,
          pagingStrategy: PagingStrategies.NONE,
          // Key configuration: This enables ReferenceResolver which we're testing
          referenceBy: { key: 'id' }
        }
      ]
    })
  ]
})
export class TodoItemSubgraphModule {}
