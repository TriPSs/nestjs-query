import { FactoryProvider } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Class, getQueryServiceToken } from '@ptc-org/nestjs-query-core'

import type { DataSource, Repository } from 'typeorm'

import { TypeOrmQueryService } from './services'

function createTypeOrmQueryServiceProvider<Entity>(
  EntityClass: Class<Entity>,
  dataSource?: DataSource | string
): FactoryProvider {
  return {
    provide: getQueryServiceToken(EntityClass),
    useFactory(repo: Repository<Entity>) {
      return new TypeOrmQueryService(repo)
    },
    inject: [getRepositoryToken(EntityClass, dataSource)]
  }
}

export const createTypeOrmQueryServiceProviders = (
  entities: Class<unknown>[],
  dataSource?: DataSource | string
): FactoryProvider[] => entities.map((entity) => createTypeOrmQueryServiceProvider(entity, dataSource))
