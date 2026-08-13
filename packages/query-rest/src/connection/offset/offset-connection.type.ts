import { Class, MapReflector, Query } from '@ptc-org/nestjs-query-core'
import { plainToInstance } from 'class-transformer'

import { Field } from '../../decorators'
import { OffsetQueryArgsTypeOpts, PagingStrategies } from '../../types/query'
import { Count, OffsetConnectionType, OffsetPageInfoType, QueryMany, StaticConnectionType } from '../interfaces'
import { getOrCreateOffsetPageInfoType } from './offset-page-info.type'
import { OffsetPager } from './pager'

const reflector = new MapReflector('nestjs-query:offset-connection-type')

export function getOrCreateOffsetConnectionType<DTO>(
  TItemClass: Class<DTO>,
  opts: OffsetQueryArgsTypeOpts<DTO>
): StaticConnectionType<DTO, PagingStrategies.OFFSET> {
  const connectionName = opts?.connectionName || `${TItemClass.name}OffsetConnection`

  return reflector.memoize(TItemClass, connectionName, () => {
    const PIT = getOrCreateOffsetPageInfoType()
    const pager = new OffsetPager<DTO>()

    class OffsetConnection implements OffsetConnectionType<DTO> {
      public static async createFromPromise<Q extends Query<DTO>>(
        queryMany: QueryMany<DTO, Q>,
        query: Query<DTO>,
        count?: Count<DTO>
      ): Promise<OffsetConnection> {
        const { pageInfo, nodes, totalCount } = await pager.page(queryMany, query, count)

        return new OffsetConnection(new PIT(pageInfo.hasNextPage, pageInfo.hasPreviousPage), nodes, totalCount)
      }

      constructor(pageInfo?: OffsetPageInfoType, nodes?: DTO[], totalCount?: number) {
        this.pageInfo = pageInfo ?? { hasNextPage: false, hasPreviousPage: false }
        this.nodes = plainToInstance(TItemClass, nodes ?? [], { excludeExtraneousValues: true })
        this.totalCount = totalCount
      }

      @Field(() => PIT, {
        description: 'Paging information'
      })
      public pageInfo!: OffsetPageInfoType

      @Field({
        description: 'Total amount of records.'
      })
      public totalCount?: number

      @Field(() => [TItemClass], {
        description: 'Array of nodes.'
      })
      public nodes!: DTO[]
    }

    Object.defineProperty(OffsetConnection, 'name', { value: connectionName, writable: false })

    return OffsetConnection
  })
}
