import { DataSource } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { SubSubTaskEntity } from '../src/sub-sub-task/sub-sub-task.entity'
import { SubTaskEntity } from '../src/sub-task/sub-task.entity'
import { TagEntity } from '../src/tag/tag.entity'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'
import { UserEntity } from '../src/user/user.entity'

const tables = ['todo_item', 'sub_task', 'tag', 'user']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const userRepo = dataSource.getRepository(UserEntity)
  const todoRepo = dataSource.getRepository(TodoItemEntity)
  const subTaskRepo = dataSource.getRepository(SubTaskEntity)
  const subSubTaskRepo = dataSource.getRepository(SubSubTaskEntity)
  const tagsRepo = dataSource.getRepository(TagEntity)

  const users = await userRepo.save([
    { username: 'nestjs-query', password: '123' },
    { username: 'nestjs-query-2', password: '123' },
    { username: 'nestjs-query-3', password: '123' }
  ])

  const urgentTag = await tagsRepo.save({ name: 'Urgent' })
  const homeTag = await tagsRepo.save({ name: 'Home' })
  const workTag = await tagsRepo.save({ name: 'Work' })
  const questionTag = await tagsRepo.save({ name: 'Question' })
  const blockedTag = await tagsRepo.save({ name: 'Blocked' })

  const todoItems: TodoItemEntity[] = await users.reduce(
    async (prev, user) => {
      const allTodos = await prev
      const userTodos = await todoRepo.save([
        { title: 'Create Nest App', completed: true, priority: 0, tags: [urgentTag, homeTag], owner: user },
        { title: 'Create Entity', completed: false, priority: 1, tags: [urgentTag, workTag], owner: user },
        { title: 'Create Entity Service', completed: false, priority: 2, tags: [blockedTag, workTag], owner: user },
        { title: 'Add Todo Item Resolver', completed: false, priority: 3, tags: [blockedTag, homeTag], owner: user },
        {
          title: 'How to create item With Sub Tasks',
          completed: false,
          priority: 4,
          tags: [questionTag, blockedTag],
          owner: user
        }
      ])
      return [...allTodos, ...userTodos]
    },
    Promise.resolve([] as TodoItemEntity[])
  )

  const subTasks: SubTaskEntity[] = await subTaskRepo.save(
    todoItems.flatMap(
      (todo) => [
        { completed: true, title: `${todo.title} - Sub Task 1`, todoItem: todo, ownerId: todo.ownerId },
        { completed: false, title: `${todo.title} - Sub Task 2`, todoItem: todo, ownerId: todo.ownerId },
        { completed: false, title: `${todo.title} - Sub Task 3`, todoItem: todo, ownerId: todo.ownerId }
      ],
      []
    )
  )

  await subSubTaskRepo.save(
    subTasks.flatMap(
      (parent) => [
        { subTask: parent, title: `${parent.title} - Sub Sub Task Public`, public: true },
        { subTask: parent, title: `${parent.title} - Sub Sub Task Private`, public: false }
      ],
      []
    )
  )
}
