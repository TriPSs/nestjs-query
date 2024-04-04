import { QueryResolveTree } from './query-resolve-info.interface'

export interface WithResolveInfo<DTO> {
  /**
   * Complete GraphQL resolve tree of the request
   */
  resolveInfo?: QueryResolveTree<DTO>
}
