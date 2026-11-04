import { Class, Filter, Query, SortDirection, SortField, SortNulls } from '@ptc-org/nestjs-query-core'
import { format as formatSql } from 'sql-formatter'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { DataSource, DataSourceOptions, EntityMetadata, QueryBuilder, WhereExpressionBuilder } from 'typeorm'

import { FilterQueryBuilder, WhereBuilder } from '../../src/query'
import { createTestConnection, refresh } from '../__fixtures__/connection.fixture'
import { RelationOfTestRelationEntity } from '../__fixtures__/relation-of-test-relation.entity'
import { TestEntity } from '../__fixtures__/test.entity'
import { TestRelation } from '../__fixtures__/test-relation.entity'
import { TestSoftDeleteEntity } from '../__fixtures__/test-soft-delete.entity'
import { TestVirtualColumnEntity } from '../__fixtures__/test-virtual-column.entity'

describe('FilterQueryBuilder', (): void => {
  let connection: DataSource
  beforeEach(async () => {
    connection = await createTestConnection()
  })
  afterEach(() => connection.destroy())

  const getEntityQueryBuilder = <Entity>(entity: Class<Entity>, whereBuilder: WhereBuilder<Entity>): FilterQueryBuilder<Entity> =>
    new FilterQueryBuilder(connection.getRepository(entity), whereBuilder)

  const expectSQLSnapshot = <Entity>(query: QueryBuilder<Entity>): void => {
    const [sql, params] = query.getQueryAndParameters()

    expect(formatSql(sql, { params })).toMatchSnapshot()
  }

  const orderByItems = <Entity>(query: QueryBuilder<Entity>): string[] => query.getQuery().split(' ORDER BY ')[1].split(', ')

  describe('#getReferencedRelationsWithAliasRecursive', () => {
    it('with deeply nested and / or', () => {
      const complexQuery: Filter<TestEntity> = {
        and: [
          {
            oneTestRelation: {
              manyTestEntities: {
                oneTestRelation: {
                  manyTestEntities: {
                    stringType: { eq: '123' }
                  }
                }
              }
            }
          },

          {
            or: [
              { and: [{ stringType: { eq: '123' } }] },
              {
                and: [{ stringType: { eq: '123' } }, { testEntityPk: { eq: '123' } }]
              }
            ]
          },

          {
            stringType: { eq: '345' },
            or: [
              { oneTestRelation: { relationName: { eq: '123' } } },
              { oneTestRelation: { relationOfTestRelation: { testRelationId: { eq: 'e1' } } } }
            ]
          }
        ]
      }

      const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
      const qb = getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder))

      expect(qb.getReferencedRelationsWithAliasRecursive(qb.repo.metadata, complexQuery)).toEqual({
        oneTestRelation: {
          alias: 'oneTestRelation',
          metadata: expect.any(EntityMetadata),
          relations: {
            manyTestEntities: {
              alias: 'manyTestEntities',
              metadata: expect.any(EntityMetadata),
              relations: {
                oneTestRelation: {
                  alias: 'oneTestRelation_1',
                  metadata: expect.any(EntityMetadata),
                  relations: {
                    manyTestEntities: {
                      alias: 'manyTestEntities_1',
                      metadata: expect.any(EntityMetadata),
                      relations: {}
                    }
                  }
                }
              }
            },

            relationOfTestRelation: {
              alias: 'relationOfTestRelation',
              metadata: expect.any(EntityMetadata),
              relations: {}
            }
          }
        }
      })
    })

    it('with nested and / or', () => {
      const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
      const qb = getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder))

      const query: Filter<TestEntity> = {
        stringType: { eq: '123' },

        and: [
          {
            boolType: { is: true }
          },
          {
            testRelations: {
              relationName: { eq: '123' }
            }
          }
        ],

        or: [
          {
            boolType: { is: true }
          },
          {
            oneTestRelation: {
              testRelationPk: { eq: '123' },
              testEntity: {
                testRelations: {
                  relationName: { eq: '123' }
                }
              }
            }
          },
          {
            oneTestRelation: {
              relationsOfTestRelation: {
                testRelationId: {
                  eq: '123'
                }
              }
            }
          }
        ]
      }

      expect(qb.getReferencedRelationsWithAliasRecursive(qb.repo.metadata, query)).toEqual({
        testRelations: {
          alias: 'testRelations',
          metadata: expect.any(EntityMetadata),
          relations: {}
        },

        oneTestRelation: {
          alias: 'oneTestRelation',
          metadata: expect.any(EntityMetadata),
          relations: {
            relationsOfTestRelation: {
              alias: 'relationsOfTestRelation',
              metadata: expect.any(EntityMetadata),
              relations: {}
            },

            testEntity: {
              alias: 'testEntity',
              metadata: expect.any(EntityMetadata),
              relations: {
                testRelations: {
                  alias: 'testRelations_1',
                  metadata: expect.any(EntityMetadata),
                  relations: {}
                }
              }
            }
          }
        }
      })
    })

    it('carries the entity metadata of every referenced relation', () => {
      const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
      const qb = getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder))

      const nestedRelationQuery: Filter<TestEntity> = { oneTestRelation: { testEntity: { stringType: { eq: '123' } } } }
      const relations = qb.getReferencedRelationsWithAliasRecursive(qb.repo.metadata, nestedRelationQuery)

      expect(relations.oneTestRelation.metadata.target).toBe(TestRelation)
      expect(relations.oneTestRelation.relations.testEntity.metadata.target).toBe(TestEntity)
    })
  })

  describe('#getReferencedRelationsRecursive', () => {
    it('with deeply nested and / or', () => {
      const complexQuery: Filter<TestEntity> = {
        and: [
          {
            or: [
              { and: [{ stringType: { eq: '123' } }] },
              {
                and: [{ stringType: { eq: '123' } }, { testEntityPk: { eq: '123' } }]
              }
            ]
          },
          {
            stringType: { eq: '345' },
            or: [
              { oneTestRelation: { relationName: { eq: '123' } } },
              { oneTestRelation: { relationOfTestRelation: { testRelationId: { eq: 'e1' } } } }
            ]
          }
        ]
      }
      const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
      const qb = getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder))
      expect(qb.getReferencedRelationsRecursive(qb.repo.metadata, complexQuery)).toEqual({
        oneTestRelation: { relationOfTestRelation: {} }
      })
    })
    it('with nested and / or', () => {
      const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
      const qb = getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder))
      expect(
        qb.getReferencedRelationsRecursive(qb.repo.metadata, {
          test: '123',
          and: [
            {
              boolType: { is: true }
            },
            {
              testRelations: {
                relationName: { eq: '123' }
              }
            }
          ],
          or: [
            {
              boolType: { is: true }
            },
            {
              oneTestRelation: {
                testRelationPk: { eq: '123' }
              }
            },
            {
              oneTestRelation: {
                relationsOfTestRelation: {
                  testRelationId: {
                    eq: '123'
                  }
                }
              }
            }
          ]
        } as Filter<TestEntity>)
      ).toEqual({ testRelations: {}, oneTestRelation: { relationsOfTestRelation: {} } })
    })
  })

  describe('#select', () => {
    const expectSelectSQLSnapshot = (query: Query<TestEntity>, whereBuilder: WhereBuilder<TestEntity>): void => {
      const selectQueryBuilder = getEntityQueryBuilder(TestEntity, whereBuilder).select(query)
      expectSQLSnapshot(selectQueryBuilder)
    }

    describe('with filter', () => {
      it('should not call whereBuilder#build', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot({}, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(anything(), query.filter, deepEqual({}), 'TestEntity')).thenCall(
          (where: WhereExpressionBuilder, field: Filter<TestEntity>, relationNames: string[], alias: string) =>
            where.andWhere(`${alias}.stringType = 'foo'`)
        )
        expectSelectSQLSnapshot(query, instance(mockWhereBuilder))
      })

      it('should apply filtering from relations query filter', () => {
        const expectSQLSnapshotUsingQuery = <Entity>(EntityClass: Class<Entity>, query: Query<Entity>): void => {
          const geFilterQueryBuilder = (e: Class<Entity>): FilterQueryBuilder<Entity> =>
            new FilterQueryBuilder(connection.getRepository(e))

          const selectQueryBuilder = geFilterQueryBuilder(EntityClass).select(query)
          const [sql, params] = selectQueryBuilder.getQueryAndParameters()
          expect(formatSql(sql, { params })).toMatchSnapshot()
        }

        expectSQLSnapshotUsingQuery(TestEntity, {
          filter: { stringType: { eq: 'test' } }, // note that this is the 'normal' filter.
          relations: [
            {
              name: 'oneTestRelation',
              query: {
                // and this filter gets applied to the query as well.
                filter: {
                  numberType: { eq: 123 }
                }
              }
            }
          ]
        } as any)
      })
    })

    describe('with paging', () => {
      it('should apply empty paging args', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot({}, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), deepEqual({}), 'TestEntity')).never()
      })

      it('should apply paging args going forward', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot({ paging: { limit: 10, offset: 11 } }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), deepEqual({}), 'TestEntity')).never()
      })

      it('should apply paging args going backward', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot({ paging: { limit: 10, offset: 10 } }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      describe('skip/take - limit/offset', () => {
        it('should use skip/take when filtering on many to many relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { manyTestRelations: { testRelationPk: { eq: 'test' } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use skip/take when filtering on nested many to many relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { oneTestRelation: { manyTestEntities: { testEntityPk: { eq: 'test' } } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use skip/take when filtering on one to many relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { testRelations: { testRelationPk: { eq: 'test' } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use skip/take when filtering on nested one to many relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { oneTestRelation: { testEntityRelation: { testRelationId: { eq: 'test' } } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use limit/offset when filtering on one to one relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { oneTestRelation: { testRelationPk: { eq: 'test' } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use limit/offset when filtering on nested one to one relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { oneTestRelation: { oneTestEntity: { testEntityPk: { eq: 'test' } } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use limit/offset when filtering on many to one relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { manyToOneRelation: { testRelationPk: { eq: 'test' } } }
            },
            instance(mockWhereBuilder)
          )
        })

        it('should use limit/offset when filtering on nested many to one relation', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          when(mockWhereBuilder.build(anything(), anything(), anything(), anything())).thenCall(
            (qb: WhereExpressionBuilder) => qb
          )

          expectSelectSQLSnapshot(
            {
              paging: { limit: 10, offset: 3 },
              filter: { oneTestRelation: { testEntity: { testEntityPk: { eq: 'test' } } } }
            },
            instance(mockWhereBuilder)
          )
        })
      })
    })

    describe('with sorting', () => {
      it('should apply ASC sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot({ sorting: [{ field: 'numberType', direction: SortDirection.ASC }] }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      it('should apply ASC NULLS_FIRST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      it('should apply ASC NULLS_LAST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      it('should apply DESC sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot({ sorting: [{ field: 'numberType', direction: SortDirection.DESC }] }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      it('should apply DESC NULLS_FIRST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }] },
          instance(mockWhereBuilder)
        )
      })

      it('should apply DESC NULLS_LAST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      it('should apply multiple sorts', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          {
            sorting: [
              { field: 'numberType', direction: SortDirection.ASC },
              { field: 'boolType', direction: SortDirection.DESC },
              { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
              { field: 'dateType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }
            ]
          },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), {}, 'TestEntity')).never()
      })

      describe('on a driver without NULLS FIRST/LAST support (snapshots keep SQLite quoting)', () => {
        beforeEach(() => connection.setOptions({ type: 'mysql' } as Partial<DataSourceOptions>))

        it('should order by an IS NULL key before the column for NULLS_FIRST', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
            instance(mockWhereBuilder)
          )
        })

        it('should order by an IS NULL key before the column for NULLS_LAST', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }] },
            instance(mockWhereBuilder)
          )
        })

        it('should not add an IS NULL key when nulls is not specified', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC }] },
            instance(mockWhereBuilder)
          )
        })

        it('should keep each IS NULL key next to its own field in a multiple sort', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            {
              sorting: [
                { field: 'numberType', direction: SortDirection.ASC },
                { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
                { field: 'dateType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }
              ]
            },
            instance(mockWhereBuilder)
          )
        })

        it('should order a virtual column by an IS NULL expression, since a select expression cannot reference its alias', async () => {
          const queryBuilder = new FilterQueryBuilder(connection.getRepository(TestVirtualColumnEntity)).select({
            sorting: [{ field: 'relationCount', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }]
          })

          expectSQLSnapshot(queryBuilder)
          await expect(queryBuilder.getMany()).resolves.toEqual([])
        })

        it('should drop the IS NULL expression of a virtual column sorted again without nulls', () => {
          const queryBuilder = new FilterQueryBuilder(connection.getRepository(TestVirtualColumnEntity)).select({
            sorting: [
              { field: 'relationCount', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
              { field: 'relationCount', direction: SortDirection.DESC }
            ]
          })

          expect(queryBuilder.getQuery()).toMatch(/ORDER BY "TestVirtualColumnEntity_relationCount" DESC$/)
        })

        describe('when the caller orders a virtual column by the same bare IS NULL expression', () => {
          const callerNullKey = '"TestVirtualColumnEntity_relationCount" IS NULL'
          const sortRelationCountNullsLast = [
            { field: 'relationCount', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }
          ] as SortField<TestVirtualColumnEntity>[]
          const sortRelationCountWithoutNulls = [
            { field: 'relationCount', direction: SortDirection.ASC }
          ] as SortField<TestVirtualColumnEntity>[]
          const emulatedNullKeyAscending = '("TestVirtualColumnEntity_relationCount" IS NULL) ASC'
          const createFilterQueryBuilder = () => new FilterQueryBuilder(connection.getRepository(TestVirtualColumnEntity))

          it('should keep the order by the caller added before sorting', () => {
            const filterQueryBuilder = createFilterQueryBuilder()
            const queryBuilder = filterQueryBuilder.select({}).orderBy(callerNullKey, 'DESC')

            filterQueryBuilder.applySorting(queryBuilder, sortRelationCountNullsLast, queryBuilder.alias)

            expect(orderByItems(queryBuilder)).toEqual([
              `${callerNullKey} DESC`,
              emulatedNullKeyAscending,
              '"TestVirtualColumnEntity_relationCount" ASC'
            ])
          })

          it('should keep the order by the caller added before sorting without nulls', () => {
            const filterQueryBuilder = createFilterQueryBuilder()
            const queryBuilder = filterQueryBuilder.select({}).orderBy(callerNullKey, 'DESC')

            filterQueryBuilder.applySorting(queryBuilder, sortRelationCountWithoutNulls, queryBuilder.alias)

            expect(orderByItems(queryBuilder)).toEqual([`${callerNullKey} DESC`, '"TestVirtualColumnEntity_relationCount" ASC'])
          })

          it('should keep the null placement of the sort when the caller adds the order by after sorting', () => {
            const queryBuilder = createFilterQueryBuilder()
              .select({ sorting: sortRelationCountNullsLast })
              .addOrderBy(callerNullKey, 'DESC')

            expect(orderByItems(queryBuilder)).toEqual([
              emulatedNullKeyAscending,
              '"TestVirtualColumnEntity_relationCount" ASC',
              `${callerNullKey} DESC`
            ])
          })
        })

        it('should share an order by entry with a parenthesised IS NULL expression the caller added before sorting', () => {
          const filterQueryBuilder = new FilterQueryBuilder(connection.getRepository(TestVirtualColumnEntity))
          const queryBuilder = filterQueryBuilder.select({}).orderBy('("TestVirtualColumnEntity_relationCount" IS NULL)', 'DESC')

          filterQueryBuilder.applySorting(
            queryBuilder,
            [{ field: 'relationCount', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
            queryBuilder.alias
          )

          expect(orderByItems(queryBuilder)).toEqual([
            '("TestVirtualColumnEntity_relationCount" IS NULL) ASC',
            '"TestVirtualColumnEntity_relationCount" ASC'
          ])
        })

        it('should not reuse the alias of a user selection that starts with the null ordering key prefix', async () => {
          connection.setOptions({ type: 'better-sqlite3' } as Partial<DataSourceOptions>)
          await refresh(connection)
          await connection
            .getRepository(TestRelation)
            .save({ testRelationPk: 'a-relation-without-test-entity', relationName: 'a' })
          connection.setOptions({ type: 'mysql' } as Partial<DataSourceOptions>)
          const sortingNullsLast = [
            { field: 'testEntityId', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST },
            { field: 'testRelationPk', direction: SortDirection.ASC }
          ] as SortField<TestRelation>[]
          const filterQueryBuilder = new FilterQueryBuilder(connection.getRepository(TestRelation))
          const queryBuilder = filterQueryBuilder.select({}).addSelect('1', '__nestjsQuery__nullOrdering__1')

          const relations = await filterQueryBuilder.applySorting(queryBuilder, sortingNullsLast, queryBuilder.alias).getMany()

          expect(relations[relations.length - 1].testRelationPk).toBe('a-relation-without-test-entity')
        })

        it.each([undefined, SortNulls.NULLS_FIRST])(
          'should keep an IS NULL order by the user added on a field sorted with nulls %s',
          async (nulls) => {
            connection.setOptions({ type: 'better-sqlite3' } as Partial<DataSourceOptions>)
            await refresh(connection)
            await connection
              .getRepository(TestRelation)
              .save({ testRelationPk: 'a-relation-without-test-entity', relationName: 'a' })
            connection.setOptions({ type: 'mysql' } as Partial<DataSourceOptions>)
            const sorting = [
              { field: 'testEntityId', direction: SortDirection.ASC, nulls },
              { field: 'testRelationPk', direction: SortDirection.ASC }
            ] as SortField<TestRelation>[]
            const filterQueryBuilder = new FilterQueryBuilder(connection.getRepository(TestRelation))
            const queryBuilder = filterQueryBuilder.select({}).addOrderBy('TestRelation.testEntityId IS NULL', 'ASC')

            const relations = await filterQueryBuilder.applySorting(queryBuilder, sorting, queryBuilder.alias).getMany()

            expect(relations[relations.length - 1].testRelationPk).toBe('a-relation-without-test-entity')
          }
        )
      })

      describe('on a driver without NULLS FIRST/LAST support, when a filter on a to-many relation makes TypeORM page in a DISTINCT subquery', () => {
        const relationWithoutEntityPk = 'test-relations-without-test-entity'

        const seedRelationWithoutEntity = async (): Promise<void> => {
          await refresh(connection)
          await connection
            .getRepository(TestRelation)
            .save({ testRelationPk: relationWithoutEntityPk, relationName: 'without-test-entity' })
          await connection.getRepository(RelationOfTestRelationEntity).save({
            id: `relation-of-${relationWithoutEntityPk}`,
            relationName: `relation-of-${relationWithoutEntityPk}`,
            testRelationId: relationWithoutEntityPk
          })
        }

        const selectPagedRelationPks = async (query: Query<TestRelation>): Promise<string[]> => {
          const relations = await new FilterQueryBuilder(connection.getRepository(TestRelation))
            .select({ ...query, filter: { relationsOfTestRelation: { id: { isNot: null } } } })
            .getMany()
          return relations.map(({ testRelationPk }) => testRelationPk)
        }

        beforeEach(async () => {
          await seedRelationWithoutEntity()
          connection.setOptions({ type: 'mysql' } as Partial<DataSourceOptions>)
        })

        it('should place nulls first on the first page', async () => {
          await expect(
            selectPagedRelationPks({
              sorting: [
                { field: 'testEntityId', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST },
                { field: 'testRelationPk', direction: SortDirection.ASC }
              ],
              paging: { limit: 2 }
            })
          ).resolves.toEqual([relationWithoutEntityPk, 'test-relations-test-entity-9-1'])
        })

        it('should place nulls last on the last page', async () => {
          await expect(
            selectPagedRelationPks({
              sorting: [
                { field: 'testEntityId', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST },
                { field: 'testRelationPk', direction: SortDirection.ASC }
              ],
              paging: { limit: 2, offset: 29 }
            })
          ).resolves.toEqual(['test-relations-test-entity-9-3', relationWithoutEntityPk])
        })

        it('should keep the null placement of an earlier sort when sorting is applied again', async () => {
          const filterQueryBuilder = new FilterQueryBuilder(connection.getRepository(TestRelation))
          const queryBuilder = filterQueryBuilder.select({
            filter: { relationsOfTestRelation: { id: { isNot: null } } },
            sorting: [{ field: 'testEntityId', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
            paging: { limit: 50 }
          })
          const resortedQueryBuilder = filterQueryBuilder.applySorting(
            queryBuilder,
            [{ field: 'testRelationPk', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }],
            queryBuilder.alias
          )

          const relations = await resortedQueryBuilder.getMany()
          expect(relations[relations.length - 1].testRelationPk).toBe(relationWithoutEntityPk)
        })

        describe('when the same field is sorted twice, as the native NULLS FIRST/LAST keyword orders it', () => {
          type SortingCalls = SortField<TestRelation>[][]

          const sortOnTestEntityId = (direction: SortDirection, nulls?: SortNulls): SortField<TestRelation> => ({
            field: 'testEntityId',
            direction,
            nulls
          })
          const unrelatedSort: SortField<TestRelation> = { field: 'relationName', direction: SortDirection.DESC }
          const tieBreakingSort: SortField<TestRelation> = { field: 'testRelationPk', direction: SortDirection.ASC }

          const nullsOptions = [undefined, SortNulls.NULLS_FIRST, SortNulls.NULLS_LAST]
          const directionOrders = [
            [SortDirection.ASC, SortDirection.DESC],
            [SortDirection.DESC, SortDirection.ASC]
          ]
          const describeSort = (direction: SortDirection, nulls?: SortNulls): string =>
            [direction, nulls].filter(Boolean).join(' ')
          const combinations = directionOrders.flatMap(([firstDirection, secondDirection]) =>
            nullsOptions.flatMap((firstNulls) =>
              nullsOptions.flatMap((secondNulls) => {
                const first = sortOnTestEntityId(firstDirection, firstNulls)
                const second = sortOnTestEntityId(secondDirection, secondNulls)
                const title = `${describeSort(firstDirection, firstNulls)} then ${describeSort(secondDirection, secondNulls)}`
                const variants: [string, SortingCalls][] = [
                  [`${title} in one call`, [[first, second, tieBreakingSort]]],
                  [`${title} in one call with another field between them`, [[first, unrelatedSort, second, tieBreakingSort]]],
                  [`${title} in separate calls`, [[first], [second, tieBreakingSort]]],
                  [
                    `${title} in separate calls with another field between them`,
                    [
                      [first, unrelatedSort],
                      [second, tieBreakingSort]
                    ]
                  ]
                ]
                return variants
              })
            )
          )

          const selectPagedRelationPksOn = async (
            driverType: string,
            [firstCall, ...laterCalls]: SortingCalls
          ): Promise<string[]> => {
            connection.setOptions({ type: driverType } as Partial<DataSourceOptions>)
            const filterQueryBuilder = new FilterQueryBuilder(connection.getRepository(TestRelation))
            const queryBuilder = filterQueryBuilder.select({
              filter: { relationsOfTestRelation: { id: { isNot: null } } },
              sorting: firstCall,
              paging: { limit: 50 }
            })
            laterCalls.forEach((sorting) => filterQueryBuilder.applySorting(queryBuilder, sorting, queryBuilder.alias))
            const relations = await queryBuilder.getMany()
            return relations.map(({ testRelationPk }) => testRelationPk)
          }

          it.each(combinations)('should order %s', async (_title, sortingCalls) => {
            const nativelyOrderedPks = await selectPagedRelationPksOn('better-sqlite3', sortingCalls)

            await expect(selectPagedRelationPksOn('mysql', sortingCalls)).resolves.toEqual(nativelyOrderedPks)
          })
        })
      })

      describe('on a driver with native NULLS FIRST/LAST support', () => {
        beforeEach(() => connection.setOptions({ type: 'postgres' } as Partial<DataSourceOptions>))

        it('should pass NULLS_FIRST through to the driver', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
            instance(mockWhereBuilder)
          )
        })

        it('should pass NULLS_LAST through to the driver', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }] },
            instance(mockWhereBuilder)
          )
        })
      })

      describe('on a driver that cannot express null ordering at all', () => {
        beforeEach(() => connection.setOptions({ type: 'mssql' } as Partial<DataSourceOptions>))

        it('should reject NULLS_FIRST naming the offending field', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expect(() =>
            getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder)).select({
              sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }]
            })
          ).toThrow(
            `Sorting by null placement is not supported on the "mssql" driver. Remove 'nulls' from the sort on 'numberType'.`
          )
        })

        it('should reject NULLS_LAST', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expect(() =>
            getEntityQueryBuilder(TestEntity, instance(mockWhereBuilder)).select({
              sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }]
            })
          ).toThrow('Sorting by null placement is not supported')
        })

        it('should still sort when nulls is not specified', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectSelectSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC }] },
            instance(mockWhereBuilder)
          )
        })
      })
    })

    describe('with relation', () => {
      it('should select and map relation', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          {
            relations: [{ name: 'oneTestRelation', query: {} }]
          },
          instance(mockWhereBuilder)
        )
      })

      it('should select and sub relations', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectSelectSQLSnapshot(
          {
            relations: [
              {
                name: 'oneTestRelation',
                query: {
                  relations: [{ name: 'testEntityUniDirectional', query: {} }]
                }
              }
            ]
          },
          instance(mockWhereBuilder)
        )
      })
    })
  })

  describe('#update', () => {
    const expectUpdateSQLSnapshot = (query: Query<TestEntity>, whereBuilder: WhereBuilder<TestEntity>): void => {
      const queryBuilder = getEntityQueryBuilder(TestEntity, whereBuilder).update(query).set({ stringType: 'baz' })
      expectSQLSnapshot(queryBuilder)
    }

    describe('with filter', () => {
      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(anything(), query.filter, deepEqual({}), undefined)).thenCall(
          (where: WhereExpressionBuilder) => where.andWhere(`stringType = 'foo'`)
        )
        expectUpdateSQLSnapshot(query, instance(mockWhereBuilder))
      })
    })
    describe('with paging', () => {
      it('should ignore paging args', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot({ paging: { limit: 10, offset: 11 } }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })
    })

    describe('with sorting', () => {
      it('should apply ASC sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot({ sorting: [{ field: 'numberType', direction: SortDirection.ASC }] }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      it('should apply ASC NULLS_FIRST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      it('should apply ASC NULLS_LAST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      it('should apply DESC sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot({ sorting: [{ field: 'numberType', direction: SortDirection.DESC }] }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      it('should apply DESC NULLS_FIRST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_FIRST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      it('should apply DESC NULLS_LAST sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot(
          { sorting: [{ field: 'numberType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }] },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      it('should apply multiple sorts', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectUpdateSQLSnapshot(
          {
            sorting: [
              { field: 'numberType', direction: SortDirection.ASC },
              { field: 'boolType', direction: SortDirection.DESC },
              { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
              { field: 'dateType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }
            ]
          },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })

      describe('on a driver without NULLS FIRST/LAST support (snapshots keep SQLite quoting)', () => {
        beforeEach(() => connection.setOptions({ type: 'mysql' } as Partial<DataSourceOptions>))

        it('should order by an IS NULL key before the unaliased column', () => {
          const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
          expectUpdateSQLSnapshot(
            { sorting: [{ field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }] },
            instance(mockWhereBuilder)
          )
        })

        describe('when the caller orders by the same bare IS NULL expression', () => {
          const callerNullKey = 'numberType IS NULL'
          const callerNullKeySql = '"number_type" IS NULL'
          const sortNumberTypeNullsLast = [
            { field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }
          ] as SortField<TestEntity>[]
          const sortNumberTypeWithoutNulls = [{ field: 'numberType', direction: SortDirection.ASC }] as SortField<TestEntity>[]
          const emulatedNullKeyAscending = '("number_type" IS NULL) ASC'
          const createUpdateQueryBuilder = () =>
            connection.getRepository(TestEntity).createQueryBuilder().update().set({ stringType: 'baz' })

          it('should keep the order by the caller added before sorting', () => {
            const queryBuilder = createUpdateQueryBuilder().orderBy(callerNullKey, 'DESC')

            new FilterQueryBuilder(connection.getRepository(TestEntity)).applySorting(queryBuilder, sortNumberTypeNullsLast)

            expect(orderByItems(queryBuilder)).toEqual([
              `${callerNullKeySql} DESC`,
              emulatedNullKeyAscending,
              '"number_type" ASC'
            ])
          })

          it('should keep the order by the caller added before sorting without nulls', () => {
            const queryBuilder = createUpdateQueryBuilder().orderBy(callerNullKey, 'DESC')

            new FilterQueryBuilder(connection.getRepository(TestEntity)).applySorting(queryBuilder, sortNumberTypeWithoutNulls)

            expect(orderByItems(queryBuilder)).toEqual([`${callerNullKeySql} DESC`, '"number_type" ASC'])
          })

          it('should keep the null placement of the sort when the caller adds the order by after sorting', () => {
            const queryBuilder = new FilterQueryBuilder(connection.getRepository(TestEntity))
              .applySorting(createUpdateQueryBuilder(), sortNumberTypeNullsLast)
              .addOrderBy(callerNullKey, 'DESC')

            expect(orderByItems(queryBuilder)).toEqual([
              emulatedNullKeyAscending,
              '"number_type" ASC',
              `${callerNullKeySql} DESC`
            ])
          })
        })

        it('should share an order by entry with a parenthesised IS NULL expression the caller added before sorting', () => {
          const queryBuilder = connection
            .getRepository(TestEntity)
            .createQueryBuilder()
            .update()
            .set({ stringType: 'baz' })
            .orderBy('(numberType IS NULL)', 'DESC')

          new FilterQueryBuilder(connection.getRepository(TestEntity)).applySorting(queryBuilder, [
            { field: 'numberType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }
          ])

          expect(orderByItems(queryBuilder)).toEqual(['("number_type" IS NULL) ASC', '"number_type" ASC'])
        })
      })
    })
  })

  describe('#delete', () => {
    const expectDeleteSQLSnapshot = (query: Query<TestEntity>, whereBuilder: WhereBuilder<TestEntity>): void => {
      const selectQueryBuilder = getEntityQueryBuilder(TestEntity, whereBuilder).delete(query)
      expectSQLSnapshot(selectQueryBuilder)
    }

    describe('with filter', () => {
      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(anything(), query.filter, deepEqual({}), undefined)).thenCall(
          (where: WhereExpressionBuilder) => where.andWhere(`stringType = 'foo'`)
        )
        expectDeleteSQLSnapshot(query, instance(mockWhereBuilder))
      })
    })
    describe('with paging', () => {
      it('should ignore paging args', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectDeleteSQLSnapshot({ paging: { limit: 10, offset: 11 } }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })
    })

    describe('with sorting', () => {
      it('should ignore sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestEntity>>(WhereBuilder)
        expectDeleteSQLSnapshot(
          {
            sorting: [
              { field: 'numberType', direction: SortDirection.ASC },
              { field: 'boolType', direction: SortDirection.DESC },
              { field: 'stringType', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
              { field: 'dateType', direction: SortDirection.DESC, nulls: SortNulls.NULLS_LAST }
            ]
          },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })
    })
  })

  describe('#softDelete', () => {
    const expectSoftDeleteSQLSnapshot = (
      query: Query<TestSoftDeleteEntity>,
      whereBuilder: WhereBuilder<TestSoftDeleteEntity>
    ): void => {
      const selectQueryBuilder = getEntityQueryBuilder(TestSoftDeleteEntity, whereBuilder).softDelete(query)
      expectSQLSnapshot(selectQueryBuilder)
    }

    describe('with filter', () => {
      it('should call whereBuilder#build if there is a filter', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestSoftDeleteEntity>>(WhereBuilder)
        const query = { filter: { stringType: { eq: 'foo' } } }
        when(mockWhereBuilder.build(anything(), query.filter, deepEqual({}), undefined)).thenCall(
          (where: WhereExpressionBuilder) => where.andWhere(`stringType = 'foo'`)
        )
        expectSoftDeleteSQLSnapshot(query, instance(mockWhereBuilder))
      })
    })
    describe('with paging', () => {
      it('should ignore paging args', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestSoftDeleteEntity>>(WhereBuilder)
        expectSoftDeleteSQLSnapshot({ paging: { limit: 10, offset: 11 } }, instance(mockWhereBuilder))
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })
    })

    describe('with sorting', () => {
      it('should ignore sorting', () => {
        const mockWhereBuilder = mock<WhereBuilder<TestSoftDeleteEntity>>(WhereBuilder)
        expectSoftDeleteSQLSnapshot(
          {
            sorting: [
              { field: 'stringType', direction: SortDirection.ASC },
              { field: 'testEntityPk', direction: SortDirection.DESC }
            ]
          },
          instance(mockWhereBuilder)
        )
        verify(mockWhereBuilder.build(anything(), anything(), anything())).never()
      })
    })
  })
})
