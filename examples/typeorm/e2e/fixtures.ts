import { DataSource } from 'typeorm'

import { executeTruncate } from '../../../examples/helpers'
import { SubTaskEntity } from '../src/sub-task/sub-task.entity'
import { TagEntity } from '../src/tag/tag.entity'
import { TodoItemEntity } from '../src/todo-item/todo-item.entity'

/**
 * The `fakeDate` of the tags, pinned so the `groupBy` aggregate tests are not at the mercy of the
 * calendar. `Urgent` sits one day before the others, which is what lets grouping by `DAY` return two
 * groups while `WEEK` and `MONTH` return one.
 *
 * Tue 7 and Wed 8 of January 2020 share an ISO week (Mon 6 - Sun 12) and a month, so both hold no
 * matter when the suite runs. Deriving them from "today" does not: a run on a Monday puts
 * "yesterday" in the previous ISO week, which is what used to break the `WEEK` test. They are built
 * from local parts because `fakeDate` is a `timestamp without time zone`, so the wall clock written
 * is the one asserted on, whatever the zone of the runner.
 */
const TAG_FAKE_DATES = {
  urgent: new Date(2020, 0, 7, 12),
  rest: new Date(2020, 0, 8, 12)
}

const tables = ['todo_item', 'sub_task', 'tag']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const todoRepo = dataSource.getRepository(TodoItemEntity)
  const subTaskRepo = dataSource.getRepository(SubTaskEntity)
  const tagsRepo = dataSource.getRepository(TagEntity)

  const urgentTag = await tagsRepo.save({ name: 'Urgent', fakeDate: TAG_FAKE_DATES.urgent })
  const homeTag = await tagsRepo.save({ name: 'Home', fakeDate: TAG_FAKE_DATES.rest })
  const workTag = await tagsRepo.save({ name: 'Work', fakeDate: TAG_FAKE_DATES.rest })
  const questionTag = await tagsRepo.save({ name: 'Question', fakeDate: TAG_FAKE_DATES.rest })
  const blockedTag = await tagsRepo.save({ name: 'Blocked', fakeDate: TAG_FAKE_DATES.rest })

  const todoItems = await todoRepo.save([
    { title: 'Create Nest App', completed: true, priority: 0, tags: [urgentTag, homeTag] },
    { title: 'Create Entity', completed: false, priority: 1, tags: [urgentTag, workTag] },
    { title: 'Create Entity Service', completed: false, priority: 2, tags: [blockedTag, workTag] },
    { title: 'Add Todo Item Resolver', completed: false, priority: 3, tags: [blockedTag, homeTag] },
    {
      title: 'How to create item With Sub Tasks',
      completed: false,
      priority: 4,
      tags: [questionTag, blockedTag]
    }
  ])

  const subTasksEntities = todoItems.reduce(
    (subTasks, todo) => [
      ...subTasks,
      { completed: true, title: `${todo.title} - Sub Task 1`, todoItem: todo },
      { completed: false, title: `${todo.title} - Sub Task 2`, todoItem: todo },
      { completed: false, title: `${todo.title} - Sub Task 3`, todoItem: todo }
    ],
    [] as Partial<SubTaskEntity>[]
  )

  subTasksEntities.pop()

  await subTaskRepo.save(subTasksEntities)
}
