import { InjectModel } from '@m8a/nestjs-typegoose'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypegooseModule, TypegooseQueryService } from '@ptc-org/nestjs-query-typegoose'
import { ReturnModelType } from '@typegoose/typegoose'

import { CreateTodoAppointmentInput } from './dto/create-todo-appointment.input'
import { CreateTodoTaskInput } from './dto/create-todo-task.input'
import { TodoAppointmentDTO } from './dto/todo-appointment.dto'
import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoTaskDTO } from './dto/todo-task.dto'
import { TodoAppointmentEntity } from './entities/todo-appointment.entity'
import { TodoItemEntity } from './entities/todo-item.entity'
import { TodoTaskEntity } from './entities/todo-task.entity'


// NOTE: This is just an example!!!!
// The tests aren't using this module. 
// The tests use test-setup.ts to setup this module for each test
// You can look into that file to see how to work with the Nestjs-Query-GraphQL module 

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypegooseModule.forFeature([
          {
            typegooseClass: TodoItemEntity,
            discriminators: [TodoTaskEntity, TodoAppointmentEntity]
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
              EntityClass: TodoTaskEntity,
              CreateDTOClass: CreateTodoTaskInput
            },
            { DTOClass: TodoAppointmentDTO, EntityClass: TodoAppointmentEntity, CreateDTOClass: CreateTodoAppointmentInput }
          ]
        }
      ]
    })
  ],
  providers: []
})
export class TodoItemModule {}