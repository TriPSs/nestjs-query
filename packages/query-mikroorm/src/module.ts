import { DynamicModule } from '@nestjs/common'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Class } from '@ptc-org/nestjs-query-core'

import { createMikroOrmQueryServiceProviders } from './providers'

export class NestjsQueryMikroOrmModule {
  static forFeature(entities: Class<unknown>[], contextName?: string): DynamicModule {
    const queryServiceProviders = createMikroOrmQueryServiceProviders(entities, contextName)
    const mikroOrmModule = MikroOrmModule.forFeature(entities, contextName)

    return {
      imports: [mikroOrmModule],
      module: NestjsQueryMikroOrmModule,
      providers: [...queryServiceProviders],
      exports: [...queryServiceProviders, mikroOrmModule]
    }
  }
}
