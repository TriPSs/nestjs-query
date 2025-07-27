import { getModelToken } from '@m8a/nestjs-typegoose'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'

import { AppModule } from '../src/app.module'
import { TodoTaskDTO } from '../src/todo-item/dto/todo-task.dto'
import { TodoItemEntity } from '../src/todo-item/entities/todo-item.entity'
import { TODO_TASK_FRAGMENT } from './graphql-fragments'

describe('Typegoose Discriminators with Custom Assemblers', () => {
  let app: INestApplication
  let todoItemModel: Model<TodoItemEntity>

  const taskTitle = `Task ${Date.now()}`

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
    todoItemModel = moduleRef.get<Model<TodoItemEntity>>(getModelToken(TodoItemEntity.name))
  })

  beforeEach(async () => {
    await todoItemModel.deleteMany({})
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  it('should create a new TodoTask with a custom assembler', async () => {
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
