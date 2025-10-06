import { ApolloDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { formatGraphqlError, typeormOrmConfig } from '../../helpers'
import { AuthModule } from './auth/auth.module'
import { SubTaskModule } from './sub-task/sub-task.module'
import { TagModule } from './tag/tag.module'
import { TodoItemModule } from './todo-item/todo-item.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('auth')),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: 'examples/auth/schema.gql',
      installSubscriptionHandlers: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams: unknown) => ({ headers: connectionParams })
        }
      },
      formatError: formatGraphqlError
    }),
    AuthModule,
    UserModule,
    TodoItemModule,
    SubTaskModule,
    TagModule
  ]
})
export class AppModule {}
