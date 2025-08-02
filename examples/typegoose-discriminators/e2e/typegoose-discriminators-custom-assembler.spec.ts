import { getModelToken } from '@m8a/nestjs-typegoose'
import { INestApplication } from '@nestjs/common'
import { Model } from 'mongoose'
import request from 'supertest'

import { TodoItemEntity } from '../src/todo-item/entities/todo-item.entity'
import { TODO_TASK_FRAGMENT } from './graphql-fragments'
import { TodoTaskEntity } from '../src/todo-item/entities/todo-task.entity'

describe('Typegoose Discriminators with Custom Assemblers', () => {
  let app: INestApplication
  let todoItemModel: Model<TodoItemEntity>
  let todoTaskModel: Model<TodoTaskEntity>

  beforeEach(async () => {
    const { createCustomAssemblerTestModule } = await import('./test-setup')
    const moduleRef = await createCustomAssemblerTestModule()

    app = moduleRef.createNestApplication()
    await app.init()
    todoItemModel = moduleRef.get<Model<TodoItemEntity>>(getModelToken(TodoItemEntity.name))
    todoTaskModel = moduleRef.get<Model<TodoTaskEntity>>(getModelToken(TodoTaskEntity.name))
  })

  afterEach(async () => {
    if (app) {
      await todoItemModel.deleteMany({})
      await todoTaskModel.deleteMany({})
      await app.close()
    }
  })

  it('should create a new TodoTask with a custom assembler', async () => {
    const taskTitle = `Task ${Date.now()}`
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateTodoTask($input: CreateOneTodoTaskInput!) {
            createOneTodoTask(input: $input) {
              ...TodoTaskFragment
            }
          }
          ${TODO_TASK_FRAGMENT}
        `,
        variables: {
          input: {
            todoTask: {
              title: taskTitle,
              completed: false,
              priority: 1
            }
          }
        }
      })

    expect(response.body.errors).toBeUndefined()
    const task = response.body.data.createOneTodoTask
    expect(task.title).toBe(`[task] ${taskTitle}`)
    expect(task.documentType).toBe('TodoTaskEntity')
  })
})