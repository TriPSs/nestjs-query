import { Logger } from '@nestjs/common'
import { Class, Filter, QueryService } from '@ptc-org/nestjs-query-core'

import { NestjsQueryDataloader } from './relations.loader'

export type ReferenceArgs = {
  [key: string]: string | number
}

export class ReferenceLoader<DTO> implements NestjsQueryDataloader<DTO, ReferenceArgs, DTO | undefined | Error> {
  private readonly logger = new Logger(ReferenceLoader.name)

  constructor(readonly DTOClass: Class<DTO>) {}

  public createLoader(service: QueryService<DTO, unknown, unknown>, key = 'id') {
    return async (args: ReadonlyArray<ReferenceArgs>): Promise<(DTO | undefined | Error)[]> => {
      // Deduplicate IDs while preserving original order mapping
      const uniqueIds = [...new Set(args.map((arg) => arg[key]))]

      try {
        const filter = { [key]: { in: uniqueIds } } as unknown as Filter<DTO>
        const entities = await service.query({ filter })

        // Create entity map for efficient lookup
        // Use string keys because representation.id from federation may differ in type from entity.id
        const entityMap = new Map<string, DTO>()
        entities?.forEach((entity) => {
          const id = (entity as Record<string, unknown>)[key]
          entityMap.set(String(id), entity)
        })

        // Return results in the same order as requested
        const results = args.map((arg) => {
          const entity = entityMap.get(String(arg[key]))
          if (!entity) {
            this.logger.warn(`Entity not found for ${key}: ${arg[key]} in ${this.DTOClass.name}`)
          }
          return entity || undefined
        })

        return results
      } catch (error) {
        this.logger.error(`Batch query failed for ${this.DTOClass.name} with key ${key}:`, error)
        // Return error for each request, let DataLoader handle it
        return args.map(() => (error instanceof Error ? error : new Error(String(error))))
      }
    }
  }
}
