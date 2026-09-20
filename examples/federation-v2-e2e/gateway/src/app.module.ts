import { IntrospectAndCompose } from '@apollo/gateway'
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'users', url: process.env.USER_SERVICE_URL || 'http://user-service:3000/graphql' },
            { name: 'todos', url: process.env.TODO_SERVICE_URL || 'http://todo-service:3000/graphql' },
            { name: 'tags', url: process.env.TAG_SERVICE_URL || 'http://tag-service:3000/graphql' }
          ]
        })
      }
    })
  ]
})
export class AppModule {}
