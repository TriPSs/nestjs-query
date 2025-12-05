import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TodoItemDTO } from './todo-item.dto'
import { TodoItemEntity } from './todo-item.entity'
import { CreateTodoItemInput, UpdateTodoItemInput } from './todo-item.input'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          CreateDTOClass: CreateTodoItemInput,
          UpdateDTOClass: UpdateTodoItemInput,
          // This also uses referenceBy, so it will have the same issue
          referenceBy: { key: 'id' }
        }
      ]
    })
  ]
})
export class TodoItemModule {}
