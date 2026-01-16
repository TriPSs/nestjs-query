import { EntityRepository } from '@mikro-orm/core'
import { getRepositoryToken } from '@mikro-orm/nestjs'
import { FactoryProvider } from '@nestjs/common'
import { Assembler, AssemblerFactory, Class, getQueryServiceToken } from '@souagrosolucoes/nestjs-query-core'

import { MikroOrmQueryService } from './services'

export interface EntityServiceOptions<DTO extends object = object, Entity extends object = object> {
  entity: Class<Entity>
  dto?: Class<DTO>
  assembler?: Class<Assembler<DTO, Entity>>
}

function createMikroOrmQueryServiceProvider<DTO extends object = object, Entity extends object = DTO>(
  EntityClass: Class<Entity>,
  DTOClass?: Class<DTO>,
  AssemblerClass?: Class<Assembler<DTO, Entity>>,
  dataSource?: string
): FactoryProvider {
  return {
    provide: getQueryServiceToken(DTOClass ?? EntityClass),
    useFactory(repo: EntityRepository<Entity>) {
      if (AssemblerClass) {
        const assembler = new AssemblerClass()
        return new MikroOrmQueryService(repo, assembler)
      }

      if (DTOClass) {
        const assembler = AssemblerFactory.getAssembler(DTOClass, EntityClass)
        if (assembler) {
          return new MikroOrmQueryService(repo, assembler)
        }
      }

      return new MikroOrmQueryService(repo)
    },
    inject: [getRepositoryToken(EntityClass, dataSource)]
  }
}

export function createMikroOrmQueryServiceProviders(
  options: Array<Class<object> | EntityServiceOptions>,
  dataSource?: string
): FactoryProvider[] {
  return options.map((option) => {
    if (typeof option === 'object' && 'entity' in option) {
      return createMikroOrmQueryServiceProvider(option.entity, option.dto, option.assembler, dataSource)
    }
    return createMikroOrmQueryServiceProvider(option, undefined, undefined, dataSource)
  })
}
