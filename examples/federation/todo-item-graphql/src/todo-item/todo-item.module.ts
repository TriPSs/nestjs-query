import { NestjsQueryGraphQLModule } from '@rezonate/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@rezonate/nestjs-query-typeorm';
import { Module } from '@nestjs/common';
import { TodoItemInputDTO } from './dto/todo-item-input.dto';
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto';
import { TodoItemDTO } from './dto/todo-item.dto';
import { TodoItemEntity } from './todo-item.entity';

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
          referenceBy: { key: 'id' }
        }
      ]
    })
  ]
})
export class TodoItemModule {}
