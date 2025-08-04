// eslint-disable-next-line import/no-extraneous-dependencies
import { DataSource } from 'typeorm'

import { TodoItem } from '../entities/todo-item.entity'
import { TodoList } from '../entities/todo-list.entity'

export const createTestData = async (dataSource: DataSource) => {
  // Clear existing data
  await dataSource.getRepository(TodoItem).delete({})
  await dataSource.getRepository(TodoList).delete({})

  // Create 5 TodoLists (matching your demo scenario)
  const todoLists = []
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        listId: list.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        content: `Item ${j} in ${list.name}`
      })
      todoItems.push(item)
    }
  }

  console.log(`Created ${todoLists.length} TodoLists and ${todoItems.length} TodoItems`)
  return { todoLists, todoItems }
}
