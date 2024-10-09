import { InjectRepository } from '@nestjs/typeorm'
import { QueryService } from '@ptc-org/nestjs-query-core'
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm'
import { Repository } from 'typeorm'

import { SubTaskEntity } from './sub-task.entity'

@QueryService(SubTaskEntity)
export class SubTaskService extends TypeOrmQueryService<SubTaskEntity> {
  constructor(@InjectRepository(SubTaskEntity) repo: Repository<SubTaskEntity>) {
    super(repo, { useSoftDelete: true })
  }
}
