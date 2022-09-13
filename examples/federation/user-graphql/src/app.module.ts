import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeormOrmConfig } from '../../../helpers';
import { UserModule } from './user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOrmConfig('federation_user')),
    // ts-ignore
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      autoSchemaFile: 'schema.gql'
    }),
    UserModule
  ]
})
export class AppModule {}
