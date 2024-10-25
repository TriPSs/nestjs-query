import { InjectQueryService, NoOpQueryService, Query, QueryOptions, QueryService } from '@ptc-org/nestjs-query-core'
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm'
import { Repository } from 'typeorm'

import { JsonTaskDto } from './dto/json-task.dto'
import { JsonTaskEntity } from './json-task.entity'

export class JsonTaskService extends NoOpQueryService<JsonTaskDto, JsonTaskEntity> {
  constructor(@InjectQueryService(JsonTaskEntity) private readonly queryService: QueryService<JsonTaskEntity>) {
    super()
  }

  async query(query: Query<JsonTaskDto>, opts?: QueryOptions<JsonTaskDto>): Promise<JsonTaskDto[]> {
    const response = await this.queryService.query({
      filter: {
        display: {
          contains: { name: 'JsonTask-1' }
        }
      }
    })

    return response
  }
}
