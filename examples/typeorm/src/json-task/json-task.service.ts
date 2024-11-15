import { InjectQueryService, NoOpQueryService, Query, QueryOptions, QueryService } from '@souagrosolucoes/nestjs-query-core'

import { JsonTaskDto } from './dto/json-task.dto'
import { JsonTaskEntity } from './json-task.entity'

export class JsonTaskService extends NoOpQueryService<JsonTaskDto, JsonTaskEntity> {
  constructor(@InjectQueryService(JsonTaskEntity) private readonly queryService: QueryService<JsonTaskEntity>) {
    super()
  }

  async query(query: Query<JsonTaskDto>, opts?: QueryOptions<JsonTaskDto>): Promise<JsonTaskDto[]> {
    console.log(query)
    const response = await this.queryService.query({
      // filter: {
      //   display: {
      //     contains: { name: 'JsonTask-4' }
      //   }
      // }
      filter: query.filter
    })

    return response
  }
}
