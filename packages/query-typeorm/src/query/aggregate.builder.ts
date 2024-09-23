import { BadRequestException, HttpException } from '@nestjs/common'
import {
  AggregateByTimeIntervalSpan,
  AggregateByTimeResponse,
  AggregateFields,
  AggregateQuery,
  AggregateResponse,
  Class,
  isNamed
} from '@rezonate/nestjs-query-core'
import { Entries } from '@rezonate/nestjs-query-graphql/src/decorators'
import { camelCase } from 'camel-case'
import { GraphQLError } from 'graphql'
import { EntityMetadata, Repository, SelectQueryBuilder } from 'typeorm'

import { indexFieldReflector } from '../decorators/field.index.decorator'

const MS_IN_TIMESPAN: { [key in AggregateByTimeIntervalSpan]: number } = {
  [AggregateByTimeIntervalSpan.minute]: 60 * 1000,
  [AggregateByTimeIntervalSpan.hour]: 60 * 60 * 1000,
  [AggregateByTimeIntervalSpan.day]: 24 * 60 * 60 * 1000,
  [AggregateByTimeIntervalSpan.week]: 7 * 24 * 60 * 60 * 1000,
  [AggregateByTimeIntervalSpan.month]: 4 * 7 * 24 * 60 * 60 * 1000,
  [AggregateByTimeIntervalSpan.year]: 12 * 4 * 7 * 24 * 60 * 60 * 1000
}

enum AggregateFuncs {
  AVG = 'AVG',
  SUM = 'SUM',
  COUNT = 'COUNT',
  DISTINCT_COUNT = 'DISTINCT_COUNT',
  MAX = 'MAX',
  MIN = 'MIN'
}

const AGG_REGEXP = /(AVG|SUM|COUNT|DISTINCT_COUNT|MAX|MIN|GROUP_BY)_(.*)/

const throwAggregationInvalidError = (field: string) => {
  throw new GraphQLError(`Can't run aggregation on field ${field}, since this is a large table and the field has not index!`, {
    extensions: {
      code: 400
    }
  })
}

const validateAggregatableField = (DTO: any, field: string, shouldRun: boolean) => {
  const hasIndex = indexFieldReflector.has(DTO as Class<unknown>, field)
  if (shouldRun && !hasIndex) throwAggregationInvalidError(field)
}

const safelyParseInt = (maybeNumber: unknown, defaultValue = 0) => {
  const number = Number(maybeNumber)
  if (isNaN(number)) return defaultValue
  return number
}

/**
 * @internal
 * Builds a WHERE clause from a Filter.
 */
export class AggregateBuilder<Entity> {
  constructor(readonly repo: Repository<Entity>) {}

  public static async asyncConvertToAggregateResponse<Entity>(
    responsePromise: Promise<Record<string, unknown>[]>,
    groupByLimit = 100
  ): Promise<AggregateResponse<Entity>[]> {
    const aggResponse = await responsePromise
    const sorted = this.sortByCountDescIfExists(aggResponse)
    return this.convertToAggregateResponse<Entity>(sorted.slice(0, groupByLimit))
  }

  public static async asyncConvertToAggregateByTimeResponse<Entity>(
    responsePromise: Promise<(Record<string, unknown> & { timeInterval: Date })[]>,
    groupByLimit = 10
  ): Promise<AggregateByTimeResponse<Entity>> {
    const aggResponse = await responsePromise
    const grouped = aggResponse.reduce<{ time: Date; items: (Record<string, unknown> & { timeInterval: Date })[] }[]>(
      (acc, item, i) => {
        const time = item.timeInterval
        const curr = acc.at(-1)
        if (curr && curr.time === time) {
          curr.items.push(item)
        } else {
          acc.push({
            time,
            items: [item]
          })
        }

        return acc
      },
      []
    )

    return grouped.map((item) => {
      const sorted = this.sortByCountDescIfExists(item.items)
      return {
        time: item.time,
        aggregate: this.convertToAggregateResponse<Entity>(sorted.slice(0, groupByLimit))
      }
    })
  }

