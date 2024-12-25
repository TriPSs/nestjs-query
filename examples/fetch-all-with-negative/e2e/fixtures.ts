import { DataSource } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'

const tables = ['todo_item']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export let todoItems: TodoItemEntity[]

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const todoRepo = dataSource.getRepository(TodoItemEntity)

  todoItems = await todoRepo.save(
    Array.from({ length: 100 }, (_, index) => ({
      title: `todoTitle${index + 1}`,
      completed: index % 2 === 0
    }))
  )
}
