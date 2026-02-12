import { Class, MapReflector, Query } from '@ptc-org/nestjs-query-core'

import { QueryMany, StaticConnectionType } from './interfaces'
import { NonePagingQueryArgsTypeOpts, PagingStrategies } from '../types'

const reflector = new MapReflector('nestjs-query:array-connection-type')

export function getOrCreateArrayConnectionType<DTO>(
  TItemClass: Class<DTO>,
  opts: NonePagingQueryArgsTypeOpts<DTO>
): StaticConnectionType<DTO, PagingStrategies.NONE> {
  const connectionName = opts?.connectionName || `${TItemClass.name}Connection`

  return reflector.memoize(TItemClass, connectionName, () => {
    class AbstractConnection extends Array<DTO> {
      static async createFromPromise<Q extends Query<DTO>>(queryMany: QueryMany<DTO, Q>, query: Q): Promise<AbstractConnection> {
        // remove paging from the query because the ArrayConnection does not support paging.
        const { paging, ...rest } = query
        return queryMany(rest as Q)
      }
    }

    Object.defineProperty(AbstractConnection, 'name', { value: connectionName, writable: false })

    return AbstractConnection
  })
}
