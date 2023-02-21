import { Inject } from '@nestjs/common'
import { Args, Field, ID, InputType, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AssemblerQueryService, Filter } from '@ptc-org/nestjs-query-core'
import { ConnectionType, CRUDResolver } from '@ptc-org/nestjs-query-graphql'
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm'
import { IsString } from 'class-validator'

import { AuthGuard } from '../auth.guard'
import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemAssembler } from './todo-item.assembler'
import { TodoItemEntity } from './todo-item.entity'
import { TodoItemService } from './todo-item.service'
import { TodoItemConnection, TodoItemQuery } from './types'

const guards = [AuthGuard]

@InputType()
export class RestoreOneTodoItemInput {
  @IsString()
  @Field(() => ID, {
    nullable: true,
    description: 'The id of the record to restore.'
  })
  id!: number
}

@Resolver(() => TodoItemDTO)
export class TodoItemResolver extends CRUDResolver(TodoItemDTO, {
  CreateDTOClass: TodoItemInputDTO,
  UpdateDTOClass: TodoItemUpdateDTO,
  enableAggregate: true,
  aggregate: { guards },
  create: { guards },
  update: { guards },
  delete: { guards }
}) {
  private assemblerQueryService: AssemblerQueryService<TodoItemDTO, TodoItemEntity>

  private typeormQueryService: TypeOrmQueryService<TodoItemEntity>

  private assembler: TodoItemAssembler

  constructor(
    @Inject(TodoItemAssembler)
    assembler: TodoItemAssembler,

    @Inject(TodoItemService)
    service: TodoItemService
  ) {
    const assemblerQueryService = new AssemblerQueryService(assembler, service)

    super(assemblerQueryService)

    this.assembler = assembler
    this.typeormQueryService = service
    this.assemblerQueryService = assemblerQueryService
  }

  // Set the return type to the TodoItemConnection
  @Query(() => TodoItemConnection)
  completedTodoItems(@Args() query: TodoItemQuery): Promise<ConnectionType<TodoItemDTO>> {
    // add the completed filter the user provided filter
    const filter: Filter<TodoItemDTO> = {
      ...query.filter,
      ...{ completed: { is: true } }
    }

    return TodoItemConnection.createFromPromise((q) => this.assemblerQueryService.query(q), { ...query, ...{ filter } })
  }

  // Set the return type to the TodoItemConnection
  @Query(() => TodoItemConnection)
  uncompletedTodoItems(@Args() query: TodoItemQuery): Promise<ConnectionType<TodoItemDTO>> {
    // add the completed filter the user provided filter
    const filter: Filter<TodoItemDTO> = {
      ...query.filter,
      ...{ completed: { is: false } }
    }

    return TodoItemConnection.createFromPromise((q) => this.assemblerQueryService.query(q), { ...query, ...{ filter } })
  }

  @Query(() => TodoItemConnection)
  async todoItemsWithDeleted(@Args() query: TodoItemQuery): Promise<ConnectionType<TodoItemDTO>> {
    return TodoItemConnection.createFromPromise(
      (q) => this.assemblerQueryService.query(q, { withDeleted: true }),
      query,
      (q) => this.assemblerQueryService.count(q, { withDeleted: true })
    )
  }

  @Mutation(() => TodoItemDTO)
  async restoreOneTodoItem(
    @Args('input', { type: () => RestoreOneTodoItemInput })
    input: RestoreOneTodoItemInput
  ): Promise<TodoItemDTO> {
    const todoItem = await this.typeormQueryService.restoreOne(input.id)
    const todoItemDTO = this.assembler.convertToDTO(todoItem)

    return todoItemDTO
  }
}
