import { ApolloDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { formatGraphqlError, typeormOrmConfig } from '../../../examples/helpers'
import { SubTaskModule } from './sub-task/sub-task.module'
import { TodoItemModule } from './todo-item/todo-item.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('typeorm_soft_delete')),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: 'examples/typeorm-soft-delete/schema.gql',
      formatError: formatGraphqlError
    }),

    SubTaskModule,
    TodoItemModule
  ]
})
export class AppModule {}
