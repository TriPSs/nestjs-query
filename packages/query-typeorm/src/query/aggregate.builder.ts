import { BadRequestException } from '@nestjs/common'
import {
  AggregateFields,
  AggregateQuery,
  AggregateResponse,
  FilterFieldComparison,
  HavingFilter
} from '@rezonate/nestjs-query-core'
import { camelCase } from 'camel-case'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { EntityComparisonField, SQLComparisonBuilder } from './sql-comparison.builder'

enum AggregateFuncs {
  AVG = 'AVG',
  SUM = 'SUM',
  COUNT = 'COUNT',
  DISTINCT_COUNT = 'DISTINCT_COUNT',
  MAX = 'MAX',
  MIN = 'MIN'
}

const AGG_REGEXP = /(AVG|SUM|COUNT|DISTINCT_COUNT|MAX|MIN|GROUP_BY)_(.*)/

/**
 * @internal
 * Builds a WHERE clause from a Filter.
 */
export class AggregateBuilder<Entity> {
  constructor(
    readonly repo: Repository<Entity>,
    readonly sqlComparisonBuilder: SQLComparisonBuilder<Entity> = new SQLComparisonBuilder<Entity>()
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-shadow
  public static async asyncConvertToAggregateResponse<Entity>(
    responsePromise: Promise<Record<string, unknown>[]>
  ): Promise<AggregateResponse<Entity>[]> {
    const aggResponse = await responsePromise
    return this.convertToAggregateResponse(aggResponse)
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  public static getAggregateSelects<Entity>(query: AggregateQuery<Entity>): string[] {
    return [...this.getAggregateGroupBySelects(query), ...this.getAggregateFuncSelects(query)]
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  private static getAggregateGroupBySelects<Entity>(query: AggregateQuery<Entity>): string[] {
    return (query.groupBy ?? []).flatMap((f) => {
      if (typeof f !== 'object') return this.getGroupByAlias(f as string)

      const entries = Object.entries(f) as [keyof Entity, string[]][]
      return entries.flatMap(([key, fields]) => {
        return fields.map((field) => this.getGroupByAlias(`${key as string}_${field}`))
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  private static getAggregateFuncSelects<Entity>(query: AggregateQuery<Entity>): string[] {
    const aggs: [AggregateFuncs, AggregateFields<Entity>][] = [
      [AggregateFuncs.COUNT, query.count],
      [AggregateFuncs.DISTINCT_COUNT, query.distinctCount],
      [AggregateFuncs.SUM, query.sum],
      [AggregateFuncs.AVG, query.avg],
      [AggregateFuncs.MAX, query.max],
      [AggregateFuncs.MIN, query.min]
    ]
    return aggs.reduce((cols, [func, fields]) => {
      const aliases = (fields ?? []).flatMap((f) => {
        if (typeof f !== 'object') return this.getAggregateAlias(func, f as string)

        const entries = Object.entries(f) as [keyof Entity, string[]][]
        return entries.flatMap(([key, relationFields]) => {
          return relationFields.map((field) => this.getAggregateAlias(func, `${key as string}_${field}`))
        })
      })
      return [...cols, ...aliases]
    }, [] as string[])
  }

  public static getAggregateAlias(func: AggregateFuncs, field: string): string {
    return `${func}_${field}`
  }

  public static getGroupByAlias(field: string): string {
    return `GROUP_BY_${field}`
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  public static convertToAggregateResponse<Entity>(rawAggregates: Record<string, unknown>[]): AggregateResponse<Entity>[] {
    return rawAggregates.map((response) => {
      return Object.keys(response).reduce((agg: AggregateResponse<Entity>, resultField: string) => {
        const matchResult = AGG_REGEXP.exec(resultField)
        if (!matchResult) {
          throw new Error('Unknown aggregate column encountered.')
        }
        const [matchedFunc, matchedFieldName] = matchResult.slice(1)
        const aggFunc = camelCase(matchedFunc.toLowerCase()) as keyof AggregateResponse<Entity>
        const foo = matchedFieldName.split('.').reduceRight((obj, key) => {
          if (!obj) return { [key as keyof Entity]: response[resultField] }
          return { [key as keyof Entity]: obj }
        }, null as any)
        const aggResult = agg[aggFunc] || {}
        return {
          ...agg,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          [aggFunc]: { ...aggResult, ...foo }
        }
      }, {})
    })
  }

  /**
   * Returns the corrected fields for orderBy and groupBy
   */
  public getCorrectedField(alias: string, f: AggregateFields<Entity>[0]) {
    return this.getFieldWithRelations(f).map(({ field, metadata, relationField }) => {
      const col = alias || relationField ? `${relationField ? relationField : alias}.${field}` : field
      const meta = metadata.findColumnWithPropertyName(`${field}`)

      if (meta && metadata.connection.driver.normalizeType(meta) === 'datetime') {
        return `DATE(${col})`
      }

      return col
    })
  }

  /**
   * Builds a aggregate SELECT clause from a aggregate.
   * @param qb - the `typeorm` SelectQueryBuilder
   * @param aggregate - the aggregates to select.
   * @param alias - optional alias to use to qualify an identifier
   */
  public build<Qb extends SelectQueryBuilder<Entity>>(qb: Qb, aggregate: AggregateQuery<Entity>, alias?: string): Qb {
    const selects = [
      ...this.createGroupBySelect(aggregate.groupBy, alias),
      ...this.createAggSelect(AggregateFuncs.COUNT, aggregate.count, alias),
      ...this.createAggDistinctSelect(AggregateFuncs.DISTINCT_COUNT, aggregate.distinctCount, alias),
      ...this.createAggSelect(AggregateFuncs.SUM, aggregate.sum, alias),
      ...this.createAggSelect(AggregateFuncs.AVG, aggregate.avg, alias),
      ...this.createAggSelect(AggregateFuncs.MAX, aggregate.max, alias),
      ...this.createAggSelect(AggregateFuncs.MIN, aggregate.min, alias)
    ]
    if (!selects.length) {
      throw new BadRequestException('No aggregate fields found.')
    }
    const [head, ...tail] = selects
    return tail.reduce((acc: Qb, [select, selectAlias]) => acc.addSelect(select, selectAlias), qb.select(head[0], head[1]))
  }

  private createAggSelect(func: AggregateFuncs, fields?: AggregateFields<Entity>, alias?: string): [string, string][] {
    if (!fields) {
      return []
    }
    return this.getFieldsWithRelations(fields).map(({ field, relationField }) => {
      const col = alias || relationField ? `${relationField ? relationField : alias}.${field}` : field
      return [
        `${func}(${col})`,
        AggregateBuilder.getAggregateAlias(func, relationField ? `${relationField}.${field}` : `${field}`)
      ]
    })
  }

  private createAggDistinctSelect(func: AggregateFuncs, fields?: AggregateFields<Entity>, alias?: string): [string, string][] {
    if (!fields) {
      return []
    }
    return this.getFieldsWithRelations(fields).map(({ field, relationField }) => {
      const col = alias || relationField ? `${relationField ? relationField : alias}.${field}` : field
      return [
        `COUNT (DISTINCT ${col})`,
        AggregateBuilder.getAggregateAlias(func, relationField ? `${relationField}.${field}` : `${field}`)
      ]
    })
  }

  private createGroupBySelect(fields?: AggregateFields<Entity>, alias?: string): (readonly [string, string])[] {
    if (!fields) {
      return []
    }

    return this.getFieldsWithRelations(fields).map(({ field, metadata, relationField }) => {
      const col = `${relationField ? relationField : metadata.targetName}.${field}`
      const groupByAlias = AggregateBuilder.getGroupByAlias(relationField ? `${relationField}.${field}` : `${field}`)

      const meta = metadata.findColumnWithPropertyName(field)
      if (meta && metadata.connection.driver.normalizeType(meta) === 'datetime') {
        return [`DATE(${col})`, groupByAlias] as const
      }
      return [`${col}`, groupByAlias] as const
    })
  }

  private getFieldsWithRelations(fields: AggregateFields<Entity>) {
    return fields.flatMap((field) => this.getFieldWithRelations(field))
  }

  private getFieldWithRelations(field: AggregateFields<Entity>[0]) {
    if (typeof field !== 'object')
      return [
        {
          field: field as string,
          metadata: this.repo.metadata,
          relationField: null
        }
      ]

    const entries: [string, string[]][] = Object.entries(field)
    return entries.flatMap(([key, relationField]) => {
      return relationField.map((r) => {
        const meta = this.repo.metadata.findRelationWithPropertyPath(`${key}`)
        return { field: r, metadata: meta.inverseEntityMetadata, relationField: key }
      })
    })
  }

  public buildHavingFilter<Qb extends SelectQueryBuilder<Entity>>(qb: Qb, having: HavingFilter<Entity>, alias?: string): Qb {
    const aggFuncMapper = new Map<keyof HavingFilter<Entity>, AggregateFuncs>([
      ['avg', AggregateFuncs.AVG],
      ['min', AggregateFuncs.MIN],
      ['max', AggregateFuncs.MAX],
      ['sum', AggregateFuncs.SUM],
      ['count', AggregateFuncs.COUNT],
      ['distinctCount', AggregateFuncs.DISTINCT_COUNT]
    ])

    Object.entries(having).forEach(([aggFunc, filter]) => {
      Object.keys(filter).forEach((field) => {
        const cmp = filter[field] as FilterFieldComparison<Entity[keyof Entity]>
        const opts = Object.keys(cmp) as (keyof FilterFieldComparison<Entity[keyof Entity]>)[]

        let column: string

        if (!alias) {
          column = `${aggFuncMapper.get(aggFunc as keyof HavingFilter<Entity>)}(${field})`
        } else {
          column = `${aggFuncMapper.get(aggFunc as keyof HavingFilter<Entity>)}(${alias}.${field})`
        }

        const sqlComparisons = opts.map((cmpType) =>
          this.sqlComparisonBuilder.build(
            column as keyof Entity,
            cmpType,
            cmp[cmpType] as EntityComparisonField<Entity, keyof Entity>,
            alias,
            true
          )
        )
        sqlComparisons.map(({ sql, params }) => {
          qb.andHaving(sql, params)
        })
      })
    })

    return qb
  }
}
