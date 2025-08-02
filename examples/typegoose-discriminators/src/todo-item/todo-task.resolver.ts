import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { CRUDResolver } from '@ptc-org/nestjs-query-graphql';
import { TodoTaskDTO } from './dto/todo-task.dto';
import { TodoTaskService } from './todo-task.service';
import { CreateTodoTaskInput } from './dto/create-todo-task.input';
import { getQueryServiceToken, InjectAssemblerQueryService } from '@ptc-org/nestjs-query-core';
import { Inject } from '@nestjs/common';

@Resolver(() => TodoTaskDTO)
export class TodoTaskResolver extends CRUDResolver(TodoTaskDTO, {
  CreateDTOClass: CreateTodoTaskInput
}) {
  constructor(
    readonly service: TodoTaskService) {
    super(service);
  }

  @Mutation(() => Number)
  async markAllAsComplete(@Args('input', { type: () => String, nullable: true }) input?: string): Promise<number> {
    return this.service.markAllAsComplete();
  }
}
