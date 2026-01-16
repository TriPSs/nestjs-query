import { ExecutionContext } from '@nestjs/common'
import Dataloader from 'dataloader'

import { DataLoaderOptions } from '../pipes/inject-data-loader-config.pipe'

const cacheKeyFn = <K>(key: K): string =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  JSON.stringify(key, (_, v) => (typeof v === 'bigint' ? v.toString() : v))

export interface NestjsQueryExecutionContext extends ExecutionContext {
  nestjsQueryLoaders?: Record<string, Dataloader<unknown, unknown>>
}

export class DataLoaderFactory {
  private static initializeContext(context: NestjsQueryExecutionContext): Record<string, Dataloader<unknown, unknown>> {
    if (!context.nestjsQueryLoaders) {
      // eslint-disable-next-line no-param-reassign
      context.nestjsQueryLoaders = {}
    }

    return context.nestjsQueryLoaders
  }

  static getOrCreateLoader<K, V>(
    context: NestjsQueryExecutionContext,
    name: string,
    createHandler: () => Dataloader.BatchLoadFn<K, V>,
    options?: DataLoaderOptions
  ): Dataloader<K, V> {
    const nestjsQueryLoaders = this.initializeContext(context)

    if (!nestjsQueryLoaders[name]) {
      const handler = createHandler()
      const dataLoaderOptions = {
        cacheKeyFn,
        // Ensure batching and caching are enabled
        batch: true,
        cache: true,
        ...options
      }

      // eslint-disable-next-line no-param-reassign
      nestjsQueryLoaders[name] = new Dataloader<K, V, string>(handler, dataLoaderOptions)
    }

    return nestjsQueryLoaders[name] as Dataloader<K, V>
  }
}
