import { Provider } from '@nestjs/common'
import {
  AssemblerFactory,
  AssemblerQueryService,
  Class,
  DeepPartial,
  getQueryServiceToken,
  QueryService
} from '@ptc-org/nestjs-query-core'

export interface QueryServiceOpts<DTO, Entity> {
  DTOClass: Class<DTO>
  EntityClass: Class<Entity>
}

/**
 * Registers the `QueryService` of a DTO that has no resolver of its own.
 *
 * Pivot DTOs are the typical case: their properties are read and written through the relation they
 * belong to, so they need a service but no endpoints.
 */
function createQueryServiceProvider<DTO, Entity extends DeepPartial<Entity>>({
  DTOClass,
  EntityClass
}: QueryServiceOpts<DTO, Entity>): Provider {
  return {
    provide: getQueryServiceToken(DTOClass),
    useFactory(entityService: QueryService<Entity, unknown, unknown>) {
      return new AssemblerQueryService(AssemblerFactory.getAssembler(DTOClass, EntityClass), entityService)
    },
    inject: [getQueryServiceToken(EntityClass)]
  }
}

export const createQueryServiceProviders = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts: QueryServiceOpts<any, any>[]
): Provider[] => opts.map((opt) => createQueryServiceProvider(opt))
