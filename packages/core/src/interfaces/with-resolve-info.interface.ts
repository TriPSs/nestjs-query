import { QueryResolveTree } from '@ptc-org/nestjs-query-core'

export interface WithResolveInfo<DTO> {
  /**
   * Complete GraphQL resolve tree of the request
   */
  resolveInfo?: QueryResolveTree<DTO>
}
