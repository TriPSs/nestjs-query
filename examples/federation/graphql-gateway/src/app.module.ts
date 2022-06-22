import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // ... Apollo server options
        cors: true
      },
      gateway: {
        serviceList: [
          { name: 'todo-items', url: 'http://localhost:3001/graphql' },
          { name: 'sub-tasks', url: 'http://localhost:3002/graphql' },
          { name: 'tags', url: 'http://localhost:3003/graphql' },
          { name: 'user', url: 'http://localhost:3004/graphql' }
        ]
      }
    })
  ]
})
export class AppModule {}
