import { Test } from '@nestjs/testing'
import { DiscriminateDTOsOpts, NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypegooseModule } from '@ptc-org/nestjs-query-typegoose'

import { AppModule } from '../src/app.module'
import { CreateTodoAppointmentInput } from '../src/todo-item/dto/create-todo-appointment.input'
import { CreateTodoTaskInput } from '../src/todo-item/dto/create-todo-task.input'
import { TodoAppointmentDTO } from '../src/todo-item/dto/todo-appointment.dto'
// Import all the necessary DTOs, Entities, and the custom assembler
import { TodoItemDTO } from '../src/todo-item/dto/todo-item.dto'
import { TodoTaskDTO } from '../src/todo-item/dto/todo-task.dto'
import { TodoAppointmentEntity } from '../src/todo-item/entities/todo-appointment.entity'
import { TodoItemEntity } from '../src/todo-item/entities/todo-item.entity'
import { TodoTaskEntity } from '../src/todo-item/entities/todo-task.entity'

// Factory function for the original test (no custom assembler)
export const createTestModule = () => {
  const feature: DiscriminateDTOsOpts = {
    baseDTO: TodoItemDTO,
    baseEntity: TodoItemEntity,
    discriminators: [
      {
        DTOClass: TodoTaskDTO,
        EntityClass: TodoTaskEntity,
        CreateDTOClass: CreateTodoTaskInput
      },
      {
        DTOClass: TodoAppointmentDTO,
        EntityClass: TodoAppointmentEntity,
        CreateDTOClass: CreateTodoAppointmentInput
      }
    ]
  }
  const todoItemModule = NestjsQueryGraphQLModule.forFeature({
    imports: [
      NestjsQueryTypegooseModule.forFeature([
        {
          typegooseClass: TodoItemEntity,
          discriminators: [TodoTaskEntity, TodoAppointmentEntity]
        }
      ])
    ],
    discriminateDTOs: [feature]
  })

  return Test.createTestingModule({
    imports: [AppModule.forTest(todoItemModule)]
  }).compile()
}

// Factory function for the custom assembler test
export const createCustomAssemblerTestModule = async () => {
  const { TodoTaskAssembler } = await import('../src/todo-item/todo-task.assembler')
  const feature: DiscriminateDTOsOpts = {
    baseDTO: TodoItemDTO,
    baseEntity: TodoItemEntity,
    discriminators: [
      {
        DTOClass: TodoTaskDTO,
        EntityClass: TodoTaskEntity,
        CreateDTOClass: CreateTodoTaskInput,
        AssemblerClass: TodoTaskAssembler
      },
      {
        DTOClass: TodoAppointmentDTO,
        EntityClass: TodoAppointmentEntity,
        CreateDTOClass: CreateTodoAppointmentInput
      }
    ]
  }

  const todoItemModule = NestjsQueryGraphQLModule.forFeature({
    imports: [
      NestjsQueryTypegooseModule.forFeature([
        {
          typegooseClass: TodoItemEntity,
          discriminators: [TodoTaskEntity, TodoAppointmentEntity]
        }
      ])
    ],
    discriminateDTOs: [feature]
  })

  return Test.createTestingModule({
    imports: [AppModule.forTest(todoItemModule)]
  }).compile()
}

export const createFullOverrideTestModule1 = async () => {
  const { TodoTaskService } = await import('../src/todo-item/todo-task.service')
  const { TodoTaskResolver } = await import('../src/todo-item/todo-task.resolver')
  const { TodoTaskAssembler } = await import('../src/todo-item/todo-task.assembler')
  const feature: DiscriminateDTOsOpts = {
    baseDTO: TodoItemDTO,
    baseEntity: TodoItemEntity,
    discriminators: [
      {
        DTOClass: TodoTaskDTO,
        EntityClass: TodoTaskEntity,
        CreateDTOClass: CreateTodoTaskInput,
        ResolverClass: TodoTaskResolver,
        AssemblerClass: TodoTaskAssembler
      },
      {
        DTOClass: TodoAppointmentDTO,
        EntityClass: TodoAppointmentEntity,
        CreateDTOClass: CreateTodoAppointmentInput
      }
    ]
  }

  const todoItemModule = NestjsQueryGraphQLModule.forFeature({
    imports: [
      NestjsQueryTypegooseModule.forFeature([
        {
          typegooseClass: TodoItemEntity,
          discriminators: [TodoTaskEntity, TodoAppointmentEntity]
        }
      ])
    ],
    discriminateDTOs: [feature],
    services: [TodoTaskService]
  })

  return Test.createTestingModule({
    imports: [AppModule.forTest(todoItemModule)]
  }).compile()
}

export const createFullOverrideTestModule2 = async () => {
  const { TodoAppointmentService } = await import('../src/todo-item/todo-appointment.service')
  const { TodoAppointmentAssembler } = await import('../src/todo-item/todo-appointment.assembler')
  const { TodoAppointmentResolver } = await import('../src/todo-item/todo-appointment.resolver')

  const feature: DiscriminateDTOsOpts = {
    baseDTO: TodoItemDTO,
    baseEntity: TodoItemEntity,
    discriminators: [
      {
        DTOClass: TodoTaskDTO,
        EntityClass: TodoTaskEntity,
        CreateDTOClass: CreateTodoTaskInput
      },
      {
        DTOClass: TodoAppointmentDTO,
        EntityClass: TodoAppointmentEntity,
        CreateDTOClass: CreateTodoAppointmentInput,
        AssemblerClass: TodoAppointmentAssembler,
        ResolverClass: TodoAppointmentResolver
      }
    ]
  }

  const todoItemModule = NestjsQueryGraphQLModule.forFeature({
    imports: [
      NestjsQueryTypegooseModule.forFeature([
        {
          typegooseClass: TodoItemEntity,
          discriminators: [TodoTaskEntity, TodoAppointmentEntity]
        }
      ])
    ],
    discriminateDTOs: [feature],
    services: [TodoAppointmentService]
  })

  return Test.createTestingModule({
    imports: [AppModule.forTest(todoItemModule)]
  }).compile()
}
