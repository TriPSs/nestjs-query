import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { DrizzleQueryService } from '../src'

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  age: integer('age')
})

type User = typeof users.$inferSelect

describe('DrizzleQueryService - filters', () => {
  let service: DrizzleQueryService<User>

  beforeEach(async () => {
    const client = new Database(':memory:')
    client.exec('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INTEGER)')
    const db = drizzle({ client })
    service = new DrizzleQueryService<User>({ db, table: users })
    await service.createMany([
      { name: 'Ada Lovelace', age: 36 },
      { name: 'Grace Hopper', age: 45 },
      { name: 'Hedy Lamarr', age: null }
    ])
  })

  it.each([
    ['eq', { age: { eq: 36 } }, ['Ada Lovelace']],
    ['neq', { age: { neq: 36 } }, ['Grace Hopper']], // SQL semantics: NULL is excluded, like the TypeORM adapter
    ['gt', { age: { gt: 36 } }, ['Grace Hopper']],
    ['gte', { age: { gte: 36 } }, ['Ada Lovelace', 'Grace Hopper']],
    ['lt', { age: { lt: 45 } }, ['Ada Lovelace']],
    ['lte', { age: { lte: 45 } }, ['Ada Lovelace', 'Grace Hopper']],
    ['in', { age: { in: [36, 45] } }, ['Ada Lovelace', 'Grace Hopper']],
    ['notIn', { age: { notIn: [36, 45] } }, []], // SQL semantics: NULL is excluded
    ['is null', { age: { is: null } }, ['Hedy Lamarr']],
    ['is value', { name: { is: 'Hedy Lamarr' } }, ['Hedy Lamarr']],
    ['isNot null', { age: { isNot: null } }, ['Ada Lovelace', 'Grace Hopper']],
    ['isNot value', { name: { isNot: 'Hedy Lamarr' } }, ['Ada Lovelace', 'Grace Hopper']],
    ['between', { age: { between: [37, 44] } }, []],
    ['notBetween', { age: { notBetween: [37, 44] } }, ['Ada Lovelace', 'Grace Hopper']], // SQL semantics: NULL is excluded
    ['like', { name: { like: 'Grace%' } }, ['Grace Hopper']],
    ['notLike', { name: { notLike: '%Hopper' } }, ['Ada Lovelace', 'Hedy Lamarr']],
    ['iLike', { name: { iLike: 'ada%' } }, ['Ada Lovelace']],
    ['notILike', { name: { notILike: '%lovelace' } }, ['Grace Hopper', 'Hedy Lamarr']]
  ])('supports %s', async (_op, filter, expected) => {
    const rows = await service.query({ filter })
    expect(rows.map((u) => u.name)).toEqual(expected)
  })

  it('combines top level fields with AND', async () => {
    const rows = await service.query({ filter: { name: { like: 'A%' }, age: { isNot: null } } })
    expect(rows.map((u) => u.name)).toEqual(['Ada Lovelace'])
  })

  it('supports nested and/or groups', async () => {
    const rows = await service.query({
      filter: {
        or: [{ name: { like: 'Grace%' } }, { and: [{ age: { gte: 36 } }, { age: { lt: 40 } }] }]
      }
    })
    expect(rows.map((u) => u.name)).toEqual(['Ada Lovelace', 'Grace Hopper'])
  })

  it('rejects unknown filter fields', async () => {
    await expect(service.query({ filter: { nickname: { eq: 'x' } } as never })).rejects.toThrow('Unknown filter field: nickname')
  })

  it('rejects unsupported operators', async () => {
    await expect(service.query({ filter: { name: { regex: 'x' } } as never })).rejects.toThrow(
      'Unsupported filter operator: regex'
    )
  })
})
