import { ApolloDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'

import { formatGraphqlError, typeormOrmConfig } from '../../helpers'
import { PostModule } from './post/post.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('basic')),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: 'examples/filters-deep/schema.gql',
      formatError: formatGraphqlError
    }),

    UserModule,
    PostModule
  ]
})
export class AppModule {}
