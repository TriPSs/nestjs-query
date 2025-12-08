import { MikroOrmModule } from '@mikro-orm/nestjs'
import { DynamicModule } from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'

import { createMikroOrmQueryServiceProviders, EntityServiceOptions } from './providers'

export class NestjsQueryMikroOrmModule {
  static forFeature(entities: Array<Class<object> | EntityServiceOptions>, dataSource?: string): DynamicModule {
    const queryServiceProviders = createMikroOrmQueryServiceProviders(entities, dataSource)
    const entityClasses = entities.map((e) => (typeof e === 'object' && 'entity' in e ? e.entity : e))
    const mikroOrmModule = MikroOrmModule.forFeature(entityClasses, dataSource)

    return {
      imports: [mikroOrmModule],
      module: NestjsQueryMikroOrmModule,
      providers: queryServiceProviders,
      exports: [...queryServiceProviders, mikroOrmModule]
    }
  }
}
