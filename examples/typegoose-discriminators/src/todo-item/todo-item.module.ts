import { InjectModel } from '@m8a/nestjs-typegoose'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@souagrosolucoes/nestjs-query-graphql'
import { NestjsQueryTypegooseModule, TypegooseQueryService } from '@souagrosolucoes/nestjs-query-typegoose'
import { ReturnModelType } from '@typegoose/typegoose'

import { CreateTodoAppointmentInput } from './dto/create-todo-appointment.input'
import { CreateTodoTaskInput } from './dto/create-todo-task.input'
import { TodoAppointmentDTO } from './dto/todo-appointment.dto'
import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoTaskDTO } from './dto/todo-task.dto'
import { TodoAppointmentEntity } from './entities/todo-appointment.entity'
import { TodoItemEntity } from './entities/todo-item.entity'
import { TodoTaskEntity } from './entities/todo-task.entity'

class TodoTaskEntityService extends TypegooseQueryService<TodoTaskEntity> {
  constructor(@InjectModel(TodoTaskEntity) readonly model: ReturnModelType<typeof TodoTaskEntity>) {
    super(model)
  }
}

class TodoAppointmentService extends TypegooseQueryService<TodoAppointmentEntity> {
  constructor(@InjectModel(TodoAppointmentEntity) readonly model: ReturnModelType<typeof TodoAppointmentEntity>) {
    super(model)
  }
}

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypegooseModule.forFeature([
          {
            typegooseClass: TodoItemEntity,
            discriminators: [{ typegooseClass: TodoTaskEntity }, { typegooseClass: TodoAppointmentEntity }]
          }
        ])
      ],
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoItemEntity,
          create: { disabled: true }, // Disable create for the base entity
          update: { disabled: true } // Disable update for the base entity
        },
        {
          DTOClass: TodoTaskDTO,
          EntityClass: TodoTaskEntity,
          CreateDTOClass: CreateTodoTaskInput,
          ServiceClass: TodoTaskEntityService
        },
        {
          DTOClass: TodoAppointmentDTO,
          EntityClass: TodoAppointmentEntity,
          CreateDTOClass: CreateTodoAppointmentInput,
          ServiceClass: TodoAppointmentService
        }
      ],
      services: [TodoTaskEntityService, TodoAppointmentService]
    })
  ]
})
export class TodoItemModule {}
