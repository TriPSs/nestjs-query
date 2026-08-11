import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule, PagingStrategies } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TagDTO } from '../tag/dto/tag.dto'
import { TagEntity } from '../tag/tag.entity'
import { TagService } from '../tag/tag.service'
import { TodoToTagDTO } from '../todo-to-tag/dto/todo-to-tag.dto'
import { TodoToTagEntity } from '../todo-to-tag/todo-to-tag.entity'
import { TodoToTagService } from '../todo-to-tag/todo-to-tag.service'
import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemEntity } from './todo-item.entity'
import { TodoItemResolver } from './todo-item.resolver'
import { TodoItemService } from './todo-item.service'

@Module({
  providers: [TodoItemResolver],
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity, TodoToTagEntity, TagEntity])],
      services: [TodoItemService, TodoToTagService, TagService],
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          ServiceClass: TodoItemService,
          CreateDTOClass: TodoItemInputDTO,
          UpdateDTOClass: TodoItemUpdateDTO
        },
        {
          DTOClass: TodoToTagDTO,
          EntityClass: TodoToTagEntity,
          ServiceClass: TodoToTagService,
          pagingStrategy: PagingStrategies.NONE,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: { disabled: true }
        },
        {
          DTOClass: TagDTO,
          EntityClass: TagEntity,
          ServiceClass: TagService,
          pagingStrategy: PagingStrategies.NONE,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
          read: { disabled: true }
        }
      ]
    })
  ]
})
export class TodoItemModule {}
