/* eslint-disable @typescript-eslint/naming-convention */
import { AggregateQuery, GroupBy } from '@souagrosolucoes/nestjs-query-core'
import { format as formatSql } from 'sql-formatter'
import { DataSource } from 'typeorm'

import { AggregateBuilder } from '../../src/query'
import { createTestConnection } from '../__fixtures__/connection.fixture'
import { TestEntity } from '../__fixtures__/test.entity'

describe('AggregateBuilder', (): void => {
  let dataSource: DataSource
  beforeEach(async () => {
    dataSource = await createTestConnection()
  })
  afterEach(() => dataSource.destroy())

  const getRepo = () => dataSource.getRepository(TestEntity)
  const getQueryBuilder = () => getRepo().createQueryBuilder()
  const createAggregateBuilder = () => new AggregateBuilder<TestEntity>(getRepo())

  const expectSQLSnapshot = (agg: AggregateQuery<TestEntity>): void => {
    const selectQueryBuilder = createAggregateBuilder().build(getQueryBuilder(), agg, 'TestEntity')
    const [sql, params] = selectQueryBuilder.getQueryAndParameters()

    expect(formatSql(sql, { params })).toMatchSnapshot()
  }

  it('should throw an error if no selects are generated', (): void => {
    expect(() => createAggregateBuilder().build(getQueryBuilder(), {})).toThrow('No aggregate fields found.')
  })

  it('should create selects for all aggregate functions', (): void => {
    expectSQLSnapshot({
      count: [{ field: 'testEntityPk', args: {} }],
      avg: [{ field: 'numberType', args: {} }],
      sum: [{ field: 'numberType', args: {} }],
      max: [
        { field: 'stringType', args: {} },
        { field: 'dateType', args: {} },
        { field: 'numberType', args: {} }
      ],
      min: [
        { field: 'stringType', args: {} },
        { field: 'dateType', args: {} },
        { field: 'numberType', args: {} }
      ]
    })
  })

  it('should create selects for all aggregate functions and group bys', (): void => {
    expectSQLSnapshot({
      groupBy: [
        { field: 'stringType', args: {} },
        { field: 'boolType', args: {} }
      ],
      count: [{ field: 'testEntityPk', args: {} }]
    })
  })

  describe('date type', () => {
    it('should default group by day', (): void => {
      expectSQLSnapshot({
        groupBy: [{ field: 'dateType', args: {} }],
        count: [{ field: 'testEntityPk', args: {} }]
      })
    })

    it('should default group by week', (): void => {
      expectSQLSnapshot({
        groupBy: [{ field: 'dateType', args: { by: GroupBy.WEEK } }],
        count: [{ field: 'testEntityPk', args: {} }]
      })
    })

    it('should default group by month', (): void => {
      expectSQLSnapshot({
        groupBy: [{ field: 'dateType', args: { by: GroupBy.MONTH } }],
        count: [{ field: 'testEntityPk', args: {} }]
      })
    })
  })

  describe('.convertToAggregateResponse', () => {
    it('should convert a flat response into an Aggregate response', () => {
      const dbResult = [
        {
          GROUP_BY_stringType: 'z',
          COUNT_testEntityPk: 10,
          SUM_numberType: 55,
          AVG_numberType: 5,
          MAX_stringType: 'z',
          MAX_numberType: 10,
          MIN_stringType: 'a',
          MIN_numberType: 1
        }
      ]
      expect(AggregateBuilder.convertToAggregateResponse<TestEntity>(dbResult)).toEqual([
        {
          groupBy: { stringType: 'z' },
          count: { testEntityPk: 10 },
          sum: { numberType: 55 },
          avg: { numberType: 5 },
          max: { stringType: 'z', numberType: 10 },
          min: { stringType: 'a', numberType: 1 }
        }
      ])
    })

    it('should throw an error if a column is not expected', () => {
      const dbResult = [
        {
          COUNTtestEntityPk: 10
        }
      ]
      expect(() => AggregateBuilder.convertToAggregateResponse<TestEntity>(dbResult)).toThrow(
        'Unknown aggregate column encountered.'
      )
    })
  })
})
