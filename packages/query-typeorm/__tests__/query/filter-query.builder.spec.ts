import { Class, Filter, Query, SortDirection, SortNulls } from '@souagrosolucoes/nestjs-query-core'
import { format as formatSql } from 'sql-formatter'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { DataSource, QueryBuilder, WhereExpressionBuilder } from 'typeorm'

import { FilterQueryBuilder, WhereBuilder } from '../../src/query'
import { createTestConnection } from '../__fixtures__/connection.fixture'
import { TestEntity } from '../__fixtures__/test.entity'
import { TestSoftDeleteEntity } from '../__fixtures__/test-soft-delete.entity'

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

  describe('#getReferencedRelationsWithAliasRecursive', () => {
    it('with deeply nested and / or', () => {
      const complexQuery: Filter<TestEntity> = {
        and: [
          {
            oneTestRelation: {
              manyTestEntities: {
                //@ts-ignore
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
          relations: {
            manyTestEntities: {
              alias: 'manyTestEntities',
              relations: {
                oneTestRelation: {
                  alias: 'oneTestRelation_1',
                  relations: {
                    manyTestEntities: {
                      alias: 'manyTestEntities_1',
                      relations: {}
                    }
                  }
                }
              }
            },

            relationOfTestRelation: {
              alias: 'relationOfTestRelation',
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
              //@ts-ignore
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
                  //@ts-ignore
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
          relations: {}
        },

        oneTestRelation: {
          alias: 'oneTestRelation',
          relations: {
            relationsOfTestRelation: {
              alias: 'relationsOfTestRelation',
              relations: {}
            },

            testEntity: {
              alias: 'testEntity',
              relations: {
                testRelations: {
                  alias: 'testRelations_1',
                  relations: {}
                }
              }
            }
          }
        }
      })
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
              //@ts-ignore
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
