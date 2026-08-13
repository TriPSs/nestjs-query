import { Query } from '@ptc-org/nestjs-query-core'

import { Count, Pager, QueryMany } from '../../interfaces'
import { OffsetPagerResult, OffsetPagingMeta, OffsetPagingOpts, QueryResults } from './interfaces'

const createEmptyPageResult = <DTO>(): OffsetPagerResult<DTO> => ({
  nodes: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false },
  totalCount: undefined
})

const createDefaultPagingMeta = <DTO>(query: Query<DTO>): OffsetPagingMeta<DTO> => ({
  opts: { offset: 0, limit: 0 },
  query
})

export class OffsetPager<DTO> implements Pager<DTO, OffsetPagerResult<DTO>> {
  public async page<Q extends Query<DTO>>(
    queryMany: QueryMany<DTO, Q>,
    query: Q,
    count?: Count<DTO>
  ): Promise<OffsetPagerResult<DTO>> {
    const pagingMeta = this.getPageMeta(query)
    if (!this.isValidPaging(pagingMeta)) {
      return createEmptyPageResult()
    }
    const results = await this.runQuery(queryMany, query, pagingMeta)
    return this.createPagingResult(results, pagingMeta, await count?.(query.filter))
  }

  private isValidPaging(pagingMeta: OffsetPagingMeta<DTO>): boolean {
    return pagingMeta.opts.limit > 0
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

  private getPageMeta(query: Query<DTO>): OffsetPagingMeta<DTO> {
    const { limit = 25, offset = 0 } = query.paging ?? {}
    if (!limit) {
      return createDefaultPagingMeta(query)
    }
    return { opts: { limit, offset }, query }
  }

  private createPagingResult(
    results: QueryResults<DTO>,
    pagingMeta: OffsetPagingMeta<DTO>,
    totalCount?: number
  ): OffsetPagerResult<DTO> {
    const { nodes, hasExtraNode } = results
    const pageInfo = {
      hasNextPage: hasExtraNode,
      // we have a previous page if we are going backwards and have an extra node.
      hasPreviousPage: pagingMeta.opts.offset > 0
    }

    return { nodes, pageInfo, totalCount }
  }

  private createQuery<Q = Query<DTO>>(query: Q, pagingMeta: OffsetPagingMeta<DTO>): Q {
    const { limit, offset } = pagingMeta.opts
    return { ...query, paging: { limit: limit + 1, offset } }
  }

  private checkForExtraNode(nodes: DTO[], opts: OffsetPagingOpts): DTO[] {
    const returnNodes = [...nodes]
    const hasExtraNode = nodes.length > opts.limit
    if (hasExtraNode) {
      returnNodes.pop()
    }
    return returnNodes
  }
}
