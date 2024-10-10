import { Module } from '@nestjs/common'
import { NestjsQueryRestModule } from '@ptc-org/nestjs-query-rest'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemEntity } from './todo-item.entity'

@Module({
  imports: [
    NestjsQueryRestModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      endpoints: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          CreateDTOClass: TodoItemInputDTO,
          UpdateDTOClass: TodoItemUpdateDTO
        }
      ]
    })
  ]
})
export class TodoItemModule {}
