import { FactoryProvider } from '@nestjs/common'
import { getRepositoryToken } from '@mikro-orm/nestjs'
import { Class, getQueryServiceToken } from '@ptc-org/nestjs-query-core'
import { EntityRepository } from '@mikro-orm/core'

import { MikroOrmQueryService } from './services'

function createMikroOrmQueryServiceProvider<Entity extends object>(
  EntityClass: Class<Entity>,
  contextName?: string
): FactoryProvider {
  return {
    provide: getQueryServiceToken(EntityClass),
    useFactory(repo: EntityRepository<Entity>) {
      return new MikroOrmQueryService(repo)
    },
    inject: [getRepositoryToken(EntityClass, contextName)]
  }
}

export const createMikroOrmQueryServiceProviders = (
  entities: Class<unknown>[],
  contextName?: string
): FactoryProvider[] =>
  entities.map((entity) => createMikroOrmQueryServiceProvider(entity as Class<object>, contextName))
