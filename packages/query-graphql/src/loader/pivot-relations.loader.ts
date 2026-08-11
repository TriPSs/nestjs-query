import { QueryService } from '@ptc-org/nestjs-query-core'

import { getPivotFilter, pivotEndId, ResolvedPivot } from '../resolvers/relations/pivot.helpers'
import { NestjsQueryDataloader } from './relations.loader'

export type PivotRelationsArgs<DTO, Node> = { dto: DTO; node: Node }

const pairKey = (parentId: unknown, nodeId: unknown): string => `${String(parentId)}|${String(nodeId)}`

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

  public createLoader(service: QueryService<Pivot, unknown, unknown>) {
    return async (queryArgs: ReadonlyArray<PivotRelationsArgs<DTO, Node>>): Promise<(Pivot | undefined)[]> => {
      const parentIds = this.unique(queryArgs.map(({ dto }) => this.parentId(dto)))
      const nodeIds = this.unique(queryArgs.map(({ node }) => this.nodeId(node)))

      if (!parentIds.length || !nodeIds.length) {
        return queryArgs.map((): Pivot | undefined => undefined)
      }

      const pivots = await service.query({ filter: getPivotFilter(this.pivot, parentIds, nodeIds) })

      const index = new Map<string, Pivot>(
        pivots.map((pivot) => [pairKey(pivotEndId(pivot, this.pivot.parent), pivotEndId(pivot, this.pivot.node)), pivot])
      )

      return queryArgs.map(({ dto, node }) => index.get(pairKey(this.parentId(dto), this.nodeId(node))))
    }
  }

  private parentId(dto: DTO): unknown {
    return (dto as Record<string, unknown>)[this.pivot.parent.idField]
  }

  private nodeId(node: Node): unknown {
    return (node as Record<string, unknown>)[this.pivot.node.idField]
  }

  private unique(ids: unknown[]): unknown[] {
    return [...new Set(ids.filter((id) => id !== undefined && id !== null))]
  }
}
