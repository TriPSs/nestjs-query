import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule, PagingStrategies } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemEntity } from './todo-item.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          CreateDTOClass: TodoItemInputDTO,
          UpdateDTOClass: TodoItemUpdateDTO,
          read: {
            pagingStrategy: PagingStrategies.NONE
          }
        },
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: {
            connectionName: 'TodoItemOffsetConnection',
            pagingStrategy: PagingStrategies.OFFSET,
            one: { disabled: true },
            many: { name: 'todoItemsOffset' }
          }
        },
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: {
            connectionName: 'TodoItemCursorConnection',
            one: { disabled: true },
            many: { name: 'todoItemsCursor' }
          }
        }
      ]
    })
  ]
})
export class TodoItemModule {}
