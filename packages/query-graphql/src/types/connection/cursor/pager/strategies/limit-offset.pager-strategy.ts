import { Query } from '@ptc-org/nestjs-query-core'

import { CursorPagingType } from '../../../../query'
import { decodeBase64, encodeBase64, hasBeforeCursor, isBackwardPaging, isForwardPaging } from './helpers'
import { OffsetPagingOpts, PagerStrategy } from './pager-strategy'

export class LimitOffsetPagerStrategy<DTO> implements PagerStrategy<DTO> {
  constructor(private readonly enableFetchAllWithNegative?: boolean) {}

  private static CURSOR_PREFIX = 'arrayconnection:'

  toCursor(dto: DTO, index: number, pagingOpts: OffsetPagingOpts): string {
    return LimitOffsetPagerStrategy.offsetToCursor(pagingOpts.offset + index)
  }

  fromCursorArgs(cursor: CursorPagingType): OffsetPagingOpts {
    const isForward = isForwardPaging(cursor)
    const isBackward = isBackwardPaging(cursor)
    const hasBefore = hasBeforeCursor(cursor)
    return { limit: this.getLimit(cursor), offset: this.getOffset(cursor), isForward, isBackward, hasBefore }
  }

  isEmptyCursor(opts: OffsetPagingOpts): boolean {
    return opts.offset === 0
  }

  createQuery<Q extends Query<DTO>>(query: Q, opts: OffsetPagingOpts, includeExtraNode: boolean): Q {
    const { isBackward } = opts
    const paging = { limit: opts.limit, offset: opts.offset }
    if (includeExtraNode && (!this.enableFetchAllWithNegative || opts.limit !== -1)) {
      // Add 1 to the limit so we will fetch an additional node
      paging.limit += 1
      // if paging backwards, remove one from the offset to check for a previous page.
      if (isBackward) {
        paging.offset -= 1
      }
      if (paging.offset < 0) {
        // if the offset is < 0, it means we underflow and that we can't have an extra page.
        paging.offset = 0
        paging.limit = opts.limit
      }
    }

    if (this.enableFetchAllWithNegative && paging.limit === -1) {
      delete paging.limit

      // Delete the offset if it is 0.
      if (paging.offset === 0) {
        delete paging.offset
      }
    }

    return { ...query, paging }
  }

  checkForExtraNode(nodes: DTO[], opts: OffsetPagingOpts): DTO[] {
    if (opts.limit === -1) {
      // If we are fetching all the nodes we don't need to check for an extra node.
      return nodes
    }
    const returnNodes = [...nodes]
    // check if we have an additional node
    // if paging forward that indicates we have a next page
    // if paging backward that indicates we have a previous page.
    const hasExtraNode = nodes.length > opts.limit
    if (hasExtraNode) {
      // remove the additional node so its not returned in the results.
      if (opts.isForward) {
        returnNodes.pop()
      } else {
        returnNodes.shift()
      }
    }
    return returnNodes
  }

  private getLimit(cursor: CursorPagingType): number | null {
    if (isBackwardPaging(cursor)) {
      const { last = 0, before } = cursor
      const offsetFromCursor = before ? LimitOffsetPagerStrategy.cursorToOffset(before) : 0
      if (this.enableFetchAllWithNegative && last === -1) return offsetFromCursor
      const offset = offsetFromCursor - last
      // Check to see if our before-page is underflowing past the 0th item
      if (offset < 0) {
        // Adjust the limit with the underflow value
        return Math.max(last + offset, 0)
      }
      return last
    }
    return cursor.first ?? 0
  }

  private getOffset(cursor: CursorPagingType): number {
    if (isBackwardPaging(cursor)) {
      if (this.enableFetchAllWithNegative && cursor.last === -1) return 0
      const { last, before } = cursor
      const beforeOffset = before ? LimitOffsetPagerStrategy.cursorToOffset(before) : 0
      const offset = last ? beforeOffset - last : 0

      // Check to see if our before-page is underflowing past the 0th item
      return Math.max(offset, 0)
    }
    const { after } = cursor
    const offset = after ? LimitOffsetPagerStrategy.cursorToOffset(after) + 1 : 0
    return Math.max(offset, 0)
  }

  private static offsetToCursor(offset: number): string {
    return encodeBase64(`${this.CURSOR_PREFIX}${String(offset)}`)
  }

  private static cursorToOffset(cursor: string): number {
    return parseInt(decodeBase64(cursor).substring(this.CURSOR_PREFIX.length), 10)
  }
}
