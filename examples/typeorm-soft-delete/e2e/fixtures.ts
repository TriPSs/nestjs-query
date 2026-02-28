import { DataSource } from 'typeorm'

import { executeTruncate } from '../../../examples/helpers'
import { SubTaskEntity } from '../src/sub-task/sub-task.entity'
import { TagEntity } from '../src/tag/tag.entity'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'
import { TodoToTagEntity } from '../src/todo-to-tag/todo-to-tag.entity'

const tables = ['todo_item']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const todoRepo = dataSource.getRepository(TodoItemEntity)
  const subTaskRepo = dataSource.getRepository(SubTaskEntity)

  const tagRepo = connection.getRepository(TagEntity)
  const todoToTagRepo = connection.getRepository(TodoToTagEntity)

  const savedTodoItems = await todoRepo.save(
    todoRepo.create([
      { title: 'Create Nest App', completed: true },
      { title: 'Create Entity', completed: false },
      { title: 'Create Entity Service', completed: false },
      { title: 'Add Todo Item Resolver', completed: false },
      { title: 'How to create item With Sub Tasks', completed: false }
    ])
  )

  await subTaskRepo.save(
    savedTodoItems.reduce(
      (subTasks, todo) => [
        ...subTasks,

        { completed: true, title: `${todo.title} - Sub Task 1`, todoItem: todo },
        { completed: false, title: `${todo.title} - Sub Task 2`, todoItem: todo },
        { completed: false, title: `${todo.title} - Sub Task 3`, todoItem: todo }
      ],
      [] as Partial<SubTaskEntity>[]
    )
  )

  const tags = await tagRepo.save(tagRepo.create([{ name: 'To Review' }, { name: 'Reviewed' }]))

  await todoToTagRepo.save(
    todoToTagRepo.create([
      { todoID: savedTodoItems[0].id, tagID: tags[0].id },

      { todoID: savedTodoItems[1].id, tagID: tags[0].id },

      { todoID: savedTodoItems[2].id, tagID: tags[0].id },

      // Mark one of the links as deleted.
      { todoID: savedTodoItems[3].id, tagID: tags[0].id, deleted: new Date() },
      { todoID: savedTodoItems[3].id, tagID: tags[1].id },

      // Mark one of the links as deleted.
      { todoID: savedTodoItems[4].id, tagID: tags[0].id, deleted: new Date() },
      { todoID: savedTodoItems[4].id, tagID: tags[1].id }
    ])
  )
}
