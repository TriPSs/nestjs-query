import { DataSource } from 'typeorm'

import { executeTruncate } from '../../../../helpers'
import { SubTaskEntity } from '../../src/sub-task/sub-task.entity'

const tables = ['sub_task']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const todoItems = [
    { id: 1, title: 'Create Nest App' },
    { id: 2, title: 'Create Entity' },
    { id: 3, title: 'Create Entity Service' },
    { id: 4, title: 'Add Todo Item Resolver' },
    { id: 5, title: 'How to create item With Sub Tasks' }
  ]
  const subTaskRepo = dataSource.getRepository(SubTaskEntity)

  await subTaskRepo.save(
    todoItems.reduce(
      (subTasks, todo) => [
        ...subTasks,
        { completed: true, title: `${todo.title} - Sub Task 1`, todoItemId: todo.id },
        { completed: false, title: `${todo.title} - Sub Task 2`, todoItemId: todo.id },
        { completed: false, title: `${todo.title} - Sub Task 3`, todoItemId: todo.id }
      ],
      [] as Partial<SubTaskEntity>[]
    )
  )
}

export * from './graphql-fragments'
