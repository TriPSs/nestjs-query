import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { CRUDResolver } from '@ptc-org/nestjs-query-graphql'

import { CreateTodoTaskInput } from './dto/create-todo-task.input'
import { TodoTaskDTO } from './dto/todo-task.dto'
import { TodoTaskService } from './todo-task.service'

@Resolver(() => TodoTaskDTO)
export class TodoTaskResolver extends CRUDResolver(TodoTaskDTO, {
  CreateDTOClass: CreateTodoTaskInput
}) {
  constructor(readonly service: TodoTaskService) {
    super(service)
  }

  @Mutation(() => Number)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async markAllAsComplete(@Args('input', { type: () => String, nullable: true }) input?: string): Promise<number> {
    return this.service.markAllAsComplete()
  }
}
