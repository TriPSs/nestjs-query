import { FilterableField } from '@ptc-org/nestjs-query-graphql';
import { ObjectType } from '@nestjs/graphql';
import { TodoItemDTO } from './todo-item.dto';

@ObjectType('TodoTask')
export class TodoTaskDTO extends TodoItemDTO {
  @FilterableField()
  priority!: number;
}