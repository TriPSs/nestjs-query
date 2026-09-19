import { DataSource } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'

const tables = ['todo_item']

export const truncate = async (connection: DataSource): Promise<void> => executeTruncate(connection, tables)

export const refresh = async (connection: DataSource): Promise<void> => {
  await truncate(connection)

  await connection.getRepository(TodoItemEntity).save([
    { title: 'Seed One', completed: true },
    { title: 'Seed Two', completed: false }
  ])
}
