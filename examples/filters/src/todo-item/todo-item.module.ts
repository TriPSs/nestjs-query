import { NestjsQueryGraphQLModule } from '@rezonapp/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@rezonapp/nestjs-query-typeorm';
import { Module } from '@nestjs/common';
import { TodoItemDTO } from './dto/todo-item.dto';
import { TodoItemEntity } from './todo-item.entity';

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity
        }
      ]
    })
  ]
})
export class TodoItemModule {}
