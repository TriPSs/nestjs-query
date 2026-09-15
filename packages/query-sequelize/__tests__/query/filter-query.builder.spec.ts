import { Query, SortDirection, SortNulls } from '@ptc-org/nestjs-query-core'
import { col, DestroyOptions, Dialect, FindOptions, fn, Op, UpdateOptions } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'

import { FilterQueryBuilder, WhereBuilder } from '../../src/query'
import { CONNECTION_OPTIONS } from '../__fixtures__/sequelize.fixture'
import { TestEntity } from '../__fixtures__/test.entity'

describe('FilterQueryBuilder', (): void => {
  let connectedSequelize: Sequelize | undefined

  const closeConnectedSequelize = async (): Promise<void> => {
    await connectedSequelize?.close()
    connectedSequelize = undefined
  }

  const connectModelsToDialect = async (dialect: Dialect): Promise<void> => {
    await closeConnectedSequelize()
    connectedSequelize = new Sequelize({ ...CONNECTION_OPTIONS, dialect, username: 'test' })
  }

  const isNullOrderingKey = (columnName: string) => fn('ISNULL', col(`TestEntity.${columnName}`))

  beforeEach(() => connectModelsToDialect('sqlite'))

  afterEach(() => closeConnectedSequelize())

  const getEntityQueryBuilder = (whereBuilder: WhereBuilder<TestEntity>): FilterQueryBuilder<TestEntity> =>
    new FilterQueryBuilder(TestEntity, whereBuilder)

  describe('#select', () => {
    const expectFindOptions = (
      query: Query<TestEntity>,
      whereBuilder: WhereBuilder<TestEntity>,
      expectedFindOptions: FindOptions
    ): void => {
      expect(getEntityQueryBuilder(whereBuilder).findOptions(query)).toEqual({
        ...expectedFindOptions,
        subQuery: false
      })
    }

    describe('with filter', () => {
      it('should not call whereBuilder#build', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions({}, instance(mockWhereBuilder), {})
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(query.filter, deepEqual(new Map()))).thenCall(() => ({
          [Op.and]: { stringType: 'foo' }
        }))
        expectFindOptions(query, instance(mockWhereBuilder), {
          where: { [Op.and]: { stringType: 'foo' } }
        })
      })
    })

    describe('with paging', () => {
      it('should apply empty paging args', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions({}, instance(mockWhereBuilder), {})
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply paging args going forward', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            paging: {
              limit: 10,
              offset: 11
            }
          },
          instance(mockWhereBuilder),
          { limit: 10, offset: 11 }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply paging args going backward', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            paging: {
              limit: 10,
              offset: 10
            }
          },
          instance(mockWhereBuilder),
          { limit: 10, offset: 10 }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply paging with just a limit', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            paging: {
              limit: 10
            }
          },
          instance(mockWhereBuilder),
          { limit: 10 }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply paging with just an offset', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            paging: {
              offset: 10
            }
          },
          instance(mockWhereBuilder),
          { offset: 10 }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })
    })

    describe('with sorting', () => {
      it('should apply ASC sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [{ field: 'numberType', direction: SortDirection.ASC }]
          },
          instance(mockWhereBuilder),
          { order: [['numberType', 'ASC']] }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply ASC NULLS_FIRST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }]
          },
          instance(mockWhereBuilder),
          { order: [['numberType', 'ASC NULLS FIRST']] }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply ASC NULLS_LAST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }]
          },
          instance(mockWhereBuilder),
          { order: [['numberType', 'ASC NULLS LAST']] }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply DESC sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [{ field: 'numberType', direction: SortDirection.DESC }]
          },
          instance(mockWhereBuilder),
          { order: [['numberType', 'DESC']] }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply DESC NULLS_FIRST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }]
          },
          instance(mockWhereBuilder),
          { order: [['numberType', 'DESC NULLS FIRST']] }
        )
      })

      it('should apply DESC NULLS_LAST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }]
          },
          instance(mockWhereBuilder),
          { order: [['numberType', 'DESC NULLS LAST']] }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      it('should apply multiple sorts', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectFindOptions(
          {
            sorting: [
              { field: 'numberType', direction: SortDirection.ASC },
              { field: 'boolType', direction: SortDirection.DESC },
              { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
              { field: 'dateType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }
            ]
          },
          instance(mockWhereBuilder),
          {
            order: [
              ['numberType', 'ASC'],
              ['boolType', 'DESC'],
              ['stringType', 'ASC NULLS FIRST'],
              ['dateType', 'DESC NULLS LAST']
            ]
          }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })

      describe('on a dialect without NULLS FIRST/LAST support', () => {
        beforeEach(() => connectModelsToDialect('mysql'))

        it('should order by an IS NULL key before the column for NULLS_FIRST', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectFindOptions(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
            instance(mockWhereBuilder),
            {
              order: [
                [isNullOrderingKey('number_type'), 'DESC'],
                ['numberType', 'ASC']
              ]
            }
          )
        })

        it('should order by an IS NULL key before the column for NULLS_LAST', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectFindOptions(
            { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }] },
            instance(mockWhereBuilder),
            {
              order: [
                [isNullOrderingKey('number_type'), 'ASC'],
                ['numberType', 'DESC']
              ]
            }
          )
        })

        it('should not add an IS NULL key when nulls is not specified', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectFindOptions({ sorting: [{ field: 'numberType', direction: SortDirection.ASC }] }, instance(mockWhereBuilder), {
            order: [['numberType', 'ASC']]
          })
        })

        it('should keep each IS NULL key next to its own field in a multiple sort', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectFindOptions(
            {
              sorting: [
                { field: 'numberType', direction: SortDirection.ASC },
                { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
                { field: 'dateType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }
              ]
            },
            instance(mockWhereBuilder),
            {
              order: [
                ['numberType', 'ASC'],
                [isNullOrderingKey('string_type'), 'DESC'],
                ['stringType', 'ASC'],
                [isNullOrderingKey('date_type'), 'ASC'],
                ['dateType', 'DESC']
              ]
            }
          )
        })

        it('should qualify the IS NULL key when the filter joins a relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          const findOptions = getEntityQueryBuilder(instance(mockWhereBuilder)).findOptions({
            filter: { testRelations: { relationName: { eq: 'foo' } } },
            sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }]
          })

          expect(findOptions.include).toHaveLength(1)
          expect(findOptions.order).toEqual([
            [isNullOrderingKey('number_type'), 'DESC'],
            ['numberType', 'ASC']
          ])
        })
      })

      describe('on a dialect with native NULLS FIRST/LAST support', () => {
        beforeEach(() => connectModelsToDialect('postgres'))

        it('should pass NULLS_FIRST through to the dialect', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectFindOptions(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
            instance(mockWhereBuilder),
            { order: [['numberType', 'ASC NULLS FIRST']] }
          )
        })

        it('should pass NULLS_LAST through to the dialect', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectFindOptions(
            { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }] },
            instance(mockWhereBuilder),
            { order: [['numberType', 'DESC NULLS LAST']] }
          )
        })
      })
    })
  })

  describe('#update', () => {
    const expectUpdateOptions = (
      query: Query<TestEntity>,
      whereBuilder: WhereBuilder<TestEntity>,
      expectedUpdateOptions: UpdateOptions
    ): void => {
      expect(getEntityQueryBuilder(whereBuilder).updateOptions(query)).toEqual(expectedUpdateOptions)
    }

    describe('with filter', () => {
      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(query.filter, deepEqual(new Map()))).thenCall(() => ({
          [Op.and]: { stringType: 'foo' }
        }))
        expectUpdateOptions(query, instance(mockWhereBuilder), {
          where: { [Op.and]: { stringType: 'foo' } }
        })
      })
    })
    describe('with paging', () => {
      it('should ignore paging args', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateOptions(
          {
            paging: {
              limit: 10
            }
          },
          instance(mockWhereBuilder),
          { where: {}, limit: 10 }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })
    })
  })

  describe('#delete', () => {
    const expectDestroyOptions = (
      query: Query<TestEntity>,
      whereBuilder: WhereBuilder<TestEntity>,
      expectedDestroyOptions: DestroyOptions
    ): void => {
      expect(getEntityQueryBuilder(whereBuilder).destroyOptions(query)).toEqual(expectedDestroyOptions)
    }

    describe('with filter', () => {
      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(query.filter, deepEqual(new Map()))).thenCall(() => ({
          [Op.and]: { stringType: 'foo' }
        }))
        expectDestroyOptions(query, instance(mockWhereBuilder), {
          where: { [Op.and]: { stringType: 'foo' } }
        })
      })
    })
    describe('with paging', () => {
      it('should include limit', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectDestroyOptions(
          {
            paging: {
              limit: 10
            }
          },
          instance(mockWhereBuilder),
          { limit: 10 }
        )
        verify(mockWhereBuilder.build(anything(), anything())).never()
      })
    })
  })
})
