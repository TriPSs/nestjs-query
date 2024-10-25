import { Query, QueryOptions } from '@ptc-org/nestjs-query-core'
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm'
import { Repository } from 'typeorm'

import { JsonTaskDto } from './dto/json-task.dto'
import { JsonTaskEntity } from './json-task.entity'

// @QueryService(JsonTaskDto)
export class JsonTaskService extends TypeOrmQueryService<JsonTaskDto> {
  constructor(
    // @InjectRepository(JsonTaskEntity)
    repo: Repository<JsonTaskEntity>
  ) {
    super(repo)
  }

  async query(query: Query<JsonTaskDto>, opts?: QueryOptions<JsonTaskDto>): Promise<JsonTaskDto[]> {
    const response = await this.query({
      filter: {
        display: {
          contains: {
            name: 'JsonTask-4'
          }
        }
      }
    })
    console.log(response)

    return response
  }
}
