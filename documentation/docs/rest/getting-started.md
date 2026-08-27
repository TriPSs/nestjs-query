---
title: Getting Started
---

The `@ptc-org/nestjs-query-rest` package creates documented REST CRUD controllers on top of a `QueryService`. It provides DTO decorators, generated controllers, filtering, offset paging, hooks, authorization, and CSV export.

## Installation

See the [installation guide](../introduction/install.md#ptc-orgnestjs-query-rest).

## Define the DTOs

The response DTO declares the fields returned by the API and which fields clients may filter on. Separate create and update DTOs keep writable fields explicit.

```ts title="todo-item.dto.ts"
import { FilterableField, IDField } from '@ptc-org/nestjs-query-rest'

export class TodoItemDTO {
  @IDField()
  id!: number

  @FilterableField()
  title!: string

  @FilterableField()
  completed!: boolean
}
```

```ts title="todo-item-input.dto.ts"
import { Field } from '@ptc-org/nestjs-query-rest'

export class TodoItemInputDTO {
  @Field({ maxLength: 100 })
  title!: string

  @Field()
  completed!: boolean
}
```

```ts title="todo-item-update.dto.ts"
import { Field } from '@ptc-org/nestjs-query-rest'

export class TodoItemUpdateDTO {
  @Field({ nullable: true, maxLength: 100 })
  title?: string

  @Field({ nullable: true })
  completed?: boolean
}
```

## Register an endpoint

Register the persistence module and describe the endpoint in `NestjsQueryRestModule.forFeature`. `basePath` is optional; without it, the path is derived from and pluralized from the DTO class name (`TodoItemDTO` becomes `/todo-item-dtos`).

```ts title="todo-item.module.ts"
import { Module } from '@nestjs/common'
import { NestjsQueryRestModule } from '@ptc-org/nestjs-query-rest'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemInputDTO } from './dto/todo-item-input.dto'
import { TodoItemUpdateDTO } from './dto/todo-item-update.dto'
import { TodoItemEntity } from './todo-item.entity'

@Module({
  imports: [
    NestjsQueryRestModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],
      endpoints: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          CreateDTOClass: TodoItemInputDTO,
          UpdateDTOClass: TodoItemUpdateDTO,
          basePath: 'todo-items'
        }
      ]
    })
  ]
})
export class TodoItemModule {}
```

This creates the following endpoints:

| Method   | Path                 | Description                    |
| -------- | -------------------- | ------------------------------ |
| `GET`    | `/todo-items`        | Filter and page records        |
| `GET`    | `/todo-items/:id`    | Find one record                |
| `POST`   | `/todo-items`        | Create one record              |
| `PUT`    | `/todo-items/:id`    | Update one record              |
| `DELETE` | `/todo-items/:id`    | Delete one record              |
| `GET`    | `/todo-items/export` | Export matching records as CSV |

## Enable request transformation and validation

The generated query and body DTOs use `class-transformer` and `class-validator`. Enable Nest's `ValidationPipe` so query strings such as `limit=10` are converted and validated.

```ts title="main.ts"
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  )
  await app.listen(3000)
}

void bootstrap()
```

Continue with [DTOs](./dtos.mdx), [controllers](./controllers.mdx), or the [query endpoint examples](./queries/endpoints.mdx).
