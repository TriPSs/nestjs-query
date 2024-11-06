import { InjectRepository } from '@nestjs/typeorm'
import { QueryService } from '@souagrosolucoes/nestjs-query-core'
import { TypeOrmQueryService } from '@souagrosolucoes/nestjs-query-typeorm'
import { Repository } from 'typeorm'

import { TodoItemEntity } from './todo-item.entity'

@QueryService(TodoItemEntity)
export class TodoItemService extends TypeOrmQueryService<TodoItemEntity> {
  constructor(@InjectRepository(TodoItemEntity) repo: Repository<TodoItemEntity>) {
    super(repo, { useSoftDelete: true })
  }
}
