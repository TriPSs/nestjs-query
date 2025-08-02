import { AssemblerQueryService, InjectQueryService, QueryService } from '@ptc-org/nestjs-query-core'

import { TodoAppointmentDTO } from './dto/todo-appointment.dto'
import { TodoAppointmentEntity } from './entities/todo-appointment.entity'
import { TodoAppointmentAssembler } from './todo-appointment.assembler'

@QueryService(TodoAppointmentDTO)
export class TodoAppointmentService extends AssemblerQueryService<TodoAppointmentDTO, TodoAppointmentEntity> {
  constructor(
    readonly assembler: TodoAppointmentAssembler,
    @InjectQueryService(TodoAppointmentEntity) readonly service: QueryService<TodoAppointmentEntity>
  ) {
    super(assembler, service)
  }

  async addNewParticipant(id: string): Promise<TodoAppointmentDTO> {
    const appointment = await this.service.getById(id)
    return this.service.updateOne(appointment.id, { participants: ['John Doe'] })
  }

  async getLastParticipant(id: string): Promise<string> {
    const appointment = await this.service.getById(id)
    return appointment.participants[appointment.participants.length - 1]
  }
}
