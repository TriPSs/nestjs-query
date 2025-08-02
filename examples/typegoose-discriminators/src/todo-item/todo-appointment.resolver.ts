import { Inject } from '@nestjs/common';
import { Resolver, Mutation, Args, ID, Query } from '@nestjs/graphql';
import { CRUDResolver } from '@ptc-org/nestjs-query-graphql';
import { getQueryServiceToken } from '@ptc-org/nestjs-query-core';
import { TodoAppointmentDTO } from './dto/todo-appointment.dto';
import { TodoAppointmentService } from './todo-appointment.service';
import { CreateTodoAppointmentInput } from './dto/create-todo-appointment.input';

@Resolver(() => TodoAppointmentDTO)
export class TodoAppointmentResolver extends CRUDResolver(TodoAppointmentDTO, { CreateDTOClass: CreateTodoAppointmentInput }) {
  constructor(readonly service: TodoAppointmentService) {
    super(service);
  }

  @Mutation(() => TodoAppointmentDTO, { name: 'addNewParticipant' })
  addNewParticipant(@Args('id', { type: () => ID }) id: string): Promise<TodoAppointmentDTO> {
    return this.service.updateOne(id, { participants: ['Jane Doe'] });
  }

  @Query(() => String, { name: 'getLastParticipant' })
  getLastParticipant(@Args('id', { type: () => ID }) id: string): Promise<string> {
    return this.service.getLastParticipant(id);
  }
}