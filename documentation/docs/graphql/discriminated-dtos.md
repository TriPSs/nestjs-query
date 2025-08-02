---
id: discriminated-dtos
title: Discriminated DTOs
---

`nestjs-query` provides support for discriminated DTOs, allowing you to use inheritance in your GraphQL schema. This is particularly useful when you have a base entity and several concrete implementations, each with its own unique fields.

## Basic Configuration

To use discriminated DTOs, you need to provide a `discriminateDTOs` configuration to the `NestjsQueryGraphQLModule.forFeature` method. This configuration takes a base DTO, a base entity, and an array of discriminators.

Each discriminator in the array should specify the `DTOClass` and `EntityClass` for the concrete implementation.

```typescript
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypegooseModule } from '@ptc-org/nestjs-query-typegoose';
import { TodoItemDTO } from './todo-item/dto/todo-item.dto';
import { TodoItemEntity } from './todo-item/entities/todo-item.entity';
import { TodoTaskDTO } from './todo-item/dto/todo-task.dto';
import { TodoTaskEntity } from './todo-item/entities/todo-task.entity';

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypegooseModule.forFeature([
          {
            typegooseClass: TodoItemEntity,
            discriminators: [TodoTaskEntity]
          }
        ])
      ],
      discriminateDTOs: [
        {
          baseDTO: TodoItemDTO,
          baseEntity: TodoItemEntity,
          discriminators: [
            {
              DTOClass: TodoTaskDTO,
              EntityClass: TodoTaskEntity
            }
          ]
        }
      ]
    })
  ]
})
export class AppModule {}
```

## Full Override for Custom Logic

While the basic configuration is useful, you'll often need to add custom logic to your resolvers and services. `nestjs-query` allows you to provide your own `ResolverClass`, `ServiceClass`, and `AssemblerClass` for each discriminator, giving you full control over the generated schema.

This is particularly useful when you want to add custom queries or mutations to a specific discriminator.

### Example: Full Override

Here's an example of how to use the full override pattern to add a custom mutation to a `TodoTask` discriminator.

**1. Create a Custom Service**

First, create a custom service that extends the `AssemblerQueryService` and adds your custom logic.

```typescript
// src/todo-item/todo-task.service.ts
import { AssemblerQueryService, InjectQueryService, QueryService } from '@ptc-org/nestjs-query-core';
import { TodoTaskEntity } from './entities/todo-task.entity';
import { TodoTaskDTO } from './dto/todo-task.dto';
import { TodoTaskAssembler } from './todo-task.assembler';

@QueryService(TodoTaskDTO)
export class TodoTaskService extends AssemblerQueryService<TodoTaskDTO, TodoTaskEntity> {
  constructor(
    readonly assembler: TodoTaskAssembler,
    @InjectQueryService(TodoTaskEntity) readonly service: QueryService<TodoTaskEntity>
  ) {
    super(assembler, service);
  }

  async markAllAsComplete(): Promise<number> {
    const entities = await this.service.query({ filter: { completed: { is: false } } });

    const { updatedCount } = await this.service.updateMany(
      { completed: true }, // update
      { id: { in: entities.map((e) => e.id) } } // filter
    );
    // do some other business logic
    return updatedCount;
  }
}
```

**2. Create a Custom Resolver**

Next, create a custom resolver that extends the `CRUDResolver` and adds your custom mutation.

```typescript
// src/todo-item/todo-task.resolver.ts
import { Resolver, Mutation } from '@nestjs/graphql';
import { CRUDResolver } from '@ptc-org/nestjs-query-graphql';
import { TodoTaskDTO } from './dto/todo-task.dto';
import { TodoTaskService } from './todo-task.service';
import { CreateTodoTaskInput } from './dto/create-todo-task.input';
import { AssemblerQueryService, InjectQueryService } from '@ptc-org/nestjs-query-core';
import { TodoTaskEntity } from './entities/todo-task.entity';

@Resolver(() => TodoTaskDTO)
export class TodoTaskResolver extends CRUDResolver(TodoTaskDTO, {
  CreateDTOClass: CreateTodoTaskInput
}) {
  private readonly taskService: TodoTaskService;

  constructor(@InjectQueryService(TodoTaskDTO) readonly service: AssemblerQueryService<TodoTaskDTO, TodoTaskEntity>) {
    super(service);
    this.taskService = service.service;
  }

  @Mutation(() => Number)
  async markAllAsComplete(): Promise<number> {
    return this.taskService.markAllAsComplete();
  }
}
```

**3. Update the Module Configuration**

Finally, update your module configuration to use the new `ResolverClass`, `ServiceClass`, and `AssemblerClass`.

```typescript
// src/app.module.ts
import { NestjsQueryGraphQLModule, DiscriminateDTOsOpts } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypegooseModule } from '@ptc-org/nestjs-query-typegoose';
import { TodoItemDTO } from './todo-item/dto/todo-item.dto';
import { TodoItemEntity } from './todo-item/entities/todo-item.entity';
import { TodoTaskDTO } from './todo-item/dto/todo-task.dto';
import { TodoTaskEntity } from './todo-item/entities/todo-task.entity';
import { CreateTodoTaskInput } from './todo-item/dto/create-todo-task.input';
import { TodoTaskService } from './todo-item/todo-task.service';
import { TodoTaskResolver } from './todo-item/todo-task.resolver';
import { TodoTaskAssembler } from './todo-item/todo-task.assembler';

const feature: DiscriminateDTOsOpts = {
  baseDTO: TodoItemDTO,
  baseEntity: TodoItemEntity,
  discriminators: [
    {
      DTOClass: TodoTaskDTO,
      EntityClass: TodoTaskEntity,
      CreateDTOClass: CreateTodoTaskInput,
      ServiceClass: TodoTaskService,
      ResolverClass: TodoTaskResolver,
      AssemblerClass: TodoTaskAssembler
    }
  ]
};

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypegooseModule.forFeature([
          {
            typegooseClass: TodoItemEntity,
            discriminators: [TodoTaskEntity]
          }
        ])
      ],
      discriminateDTOs: [feature]
    })
  ]
})
export class AppModule {}
```

> **Note:** This feature has been tested with `nestjs-query-typegoose`. While it is designed to be persistence-agnostic and should work with any `nestjs-query` persistence library that supports discriminators, it has not yet been explicitly tested with other libraries.
