import { MikroORM, Options } from '@mikro-orm/core'
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite'

import { seed } from './seeds'
import { TestEntity } from './test.entity'
import { TestRelation } from './test-relation.entity'

export const CONNECTION_OPTIONS: Options<BetterSqliteDriver> = {
  driver: BetterSqliteDriver,
  dbName: ':memory:',
  entities: [TestEntity, TestRelation],
  allowGlobalContext: true,
}

export async function createTestConnection(): Promise<MikroORM<BetterSqliteDriver>> {
  const orm = await MikroORM.init(CONNECTION_OPTIONS)
  const generator = orm.getSchemaGenerator()
  await generator.createSchema()
  return orm
}

export async function truncate(orm: MikroORM<BetterSqliteDriver>): Promise<void> {
  const em = orm.em.fork()
  await em.nativeDelete(TestRelation, {})
  await em.nativeDelete(TestEntity, {})
}

export async function refresh(orm: MikroORM<BetterSqliteDriver>): Promise<void> {
  await truncate(orm)
  const em = orm.em.fork()
  await seed(em)
}
