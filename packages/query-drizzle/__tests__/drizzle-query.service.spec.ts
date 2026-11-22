import { SortDirection } from '@ptc-org/nestjs-query-core'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { DrizzleQueryService } from '../src'

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  age: integer('age')
})

describe('DrizzleQueryService - CRUD', () => {
  let service: DrizzleQueryService<{ id: number; name: string; age: number | null }>

  beforeEach(() => {
    const client = new Database(':memory:')
    client.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age INTEGER);
    `)
    const db = drizzle({ client })
    service = new DrizzleQueryService<typeof users.$inferSelect>({ db, table: users })
  })

  it('createOne inserts and returns the row', async () => {
    const created = await service.createOne({ name: 'Ada', age: 36 })
    expect(created.id).toBe(1)
    const found = await service.findById(1)
    expect(found?.name).toBe('Ada')
  })

  it('createMany inserts several rows and returns them', async () => {
    const created = await service.createMany([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 }
    ])
    expect(created).toHaveLength(2)
    expect(created.map((u) => u.name)).toEqual(['Ada', 'Grace'])
  })

  it('findById returns undefined when missing', async () => {
    const found = await service.findById(42)
    expect(found).toBeUndefined()
  })

  it('getById rejects when the record is missing', async () => {
    await expect(service.getById(42)).rejects.toThrow()
  })

  it('query returns all rows', async () => {
    await service.createMany([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 }
    ])
    const rows = await service.query({ filter: {} })
    expect(rows).toHaveLength(2)
  })

  it('query applies sorting', async () => {
    await service.createMany([
      { name: 'Grace', age: 45 },
      { name: 'Ada', age: 36 }
    ])
    const rows = await service.query({
      filter: {},
      sorting: [{ field: 'name', direction: SortDirection.ASC }]
    })
    expect(rows.map((u) => u.name)).toEqual(['Ada', 'Grace'])
  })

  it('query applies offset paging', async () => {
    await service.createMany([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 }
    ])
    const rows = await service.query({ filter: {}, paging: { limit: 1, offset: 1 } })
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Grace')
  })

  it('count returns the number of matching rows', async () => {
    await service.createMany([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 }
    ])
    expect(await service.count({})).toBe(2)
  })

  it('updateOne updates and returns the row', async () => {
    await service.createOne({ name: 'Ada', age: 36 })
    const updated = await service.updateOne(1, { age: 37 })
    expect(updated.age).toBe(37)
    expect(updated.name).toBe('Ada')
  })

  it('deleteOne returns the deleted row', async () => {
    await service.createOne({ name: 'Ada', age: 36 })
    const deleted = await service.deleteOne(1)
    expect(deleted.name).toBe('Ada')
    expect(await service.count({})).toBe(0)
  })

  it('deleteMany deletes by filter and returns the deleted count', async () => {
    await service.createMany([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 45 }
    ])
    const result = await service.deleteMany({ age: { gt: 40 } })
    expect(result.deletedCount).toBe(1)
    expect(await service.count({})).toBe(1)
  })
})
