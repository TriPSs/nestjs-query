import { Query } from '@ptc-org/nestjs-query-core'

import { OffsetQueryArgsType } from '../../../query'
import { Count, Pager, QueryMany } from '../../interfaces'
import { OffsetPagerResult, OffsetPagingMeta, OffsetPagingOpts, QueryResults } from './interfaces'

const EMPTY_PAGING_RESULTS = <DTO>(): OffsetPagerResult<DTO> => ({
  nodes: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false },
  totalCount: () => Promise.resolve(0)
})

const DEFAULT_PAGING_META = <DTO>(query: Query<DTO>): OffsetPagingMeta<DTO> => ({
  opts: { offset: 0, limit: 0 },
  query
})

export class OffsetPager<DTO> implements Pager<DTO, OffsetPagerResult<DTO>> {
  constructor(private readonly enableFetchAllWithNegative?: boolean) {}

  async page<Q extends Query<DTO>>(queryMany: QueryMany<DTO, Q>, query: Q, count: Count<DTO>): Promise<OffsetPagerResult<DTO>> {
    const pagingMeta = this.getPageMeta(query)
    if (!this.isValidPaging(pagingMeta)) {
      return EMPTY_PAGING_RESULTS()
    }
    const results = await this.runQuery(queryMany, query, pagingMeta)
    return this.createPagingResult(results, pagingMeta, () => count(query.filter ?? {}))
  }

  private isValidPaging(pagingMeta: OffsetPagingMeta<DTO>): boolean {
    return pagingMeta.opts.limit >= (this.enableFetchAllWithNegative ? -1 : 1)
  }

  private async runQuery<Q extends Query<DTO>>(
    queryMany: QueryMany<DTO, Q>,
    query: Q,
    pagingMeta: OffsetPagingMeta<DTO>
  ): Promise<QueryResults<DTO>> {
    const windowedQuery = this.createQuery(query, pagingMeta)
    const nodes = await queryMany(windowedQuery)
    const returnNodes = this.checkForExtraNode(nodes, pagingMeta.opts)
    const hasExtraNode = returnNodes.length !== nodes.length
    return { nodes: returnNodes, hasExtraNode }
  }

  private getPageMeta(query: OffsetQueryArgsType<DTO>): OffsetPagingMeta<DTO> {
    const { limit = 0, offset = 0 } = query.paging ?? {}
    if (!limit) {
      return DEFAULT_PAGING_META(query)
    }
    return { opts: { limit, offset }, query }
  }

  private createPagingResult(
    results: QueryResults<DTO>,
    pagingMeta: OffsetPagingMeta<DTO>,
    totalCount: () => Promise<number>
  ): OffsetPagerResult<DTO> {
    const { nodes, hasExtraNode } = results
    const pageInfo = {
      hasNextPage: hasExtraNode,
      // we have a previous page if we are going backwards and have an extra node.
      hasPreviousPage: pagingMeta.opts.offset > 0
    }

    return { nodes, pageInfo, totalCount }
  }

  private createQuery<Q extends OffsetQueryArgsType<DTO>>(query: Q, pagingMeta: OffsetPagingMeta<DTO>): Q {
    const { limit, offset } = pagingMeta.opts
    const paging = { limit: limit + 1, offset }

    if (this.enableFetchAllWithNegative && limit === -1) {
      delete paging.limit

      // Delete the offset if it is 0.
      if (offset === 0) {
        delete paging.offset
      }
    }

    return { ...query, paging }
  }

  private checkForExtraNode(nodes: DTO[], opts: OffsetPagingOpts): DTO[] {
    if (this.enableFetchAllWithNegative && opts.limit === -1) return nodes
    const returnNodes = [...nodes]
    const hasExtraNode = nodes.length > opts.limit
    if (hasExtraNode) {
      returnNodes.pop()
    }
    return returnNodes
  }
}
