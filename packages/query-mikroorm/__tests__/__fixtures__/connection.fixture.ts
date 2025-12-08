import { MikroORM, Options, EntityManager } from '@mikro-orm/core'
import { SqliteDriver } from '@mikro-orm/sqlite'

import { TestEntity } from './test.entity'
import { TestRelation } from './test-relation.entity'
import { TestSoftDeleteEntity } from './test-soft-delete.entity'
import { seed } from './seeds'

export const CONNECTION_OPTIONS: Options<SqliteDriver> = {
  driver: SqliteDriver,
  dbName: ':memory:',
  entities: [TestEntity, TestRelation, TestSoftDeleteEntity],
  allowGlobalContext: true
}

export async function createTestConnection(): Promise<MikroORM<SqliteDriver>> {
  const orm = await MikroORM.init(CONNECTION_OPTIONS)
  const generator = orm.getSchemaGenerator()
  await generator.createSchema()
  return orm
}

export async function truncate(em: EntityManager): Promise<void> {
  const connection = em.getConnection()
  await connection.execute('DELETE FROM test_relation')
  await connection.execute('DELETE FROM test_entity_many_test_relations')
  await connection.execute('DELETE FROM test_entity')
  await connection.execute('DELETE FROM test_soft_delete_entity')
}

export async function refresh(em: EntityManager): Promise<void> {
  await truncate(em)
  await seed(em.fork())
}
