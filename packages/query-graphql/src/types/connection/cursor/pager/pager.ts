import { Query } from '@ptc-org/nestjs-query-core'

import { CursorQueryArgsType } from '../../../query'
import { Count, EdgeType, Pager, QueryMany } from '../../interfaces'
import { CursorPagerResult, PagingMeta, QueryResults } from './interfaces'
import { CursorPagingOpts, OffsetPagingOpts, PagerStrategy } from './strategies'

const EMPTY_PAGING_RESULTS = <DTO>(): CursorPagerResult<DTO> => ({
  edges: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false },
  totalCount: () => Promise.resolve(0)
})

const DEFAULT_PAGING_META = <DTO>(query: Query<DTO>): PagingMeta<DTO, OffsetPagingOpts> => ({
  opts: { offset: 0, limit: 0, isBackward: false, isForward: true, hasBefore: false },
  query
})

export class CursorPager<DTO> implements Pager<DTO, CursorPagerResult<DTO>> {
  constructor(
    readonly strategy: PagerStrategy<DTO>,
    private readonly enableFetchAllWithNegative?: boolean
  ) {}

  async page<Q extends CursorQueryArgsType<DTO>>(
    queryMany: QueryMany<DTO, Q>,
    query: Q,
    count: Count<DTO>
  ): Promise<CursorPagerResult<DTO>> {
    const pagingMeta = this.getPageMeta(query)
    if (!this.isValidPaging(pagingMeta)) {
      return EMPTY_PAGING_RESULTS()
    }
    const results = await this.runQuery(queryMany, query, pagingMeta)
    if (this.isEmptyPage(results, pagingMeta)) {
      return EMPTY_PAGING_RESULTS()
    }
    return this.createPagingResult(results, pagingMeta, () => count(query.filter ?? {}))
  }

  private isValidPaging(pagingMeta: PagingMeta<DTO, CursorPagingOpts<DTO>>): boolean {
    const minimumLimit = this.enableFetchAllWithNegative ? -1 : 1
    const hasLimit = 'limit' in pagingMeta.opts && pagingMeta.opts.limit !== null
    const isValidLimit = pagingMeta.opts.limit >= minimumLimit
    if (hasLimit && !isValidLimit) {
      return false
    }

    if ('offset' in pagingMeta.opts) {
      return pagingMeta.opts.offset > 0 || hasLimit
    }
    return hasLimit
  }

  private async runQuery<Q extends Query<DTO>>(
    queryMany: QueryMany<DTO, Q>,
    query: Q,
    pagingMeta: PagingMeta<DTO, CursorPagingOpts<DTO>>
  ): Promise<QueryResults<DTO>> {
    const { opts } = pagingMeta
    const windowedQuery = this.strategy.createQuery(query, opts, true)
    const nodes = await queryMany(windowedQuery)
    const returnNodes = this.strategy.checkForExtraNode(nodes, opts)
    const hasExtraNode = returnNodes.length !== nodes.length
    return { nodes: returnNodes, hasExtraNode }
  }

  private getPageMeta(query: CursorQueryArgsType<DTO>): PagingMeta<DTO, CursorPagingOpts<DTO>> {
    const { paging } = query
    if (!paging) {
      return DEFAULT_PAGING_META(query)
    }
    return { opts: this.strategy.fromCursorArgs(paging), query }
  }

  private createPagingResult(
    results: QueryResults<DTO>,
    pagingMeta: PagingMeta<DTO, CursorPagingOpts<DTO>>,
    totalCount: () => Promise<number>
  ): CursorPagerResult<DTO> {
    const { nodes, hasExtraNode } = results
    const { isForward, hasBefore } = pagingMeta.opts
    const edges: EdgeType<DTO>[] = nodes.map((node, i) => ({
      node,
      cursor: this.strategy.toCursor(node, i, pagingMeta.opts, pagingMeta.query)
    }))
    const pageInfo = {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      // if we re paging forward and have an extra node we have more pages to load. Or there we know that we have a before cursor, thus we have next page
      hasNextPage: isForward ? hasExtraNode : hasBefore,
      // we have a previous page if we are going backwards and have an extra node.
      hasPreviousPage: this.hasPreviousPage(results, pagingMeta)
    }

    return { edges, pageInfo, totalCount }
  }

  private hasPreviousPage(results: QueryResults<DTO>, pagingMeta: PagingMeta<DTO, CursorPagingOpts<DTO>>): boolean {
    const { hasExtraNode } = results
    const { opts } = pagingMeta
    return opts.isBackward ? hasExtraNode : !this.strategy.isEmptyCursor(opts)
  }

  /**
   * @description
   * It is an empty page if:
   *
   * 1. We don't have an extra node.
   * 2. There were no nodes returned.
   * 3. We're paging forward.
   * 4. And we don't have an offset.
   */
  private isEmptyPage(results: QueryResults<DTO>, pagingMeta: PagingMeta<DTO, CursorPagingOpts<DTO>>): boolean {
    const { opts } = pagingMeta
    const isEmpty = !results.hasExtraNode && !results.nodes.length && pagingMeta.opts.isForward
    return isEmpty && this.strategy.isEmptyCursor(opts)
  }
}
