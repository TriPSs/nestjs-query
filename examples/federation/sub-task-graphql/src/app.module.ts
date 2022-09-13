import { Module } from '@nestjs/common';
import { GraphQLModule} from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubTaskModule } from './sub-task/sub-task.module';
import { typeormOrmConfig } from '../../../helpers';
import { ApolloFederationDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_sub_task')),
    // ts-ignore
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      autoSchemaFile: 'schema.gql'
    }),
    SubTaskModule
  ]
})
export class AppModule {}
