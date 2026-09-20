import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { MercuriusGatewayDriver } from '@nestjs/mercurius'

import { TODO_ITEM_PORT, USER_PORT } from '../../ports'

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: MercuriusGatewayDriver,
      subscription: true,
      gateway: {
        services: [
          {
            name: 'todo-items',
            url: `http://localhost:${TODO_ITEM_PORT}/graphql`,
            wsUrl: `ws://localhost:${TODO_ITEM_PORT}/graphql`
          },
          {
            name: 'users',
            url: `http://localhost:${USER_PORT}/graphql`,
            wsUrl: `ws://localhost:${USER_PORT}/graphql`
          }
        ]
      }
    })
  ]
})
export class AppModule {}
