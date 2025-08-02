import { TypegooseModule } from '@m8a/nestjs-typegoose'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { DynamicModule, Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'

import { formatGraphqlError, mongooseConfig } from '../../helpers'
import { GqlContext } from './auth.guard'
import { SubTaskModule } from './sub-task/sub-task.module'

const { uri, ...options } = mongooseConfig('typegoose', {})

@Module({})
export class AppModule {
  static forTest(todoItemModule: DynamicModule): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        TypegooseModule.forRoot(uri, options),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: 'examples/typegoose-discriminators/schema.gql',
          context: ({ req }: { req: { headers: Record<string, string> } }): GqlContext => ({ request: req }),
          formatError: formatGraphqlError
        }),
        SubTaskModule,
        todoItemModule
      ]
    }
  }
}
