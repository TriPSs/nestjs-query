import { Class, Filter, QueryService } from '@ptc-org/nestjs-query-core'

import { NestjsQueryDataloader } from './relations.loader'

export type ReferenceArgs = {
  id: string | number
}

export class ReferenceLoader<DTO> implements NestjsQueryDataloader<DTO, ReferenceArgs, DTO | undefined | Error> {
  constructor(readonly DTOClass: Class<DTO>) {}

  public createLoader(service: QueryService<DTO, unknown, unknown>) {
    return async (args: ReadonlyArray<ReferenceArgs>): Promise<(DTO | undefined | Error)[]> => {
      // Extract all unique IDs from the batch
      const ids = args.map((arg) => arg.id)

      // Use batch query to fetch all entities at once
      const entities = await service.query({
        filter: { id: { in: ids } } as unknown as Filter<DTO>
      })

      // Create a map for fast lookup by ID
      const entityMap = new Map<string | number, DTO>()
      if (entities) {
        entities.forEach((entity) => {
          const id = (entity as Record<string, unknown>).id as string | number
          entityMap.set(id, entity)
        })
      }

      // Return results in the same order as requested
      return args.map((arg) => entityMap.get(arg.id) || undefined)
    }
  }
}