  private static sortByCountDescIfExists(response: Record<string, unknown>[]) {
    if (!response.length) return response
    const countField = Object.keys(response[0]).find((key) => key.startsWith(AggregateFuncs.COUNT))
    if (!countField) return response
    return response.sort((a, b) => safelyParseInt(b[countField]) - safelyParseInt(a[countField]))
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
        if (resultField === 'timeInterval') return agg
        const matchResult = AGG_REGEXP.exec(resultField)
        if (!matchResult) {
          throw new Error('Unknown aggregate column encountered.')
        }
        const [matchedFunc, matchedFieldName] = matchResult.slice(1)
        const aggFunc = camelCase(matchedFunc.toLowerCase()) as keyof AggregateResponse<Entity>
        const currentResult = matchedFieldName.split('.').reduceRight((obj, key) => {
          if (!obj) return { [key as keyof Entity]: response[resultField] }
          return { [key as keyof Entity]: obj }
        }, null as any)
        const aggResult = agg[aggFunc] || {}
        return {
          ...agg,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          [aggFunc]: { ...aggResult, ...currentResult }
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

      if (meta.isArray) {
        return `unnest(${col})`
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
  public build<Qb extends SelectQueryBuilder<Entity>>(
    qb: Qb,
    aggregate: AggregateQuery<Entity>,
    alias?: string,
    failOnMissingIndex = false,
    allowEmptySelect = false
  ): Qb {
    const selects = [
      ...this.createGroupBySelect(aggregate.groupBy, alias, failOnMissingIndex),
      ...this.createAggSelect(AggregateFuncs.COUNT, aggregate.count, alias, failOnMissingIndex),
      ...this.createAggDistinctSelect(AggregateFuncs.DISTINCT_COUNT, aggregate.distinctCount, alias, failOnMissingIndex),
      ...this.createAggSelect(AggregateFuncs.SUM, aggregate.sum, alias, failOnMissingIndex),
      ...this.createAggSelect(AggregateFuncs.AVG, aggregate.avg, alias, failOnMissingIndex),
      ...this.createAggSelect(AggregateFuncs.MAX, aggregate.max, alias, failOnMissingIndex),
      ...this.createAggSelect(AggregateFuncs.MIN, aggregate.min, alias, failOnMissingIndex)
    ]
    if (!selects.length) {
      if (allowEmptySelect) return qb
      throw new BadRequestException('No aggregate fields found.')
    }
    const [head, ...tail] = selects
    return tail.reduce((acc: Qb, [select, selectAlias]) => acc.addSelect(select, selectAlias), qb.select(head[0], head[1]))
  }

  private createAggSelect(
    func: AggregateFuncs,
    fields?: AggregateFields<Entity>,
    alias?: string,
    failOnMissingIndex = false
  ): [string, string][] {
    if (!fields) {
      return []
    }
    return this.getFieldsWithRelations(fields).map(({ field, relationField, metadata }) => {
      validateAggregatableField(metadata.target, field, failOnMissingIndex)
      const col = alias || relationField ? `${relationField ? relationField : alias}.${field}` : field
      return [
        `${func}(${col})`,
        AggregateBuilder.getAggregateAlias(func, relationField ? `${relationField}.${field}` : `${field}`)
      ]
    })
  }

  private createAggDistinctSelect(
    func: AggregateFuncs,
    fields?: AggregateFields<Entity>,
    alias?: string,
    failOnMissingIndex = false
  ): [string, string][] {
    if (!fields) {
      return []
    }
    return this.getFieldsWithRelations(fields).map(({ field, relationField, metadata }) => {
      validateAggregatableField(metadata.target, field, failOnMissingIndex)

      const col = alias || relationField ? `${relationField ? relationField : alias}.${field}` : field
      return [
        `COUNT (DISTINCT ${col})`,
        AggregateBuilder.getAggregateAlias(func, relationField ? `${relationField}.${field}` : `${field}`)
      ]
    })
  }

  private createGroupBySelect(
    fields?: AggregateFields<Entity>,
    alias?: string,
    failOnMissingIndex = false
  ): (readonly [string, string])[] {
    if (!fields) {
      return []
    }

    return this.getFieldsWithRelations(fields).map(({ field, metadata, relationField }) => {
      const col = `${relationField ? relationField : alias}.${field}`
      const groupByAlias = AggregateBuilder.getGroupByAlias(relationField ? `${relationField}.${field}` : `${field}`)

      const meta = metadata.findColumnWithPropertyName(field)
      validateAggregatableField(metadata.target, field, failOnMissingIndex)
      if (meta && metadata.connection.driver.normalizeType(meta) === 'datetime') {
        return [`DATE(${col})`, groupByAlias] as const
      }
      if (meta.isArray) return [`unnest(${col})`, groupByAlias] as const
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
}
