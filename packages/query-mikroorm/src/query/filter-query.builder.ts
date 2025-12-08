import {
  AggregateQuery,
  Filter,
  getFilterFields,
  Paging,
  Query,
  SortDirection,
  SortField,
  SortNulls
} from '@ptc-org/nestjs-query-core'
import { EntityMetadata, EntityProperty, FilterQuery, FindOptions, QueryOrder, QueryOrderMap } from '@mikro-orm/core'

type MikroOrmFilter<Entity> = FilterQuery<Entity>

export class FilterQueryBuilder<Entity extends object> {
  constructor(private readonly metadata: EntityMetadata<Entity>) {}

  buildQuery(query: Query<Entity>): { where: MikroOrmFilter<Entity>; options: FindOptions<Entity> } {
    const where = this.buildFilter(query.filter)
    const options = this.buildFindOptions(query)
    return { where, options }
  }

  buildFilter(filter?: Filter<Entity>): MikroOrmFilter<Entity> {
    if (!filter) {
      return {} as MikroOrmFilter<Entity>
    }
    return this.convertFilter(filter)
  }

  buildFindOptions(query: Query<Entity>): FindOptions<Entity> {
    const options: FindOptions<Entity> = {}

    if (query.paging) {
      this.applyPaging(options, query.paging)
    }

    if (query.sorting && query.sorting.length > 0) {
      options.orderBy = this.buildSorting(query.sorting)
    }

    return options
  }

  private applyPaging(options: FindOptions<Entity>, paging: Paging): void {
    if (paging.limit !== undefined) {
      options.limit = paging.limit
    }
    if (paging.offset !== undefined) {
      options.offset = paging.offset
    }
  }

  buildSorting(sorts: SortField<Entity>[]): QueryOrderMap<Entity>[] {
    return sorts.map((sort) => {
      const field = sort.field as string
      let direction: QueryOrder

      if (sort.direction === SortDirection.ASC) {
        direction = sort.nulls === SortNulls.NULLS_LAST ? QueryOrder.ASC_NULLS_LAST : QueryOrder.ASC_NULLS_FIRST
      } else {
        direction = sort.nulls === SortNulls.NULLS_FIRST ? QueryOrder.DESC_NULLS_FIRST : QueryOrder.DESC_NULLS_LAST
      }

      return { [field]: direction } as QueryOrderMap<Entity>
    })
  }

  private convertFilter(filter: Filter<Entity>): MikroOrmFilter<Entity> {
    const mikroFilter: Record<string, unknown> = {}
    const { and, or, ...fieldFilters } = filter as Filter<Entity> & { and?: Filter<Entity>[]; or?: Filter<Entity>[] }

    if (and && and.length > 0) {
      mikroFilter.$and = and.map((f) => this.convertFilter(f))
    }

    if (or && or.length > 0) {
      mikroFilter.$or = or.map((f) => this.convertFilter(f))
    }

    for (const [field, comparison] of Object.entries(fieldFilters)) {
      if (this.isRelationField(field)) {
        mikroFilter[field] = this.convertFilter(comparison as Filter<unknown>)
      } else {
        const converted = this.convertFieldComparison(comparison as Record<string, unknown>)
        if (Object.keys(converted).length > 0) {
          mikroFilter[field] = converted
        }
      }
    }

    return mikroFilter as MikroOrmFilter<Entity>
  }

  private isRelationField(field: string): boolean {
    const prop = this.metadata.properties[field] as EntityProperty | undefined
    return prop?.kind !== undefined && ['1:1', 'm:1', '1:m', 'm:n'].includes(prop.kind)
  }

  private convertFieldComparison(comparison: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [op, value] of Object.entries(comparison)) {
      const mikroOp = this.mapOperator(op)
      if (mikroOp) {
        result[mikroOp] = value
      }
    }

    return result
  }

  private mapOperator(op: string): string | null {
    const operatorMap: Record<string, string> = {
      eq: '$eq',
      neq: '$ne',
      gt: '$gt',
      gte: '$gte',
      lt: '$lt',
      lte: '$lte',
      in: '$in',
      notIn: '$nin',
      like: '$like',
      notLike: '$not',
      iLike: '$ilike',
      notILike: '$not',
      is: '$eq',
      isNot: '$ne',
      between: '$and'
    }
    return operatorMap[op] || null
  }

  filterHasRelations(filter?: Filter<Entity>): boolean {
    if (!filter) {
      return false
    }
    const filterFields = getFilterFields(filter)
    return filterFields.some((field) => this.isRelationField(field))
  }
}
