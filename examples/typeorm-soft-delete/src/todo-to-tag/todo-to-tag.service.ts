import { InjectRepository } from '@nestjs/typeorm'
import { QueryService } from '@ptc-org/nestjs-query-core'
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm'
import { Repository } from 'typeorm'

import { TodoToTagEntity } from './todo-to-tag.entity'

@QueryService(TodoToTagEntity)
export class TodoToTagService extends TypeOrmQueryService<TodoToTagEntity> {
  constructor(@InjectRepository(TodoToTagEntity) repo: Repository<TodoToTagEntity>) {
    super(repo, { useSoftDelete: true })
  }
}
