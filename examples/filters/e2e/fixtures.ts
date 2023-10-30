import { DataSource } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'

const tables = ['todo_item']
export const truncate = async (connection: DataSource): Promise<void> => executeTruncate(connection, tables)

export const refresh = async (connection: DataSource): Promise<void> => {
  await truncate(connection)

  const todoRepo = connection.getRepository(TodoItemEntity)

  await todoRepo.save([
    { title: 'Create Nest App', completed: true, 'todo item description': null },
    { title: 'Create Entity', completed: false, 'todo item description': null },
    { title: 'Create Entity Service', completed: false, 'todo item description': null },
    { title: 'Add Todo Item Resolver', completed: false, 'todo item description': null },
    {
      title: 'How to create item With Sub Tasks',
      completed: false,
      'todo item description': 'test description'
    }
  ])
}
