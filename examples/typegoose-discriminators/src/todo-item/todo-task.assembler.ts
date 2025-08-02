import { Assembler, ClassTransformerAssembler } from '@ptc-org/nestjs-query-core'

import { TodoTaskDTO } from './dto/todo-task.dto'
import { TodoTaskEntity } from './entities/todo-task.entity'

@Assembler(TodoTaskDTO, TodoTaskEntity)
export class TodoTaskAssembler extends ClassTransformerAssembler<TodoTaskDTO, TodoTaskEntity> {
  constructor() {
    super(TodoTaskDTO, TodoTaskEntity)
  }

  async convertToDTO(entity: TodoTaskEntity): Promise<TodoTaskDTO> {
    const dto = await super.convertToDTO(entity)
    dto.title = `[task] ${dto.title}`
    return dto
  }
}
