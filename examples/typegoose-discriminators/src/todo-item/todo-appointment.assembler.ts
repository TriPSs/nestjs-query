import { Assembler, ClassTransformerAssembler } from '@ptc-org/nestjs-query-core'

import { TodoAppointmentDTO } from './dto/todo-appointment.dto'
import { TodoAppointmentEntity } from './entities/todo-appointment.entity'

@Assembler(TodoAppointmentDTO, TodoAppointmentEntity)
export class TodoAppointmentAssembler extends ClassTransformerAssembler<TodoAppointmentDTO, TodoAppointmentEntity> {
  async convertToDTO(entity: TodoAppointmentEntity): Promise<TodoAppointmentDTO> {
    const dto = await super.convertToDTO(entity)
    dto.title = `[appointment] ${dto.title}`
    return dto
  }
}
