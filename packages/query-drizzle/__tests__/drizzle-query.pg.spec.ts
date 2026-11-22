import { SortDirection } from '@ptc-org/nestjs-query-core'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'

import { DrizzleQueryService } from '../src'

// Reuses the postgres service from examples/docker-compose.yml (port 5436, trust auth).
const PG_URL = process.env.DRIZZLE_PG_URL ?? 'postgres://nestjs_query@localhost:5436/postgres'

const users = pgTable('drizzle_test_users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  age: integer('age')
})

const todoItems = pgTable('drizzle_test_todo_items', {
  id: serial('id').primaryKey(),
  title: varchar('title').notNull(),
  userId: integer('user_id').references(() => users.id)
})

const relations = defineRelations({ users, todoItems }, (r) => ({
  users: { todoItems: r.many.todoItems() },
  todoItems: { user: r.one.users({ from: r.todoItems.userId, to: r.users.id }) }
}))

class UserDto {
  name!: string
}
class TodoItemDto {
  title!: string
}

const pool = new Pool({ connectionString: PG_URL })
let pgAvailable = true
try {
  await pool.query('select 1')
} catch {
  pgAvailable = false
}

describe.skipIf(!pgAvailable)('DrizzleQueryService - Postgres', () => {
  let usersService: DrizzleQueryService<{ id: number; name: string; age: number | null }>
  let todosService: DrizzleQueryService<{ id: number; title: string; userId: number }>

  beforeAll(async () => {
    await pool.query('DROP TABLE IF EXISTS drizzle_test_todo_items')
    await pool.query('DROP TABLE IF EXISTS drizzle_test_users')
    await pool.query(`
      CREATE TABLE drizzle_test_users (id SERIAL PRIMARY KEY, name VARCHAR NOT NULL, age INTEGER);
      CREATE TABLE drizzle_test_todo_items (id SERIAL PRIMARY KEY, title VARCHAR NOT NULL, user_id INTEGER REFERENCES drizzle_test_users(id));
    `)
    const db = drizzle({ client: pool, relations })
    usersService = new DrizzleQueryService<typeof users.$inferSelect>({
      db,
      table: users,
      relationsKey: 'users',
      relations
    })
    todosService = new DrizzleQueryService<typeof todoItems.$inferSelect>({
      db,
      table: todoItems,
      relationsKey: 'todoItems',
      relations
    })
  })

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS drizzle_test_todo_items')
    await pool.query('DROP TABLE IF EXISTS drizzle_test_users')
    await pool.end()
  })

  it('creates, reads, updates and deletes rows', async () => {
    const created = await usersService.createOne({ name: 'Ada', age: 36 })
    expect(created.id).toBeGreaterThan(0)

    expect((await usersService.getById(created.id)).name).toBe('Ada')

    const updated = await usersService.updateOne(created.id, { age: 37 })
    expect(updated.age).toBe(37)

    const deleted = await usersService.deleteOne(created.id)
    expect(deleted.name).toBe('Ada')
    await expect(usersService.getById(created.id)).rejects.toThrow()
  })

  it('filters with nested and/or', async () => {
    const [ada] = await usersService.createMany([
      { name: 'Ada Lovelace', age: 36 },
      { name: 'Grace Hopper', age: 45 },
      { name: 'Hedy Lamarr', age: null }
    ])
    expect(ada.age).toBe(36)

    const rows = await usersService.query({
      filter: {
        or: [{ name: { like: 'Grace%' } }, { and: [{ age: { gte: 30 } }, { age: { lt: 40 } }] }]
      },
      sorting: [{ field: 'id', direction: SortDirection.ASC }]
    })
    expect(rows.map((u) => u.name)).toEqual(['Ada Lovelace', 'Grace Hopper'])
    expect(rows.length).toBeGreaterThanOrEqual(2)

    const nulls = await usersService.query({ filter: { age: { is: null } } })
    expect(nulls.map((u) => u.name)).toContain('Hedy Lamarr')
  })

  it('queries relations through the relational query API', async () => {
    const [ada] = await usersService.query({ filter: { name: { eq: 'Ada Lovelace' } } })
    await todosService.createMany([
      { title: 'Ada - analytic engine', userId: ada.id },
      { title: 'Ada - notes', userId: ada.id }
    ])

    const todos = await usersService.queryRelations(TodoItemDto, 'todoItems', ada, {
      filter: { title: { like: '%Ada%' } },
      sorting: [{ field: 'title', direction: SortDirection.ASC }],
      paging: { limit: 1 }
    })
    expect(todos.map((t) => t.title)).toEqual(['Ada - analytic engine'])

    const [todo] = await todosService.query({ filter: { title: { eq: 'Ada - notes' } } })
    const user = await todosService.findRelation(UserDto, 'user', todo)
    expect(user?.name).toBe('Ada Lovelace')
  })

  it('counts relations with a grouped SQL COUNT', async () => {
    const all = await usersService.query({ filter: {}, sorting: [{ field: 'id', direction: SortDirection.ASC }] })
    const map = await usersService.countRelations(TodoItemDto, 'todoItems', all, { title: { like: '%Ada%' } })
    expect(map.get(all[0])).toBe(2)
  })
})
