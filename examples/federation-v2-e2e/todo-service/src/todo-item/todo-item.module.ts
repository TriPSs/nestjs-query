import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryGraphQLModule } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypeOrmModule } from '@souagrosolucoes/nestjs-query-typeorm'

import { TodoItemDTO } from './todo-item.dto'
import { TodoItemEntity } from './todo-item.entity'
import { CreateTodoItemInput, UpdateTodoItemInput } from './todo-item.input'
import { TodoItemSeederService } from './todo-item.seeder'

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoItemEntity]),
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
  ],
  providers: [TodoItemSeederService]
})
export class TodoItemModule {}
