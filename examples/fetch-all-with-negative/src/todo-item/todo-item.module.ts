import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { TodoItemCursorFetchWithNegativeDisableDTO } from './dto/todo-item-cursor-fetch-all-disable.dto'
import { TodoItemCursorFetchWithNegativeEnableDTO } from './dto/todo-item-cursor-fetch-all-enable.dto'
import { TodoItemOffsetFetchWithNegativeDisableDTO } from './dto/todo-item-offset-fetch-all-disable.dto'
import { TodoItemOffsetFetchWithNegativeEnableDTO } from './dto/todo-item-offset-fetch-all-enable.dto'
import { TodoItemEntity } from './todo-item.entity'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      resolvers: [
        {
          DTOClass: TodoItemCursorFetchWithNegativeEnableDTO,
          EntityClass: TodoItemEntity
        },
        {
          DTOClass: TodoItemCursorFetchWithNegativeDisableDTO,
          EntityClass: TodoItemEntity
        },
        {
          DTOClass: TodoItemOffsetFetchWithNegativeEnableDTO,
          EntityClass: TodoItemEntity
        },
        {
          DTOClass: TodoItemOffsetFetchWithNegativeDisableDTO,
          EntityClass: TodoItemEntity
        }
      ]
    })
  ]
})
export class TodoItemModule {}
