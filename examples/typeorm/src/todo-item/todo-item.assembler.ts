import { Assembler, ClassTransformerAssembler } from '@souagrosolucoes/nestjs-query-core'

import { TodoItemDTO } from './dto/todo-item.dto'
import { TodoItemEntity } from './todo-item.entity'

@Assembler(TodoItemDTO, TodoItemEntity)
export class TodoItemAssembler extends ClassTransformerAssembler<TodoItemDTO, TodoItemEntity> {
  convertToDTO(entity: TodoItemEntity): TodoItemDTO {
    const dto = super.convertToDTO(entity) as TodoItemDTO
    dto.age = Date.now() - entity.created.getMilliseconds()
    return dto
  }
}
