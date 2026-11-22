import { SortDirection } from '@ptc-org/nestjs-query-core'
import Database from 'better-sqlite3'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { DrizzleQueryService } from '../src'

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
})

const todoItems = sqliteTable('todo_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
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

describe('DrizzleQueryService - read relations', () => {
  let usersService: DrizzleQueryService<{ id: number; name: string }>
  let todosService: DrizzleQueryService<{ id: number; title: string; userId: number }>

  beforeEach(async () => {
    const client = new Database(':memory:')
    client.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
      CREATE TABLE todo_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, user_id INTEGER REFERENCES users(id));
    `)
    const db = drizzle({ client, relations })
    usersService = new DrizzleQueryService<typeof users.$inferSelect>({ db, table: users, relationsKey: 'users' })
    todosService = new DrizzleQueryService<typeof todoItems.$inferSelect>({
      db,
      table: todoItems,
      relationsKey: 'todoItems'
    })

    const [ada, grace] = await usersService.createMany([{ name: 'Ada' }, { name: 'Grace' }])
    await todosService.createMany([
      { title: 'Ada - analytic engine', userId: ada.id },
      { title: 'Ada - notes', userId: ada.id },
      { title: 'Ada - zzz', userId: ada.id },
      { title: 'Grace - compiler', userId: grace.id }
    ])
  })

  it('findRelation returns the related row for a single DTO', async () => {
    const todos = await todosService.query({ filter: { title: { eq: 'Grace - compiler' } } })
    const user = await todosService.findRelation(UserDto, 'user', todos[0])
    expect(user?.name).toBe('Grace')
  })

  it('findRelation returns a Map for an array of DTOs', async () => {
    const todos = await todosService.query({ filter: { title: { like: 'Ada%' } } })
    const map = await todosService.findRelation(UserDto, 'user', todos)
    const names = todos.map((t) => map.get(t)?.name)
    expect(names).toEqual(['Ada', 'Ada', 'Ada'])
  })

  it('queryRelations returns the related rows for a single DTO', async () => {
    const [ada] = await usersService.query({ filter: { name: { eq: 'Ada' } } })
    const todos = await usersService.queryRelations(TodoItemDto, 'todoItems', ada, { filter: {} })
    expect(todos).toHaveLength(3)
  })

  it('queryRelations applies filter, sorting and paging on the relations', async () => {
    const [ada] = await usersService.query({ filter: { name: { eq: 'Ada' } } })
    const todos = await usersService.queryRelations(TodoItemDto, 'todoItems', ada, {
      filter: { title: { like: '%Ada%' } },
      sorting: [{ field: 'title', direction: SortDirection.DESC }],
      paging: { limit: 1 }
    })
    expect(todos.map((t) => t.title)).toEqual(['Ada - zzz'])
  })

  it('queryRelations returns a Map for an array of DTOs', async () => {
    const all = await usersService.query({ filter: {}, sorting: [{ field: 'id', direction: SortDirection.ASC }] })
    const map = await usersService.queryRelations(TodoItemDto, 'todoItems', all, { filter: {} })
    expect(map.get(all[0])).toHaveLength(3)
    expect(map.get(all[1])).toHaveLength(1)
  })

  it('countRelations counts relations for a single DTO', async () => {
    const [ada] = await usersService.query({ filter: { name: { eq: 'Ada' } } })
    expect(await usersService.countRelations(TodoItemDto, 'todoItems', ada, {})).toBe(3)
  })

  it('countRelations returns a Map of counts for an array of DTOs', async () => {
    const all = await usersService.query({ filter: {} })
    const map = await usersService.countRelations(TodoItemDto, 'todoItems', all, {})
    expect(map.get(all[0])).toBe(3)
    expect(map.get(all[1])).toBe(1)
  })
})
