import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemAssembler } from './todo-item.assembler'
import { TodoItemEntity } from './todo-item.entity'
import { TodoItemResolver } from './todo-item.resolver'
import { TodoItemService } from './todo-item.service'

@Module({
  providers: [TodoItemResolver],

  imports: [
    NestjsQueryGraphQLModule.forFeature({
      services: [TodoItemService, TodoItemAssembler],
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],

      dtos: [
        {
          DTOClass: TodoItemDTO,
          CreateDTOClass: TodoItemInputDTO,
          UpdateDTOClass: TodoItemUpdateDTO
        }
      ]
    })
  ]
})
export class TodoItemModule {}
