import { Connection } from 'typeorm'

import { executeTruncate } from '../../../examples/helpers'
import { SubTaskEntity } from '../src/sub-task/sub-task.entity'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'

const tables = ['todo_item']
export const truncate = async (connection: Connection): Promise<void> => executeTruncate(connection, tables)

export const refresh = async (connection: Connection): Promise<void> => {
  await truncate(connection)

  const todoRepo = connection.getRepository(TodoItemEntity)
  const subTaskRepo = connection.getRepository(SubTaskEntity)

  const savedTodos = await todoRepo.save(
    todoRepo.create([
      { title: 'Create Nest App', completed: true },
      { title: 'Create Entity', completed: false },
      { title: 'Create Entity Service', completed: false },
      { title: 'Add Todo Item Resolver', completed: false },
      { title: 'How to create item With Sub Tasks', completed: false }
    ])
  )

  await subTaskRepo.save(
    savedTodos.reduce(
      (subTasks, todo) => [
        ...subTasks,

        { completed: true, title: `${todo.title} - Sub Task 1`, todoItem: todo },
        { completed: false, title: `${todo.title} - Sub Task 2`, todoItem: todo },
        { completed: false, title: `${todo.title} - Sub Task 3`, todoItem: todo }
      ],
      [] as Partial<SubTaskEntity>[]
    )
  )
}
