import { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql';
import { ObjectType, ID } from '@nestjs/graphql';

@ObjectType('TodoItem')
export class TodoItemDTO {
  @IDField(() => ID)
  id!: string;

  @FilterableField()
  title!: string;

  @FilterableField()
  completed!: boolean;

  @FilterableField()
  documentType!: string;
}