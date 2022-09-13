import { Module } from '@nestjs/common';
import { GraphQLModule} from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoItemModule } from './todo-item/todo-item.module';
import { typeormOrmConfig } from '../../../helpers';
import { ApolloFederationDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_todo_item')),
    // ts-ignore
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      autoSchemaFile: 'schema.gql'
    }),
    TodoItemModule
  ]
})
export class AppModule {}
