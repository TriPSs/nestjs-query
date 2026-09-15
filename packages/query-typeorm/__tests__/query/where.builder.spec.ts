import { Filter, FilterComparisonOperators } from '@ptc-org/nestjs-query-core'
import { format as formatSql } from 'sql-formatter'
import { DataSource, Repository } from 'typeorm'

import {
  EntityComparisonField,
  FilterQueryBuilder,
  NestedRelationsAliased,
  SQLComparisonBuilder,
  WhereBuilder
} from '../../src/query'
import { createTestConnection } from '../__fixtures__/connection.fixture'
import { TestEntity } from '../__fixtures__/test.entity'
import { TestRelation } from '../__fixtures__/test-relation.entity'
import { TestVirtualColumnEntity } from '../__fixtures__/test-virtual-column.entity'

describe('WhereBuilder', (): void => {
  let dataSource: DataSource
  beforeEach(async () => {
    dataSource = await createTestConnection()
  })
  afterEach(() => dataSource.destroy())

  const getRepo = () => dataSource.getRepository(TestEntity)
  const getQueryBuilder = () => getRepo().createQueryBuilder()
  const createWhereBuilder = () => new WhereBuilder<TestEntity>()

  const expectSQLSnapshot = (filter: Filter<TestEntity>): void => {
    const selectQueryBuilder = createWhereBuilder().build(getQueryBuilder(), filter, {}, 'TestEntity')
    const [sql, params] = selectQueryBuilder.getQueryAndParameters()

    expect(formatSql(sql, { params })).toMatchSnapshot()
  }

  it('should accept a empty filter', (): void => {
    expectSQLSnapshot({})
  })

  it('or multiple operators for a single field together', (): void => {
    expectSQLSnapshot({ numberType: { gt: 10, lt: 20, gte: 21, lte: 31 } })
  })

  it('and multiple field comparisons together', (): void => {
    expectSQLSnapshot({ numberType: { eq: 1 }, stringType: { like: 'foo%' }, boolType: { is: true } })
  })

  describe('and', (): void => {
    it('and multiple expressions together', (): void => {
      expectSQLSnapshot({
        and: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }, { numberType: { gte: 30 } }, { numberType: { lte: 40 } }]
      })
    })

    it('and multiple filters together with multiple fields', (): void => {
      expectSQLSnapshot({
        and: [
          { numberType: { gt: 10 }, stringType: { like: 'foo%' } },
          { numberType: { lt: 20 }, stringType: { like: '%bar' } }
        ]
      })
    })

    it('should support nested ors', (): void => {
      expectSQLSnapshot({
        and: [
          { or: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }] },
          { or: [{ numberType: { gte: 30 } }, { numberType: { lte: 40 } }] }
        ]
      })
    })

    it('should properly group AND with a sibling field comparison', (): void => {
      expectSQLSnapshot({ and: [{ numberType: { gt: 2 } }, { numberType: { lt: 10 } }], stringType: { eq: 'foo' } })
    })
  })

  describe('or', (): void => {
    it('or multiple expressions together', (): void => {
      expectSQLSnapshot({
        or: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }, { numberType: { gte: 30 } }, { numberType: { lte: 40 } }]
      })
    })

    it('and multiple and filters together', (): void => {
      expectSQLSnapshot({
        or: [
          { numberType: { gt: 10 }, stringType: { like: 'foo%' } },
          { numberType: { lt: 20 }, stringType: { like: '%bar' } }
        ]
      })
    })

    it('should support nested ands', (): void => {
      expectSQLSnapshot({
        or: [
          { and: [{ numberType: { gt: 10 } }, { numberType: { lt: 20 } }] },
          { and: [{ numberType: { gte: 30 } }, { numberType: { lte: 40 } }] }
        ]
      })
    })

    it('should properly group OR with a sibling field comparison', (): void => {
      expectSQLSnapshot({ or: [{ numberType: { eq: 2 } }, { numberType: { gt: 10 } }], stringType: { eq: 'foo' } })
    })
  })

  describe('custom SQLComparisonBuilder', (): void => {
    const createRepoWithVirtualColumn = (databasePath: string) =>
      ({
        metadata: {
          columns: [{ databasePath, isVirtualProperty: true, query: (alias: string) => `SELECT 1 FROM ${alias}` }]
        }
      }) as unknown as Repository<TestEntity>

    const buildFilterSql = (
      sqlComparisonBuilder: SQLComparisonBuilder<TestEntity>,
      filter: Filter<TestEntity>,
      relationNames: NestedRelationsAliased = {}
    ): string => {
      const [sql] = new WhereBuilder<TestEntity>(sqlComparisonBuilder)
        .build(getQueryBuilder(), filter, relationNames, 'TestEntity')
        .getQueryAndParameters()

      return sql
    }

    it('should not resolve relation fields against the root entity metadata', (): void => {
      const sqlComparisonBuilder = new SQLComparisonBuilder<TestEntity>(
        SQLComparisonBuilder.DEFAULT_COMPARISON_MAP,
        createRepoWithVirtualColumn('relationName')
      )
      const rootFilter = { relationName: { eq: 'foo' } } as unknown as Filter<TestEntity>
      const relationFilter = { testRelations: { relationName: { eq: 'foo' } } } as Filter<TestEntity>
      const relationNames = {
        testRelations: { alias: 'TestRelation', metadata: dataSource.getMetadata(TestRelation), relations: {} }
      }

      expect(buildFilterSql(sqlComparisonBuilder, rootFilter)).toContain('SELECT 1 FROM')
      expect(buildFilterSql(sqlComparisonBuilder, relationFilter, relationNames)).toContain('TestRelation.relationName')
      expect(buildFilterSql(sqlComparisonBuilder, relationFilter, relationNames)).not.toContain('SELECT 1 FROM')
    })
  })

  describe('virtual columns', (): void => {
    const buildVirtualColumnFilterSql = (
      filter: Filter<TestVirtualColumnEntity>,
      createWhereBuilderFor?: (repo: Repository<TestVirtualColumnEntity>) => WhereBuilder<TestVirtualColumnEntity>
    ): string => {
      const repo = dataSource.getRepository(TestVirtualColumnEntity)
      const [sql] = new FilterQueryBuilder<TestVirtualColumnEntity>(repo, createWhereBuilderFor?.(repo))
        .applyFilter(repo.createQueryBuilder('TestVirtualColumnEntity'), filter, 'TestVirtualColumnEntity')
        .getQueryAndParameters()

      return sql.replace(/"/g, '')
    }

    it('should compare a root virtual column with its query', (): void => {
      const sql = buildVirtualColumnFilterSql({ relationCount: { gt: 1 } })

      expect(sql).toContain(
        '((SELECT COUNT(*) FROM test_virtual_column_relation WHERE test_virtual_column_entity_id = TestVirtualColumnEntity.test_virtual_column_pk) > 1)'
      )
      expect(sql).not.toContain('TestVirtualColumnEntity.relationCount')
    })

    it('should compare a relation virtual column with its query aliased to the relation', (): void => {
      const sql = buildVirtualColumnFilterSql({ virtualColumnRelations: { siblingCount: { gt: 1 } } })

      expect(sql).toContain(
        '((SELECT COUNT(*) FROM test_virtual_column_relation WHERE test_virtual_column_entity_id = virtualColumnRelations.test_virtual_column_entity_id) > 1)'
      )
      expect(sql).not.toContain('virtualColumnRelations.siblingCount')
    })

    it('should compare a root virtual column with its query when a subclass overrides build', (): void => {
      class CollatedComparisonBuilder<Entity> extends SQLComparisonBuilder<Entity> {
        public build<F extends keyof Entity>(
          field: F,
          cmp: FilterComparisonOperators<Entity[F]>,
          val: EntityComparisonField<Entity, F>,
          alias?: string
        ) {
          const { sql, params } = super.build(field, cmp, val, alias)

          return { sql: `${sql} COLLATE BINARY`, params }
        }
      }

      const sql = buildVirtualColumnFilterSql(
        { relationCount: { gt: 1 } },
        (repo) =>
          new WhereBuilder<TestVirtualColumnEntity>(
            new CollatedComparisonBuilder<TestVirtualColumnEntity>(SQLComparisonBuilder.DEFAULT_COMPARISON_MAP, repo)
          )
      )

      expect(sql).toContain(
        '(SELECT COUNT(*) FROM test_virtual_column_relation WHERE test_virtual_column_entity_id = TestVirtualColumnEntity.test_virtual_column_pk) > 1 COLLATE BINARY'
      )
      expect(sql).not.toContain('TestVirtualColumnEntity.relationCount')
    })
  })
})
