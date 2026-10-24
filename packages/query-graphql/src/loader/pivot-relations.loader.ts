import { QueryService } from '@ptc-org/nestjs-query-core'

import { getPivotFilter, pivotEndId, pivotSelectRelations, ResolvedPivot } from '../resolvers/relations/pivot.helpers'
import { NestjsQueryDataloader } from './relations.loader'

export type PivotRelationsArgs<DTO, Node> = { dto: DTO; node: Node }

/**
 * Indexes a pivot record by both ends of the relationship it ties.
 *
 * Serialised rather than joined: a separator can appear inside an id, and `('a|b', 'c')` must not
 * collide with `('a', 'b|c')`.
 */
const pairKey = (parentId: unknown, nodeId: unknown): string => JSON.stringify([parentId, nodeId])

/**
 * Loads the pivot records tying a parent to the nodes of one of its relations.
 *
 * The pivot is queried through its own service, keyed by both ends of the relationship, so nothing
 * has to be declared on the parent entity for the properties to resolve.
 */
export class PivotRelationsLoader<DTO, Node, Pivot> implements NestjsQueryDataloader<
  Pivot,
  PivotRelationsArgs<DTO, Node>,
  Pivot | undefined
> {
  constructor(readonly pivot: ResolvedPivot<Pivot>) {}

  /**
   * Builds the batch function resolving each parent/node pair to the pivot record tying them, if any.
   */
  public createLoader(service: QueryService<Pivot, unknown, unknown>) {
    return async (queryArgs: ReadonlyArray<PivotRelationsArgs<DTO, Node>>): Promise<(Pivot | undefined)[]> => {
      const parentIds = this.unique(queryArgs.map(({ dto }) => this.parentId(dto)))
      const nodeIds = this.unique(queryArgs.map(({ node }) => this.nodeId(node)))

      if (!parentIds.length || !nodeIds.length) {
        return queryArgs.map((): Pivot | undefined => undefined)
      }

      const pivots = await service.query({
        filter: getPivotFilter(this.pivot, parentIds, nodeIds),
        relations: pivotSelectRelations(this.pivot)
      })

      const index = new Map<string, Pivot>(
        pivots.map((pivot) => [pairKey(pivotEndId(pivot, this.pivot.parent), pivotEndId(pivot, this.pivot.node)), pivot])
      )

      return queryArgs.map(({ dto, node }) => index.get(pairKey(this.parentId(dto), this.nodeId(node))))
    }
  }

  /**
   * The id the parent DTO carries for its end of the relationship.
   */
  private parentId(dto: DTO): unknown {
    return (dto as Record<string, unknown>)[this.pivot.parent.idField]
  }

  /**
   * The id the node carries for its end of the relationship.
   */
  private nodeId(node: Node): unknown {
    return (node as Record<string, unknown>)[this.pivot.node.idField]
  }

  /**
   * The distinct ids to query for, dropping the ends that were never loaded.
   */
  private unique(ids: unknown[]): unknown[] {
    return [...new Set(ids.filter((id) => id !== undefined && id !== null))]
  }
}
