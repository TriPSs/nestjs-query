// eslint-disable-next-line import/no-extraneous-dependencies
import { DataSource } from 'typeorm'

import { TodoItem } from '../entities/todo-item.entity'
import { TodoList } from '../entities/todo-list.entity'

export const createTestData = async (dataSource: DataSource) => {
  // Clear existing data (must delete items first due to foreign key)
  await dataSource.getRepository(TodoItem).deleteAll()
  await dataSource.getRepository(TodoList).deleteAll()

  // Create 5 TodoLists (matching your demo scenario)
  const todoLists: TodoList[] = []
  for (let i = 1; i <= 5; i++) {
    const list = await dataSource.getRepository(TodoList).save({
      name: `List ${i}`
    })
    todoLists.push(list)
  }

  // Create 11 TodoItems for each TodoList (matching your demo: 0-10 = 11 items)
  const todoItems = []
  for (const list of todoLists) {
    for (let j = 0; j <= 10; j++) {
      const item = await dataSource.getRepository(TodoItem).save({
        listId: list.id,
        content: `Item ${j} in ${list.name}`
      })
      todoItems.push(item)
    }
  }

  console.log(`Created ${todoLists.length} TodoLists and ${todoItems.length} TodoItems`)
  return { todoLists, todoItems }
}
