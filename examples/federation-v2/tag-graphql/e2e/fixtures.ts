import { DataSource } from 'typeorm'

import { executeTruncate } from '../../../helpers'
import { TagEntity } from '../src/tag/tag.entity'
import { TagTodoItemEntity } from '../src/tag/tag-todo-item.entity'

const tables = ['tag_todo_item', 'tag']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const tagsRepo = dataSource.getRepository(TagEntity)
  const tagTodoItemRepo = dataSource.getRepository(TagTodoItemEntity)

  const urgentTag = await tagsRepo.save({ name: 'Urgent' })
  const homeTag = await tagsRepo.save({ name: 'Home' })
  const workTag = await tagsRepo.save({ name: 'Work' })
  const questionTag = await tagsRepo.save({ name: 'Question' })
  const blockedTag = await tagsRepo.save({ name: 'Blocked' })

  await tagTodoItemRepo.save([
    { tag: urgentTag, todoItemId: 1 },
    { tag: urgentTag, todoItemId: 2 },
    { tag: homeTag, todoItemId: 1 },
    { tag: homeTag, todoItemId: 4 },
    { tag: workTag, todoItemId: 2 },
    { tag: workTag, todoItemId: 3 },
    { tag: questionTag, todoItemId: 5 },
    { tag: blockedTag, todoItemId: 3 },
    { tag: blockedTag, todoItemId: 4 },
    { tag: blockedTag, todoItemId: 5 }
  ])
}
