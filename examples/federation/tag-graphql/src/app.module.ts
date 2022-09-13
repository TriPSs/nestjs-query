import { Module } from '@nestjs/common';
import { GraphQLModule} from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagModule } from './tag/tag.module';
import { typeormOrmConfig } from '../../../helpers';
import { ApolloFederationDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_tag')),
    // ts-ignore
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      autoSchemaFile: 'schema.gql'
    }),
    TagModule
  ]
})
export class AppModule {}
