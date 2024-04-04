import { Args, ArgsType, ID, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Filter, UpdateManyResponse } from '@ptc-org/nestjs-query-core'
import { ConnectionType, FilterType, QueryArgsType, UpdateManyResponseType } from '@ptc-org/nestjs-query-graphql'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemService } from './todo-item.service'

@ArgsType()
export class TodoItemQuery extends QueryArgsType(TodoItemDTO) {}

export const TodoItemConnection = TodoItemQuery.ConnectionType

@Resolver(() => TodoItemDTO)
export class TodoItemResolver {
  constructor(readonly service: TodoItemService) {}

  @Query(() => TodoItemConnection)
  async todoItemsWithDeleted(@Args() query: TodoItemQuery): Promise<ConnectionType<TodoItemDTO>> {
    return TodoItemConnection.createFromPromise(
      (q) => this.service.query(q, { withDeleted: true }),
      query,
      (q) => this.service.count(q, { withDeleted: true })
    )
  }

  @Mutation(() => TodoItemDTO)
  restoreOneTodoItem(@Args('input', { type: () => ID }) id: number): Promise<TodoItemDTO> {
    return this.service.restoreOne(id)
  }

  @Mutation(() => UpdateManyResponseType())
  restoreManyTodoItems(
    @Args('input', { type: () => FilterType(TodoItemDTO) }) filter: Filter<TodoItemDTO>
  ): Promise<UpdateManyResponse> {
    return this.service.restoreMany(filter)
  }
}
