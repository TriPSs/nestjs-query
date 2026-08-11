import { Filter, mergeFilter, QueryService } from '@ptc-org/nestjs-query-core'

import { pivotEndFilter, pivotEndId, pivotSelectRelations, ResolvedPivot } from '../resolvers/relations/pivot.helpers'
import { NestjsQueryDataloader } from './relations.loader'

export type PivotFilterArgs<DTO, Pivot> = { dto: DTO; filter: Filter<Pivot> }

/**
 * Resolves which nodes of a relation satisfy a filter on the properties of the relationship.
 *
 * The filter is always anchored to the parent, so it answers "the groups where *this user* is an
 * owner", not "the groups that have any owner".
 */
export class PivotFilterLoader<DTO, Pivot> implements NestjsQueryDataloader<Pivot, PivotFilterArgs<DTO, Pivot>, unknown[]> {
  constructor(readonly pivot: ResolvedPivot<Pivot>) {}

  public createLoader(service: QueryService<Pivot, unknown, unknown>) {
    return async (queryArgs: ReadonlyArray<PivotFilterArgs<DTO, Pivot>>): Promise<unknown[][]> => {
      const results: unknown[][] = []

      // Parents asking the same question are answered by a single query.
      await Promise.all(
        [...this.groupByFilter(queryArgs).values()].map(async (args) => {
          const { filter } = args[0]
          const parentIds = [...new Set(args.map(({ dto }) => this.parentId(dto)))]

          const pivots = await service.query({
            filter: mergeFilter(pivotEndFilter<Pivot>(this.pivot.parent, parentIds), filter),
            relations: pivotSelectRelations(this.pivot)
          })

          const byParent = new Map<string, unknown[]>()
          pivots.forEach((pivot) => {
            const parentId = String(pivotEndId(pivot, this.pivot.parent))
            byParent.set(parentId, [...(byParent.get(parentId) ?? []), pivotEndId(pivot, this.pivot.node)])
          })

          args.forEach(({ dto, index }) => {
            results[index] = byParent.get(String(this.parentId(dto))) ?? []
          })
        })
      )

      return results
    }
  }

  private parentId(dto: DTO): unknown {
    return (dto as Record<string, unknown>)[this.pivot.parent.idField]
  }

  private groupByFilter(
    queryArgs: ReadonlyArray<PivotFilterArgs<DTO, Pivot>>
  ): Map<string, (PivotFilterArgs<DTO, Pivot> & { index: number })[]> {
    return queryArgs.reduce((map, args, index) => {
      const filterJson = JSON.stringify(args.filter)
      if (!map.has(filterJson)) {
        map.set(filterJson, [])
      }
      map.get(filterJson).push({ ...args, index })
      return map
    }, new Map<string, (PivotFilterArgs<DTO, Pivot> & { index: number })[]>())
  }
}
