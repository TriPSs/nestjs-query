import { getModelToken } from '@m8a/nestjs-typegoose';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import request from 'supertest';
import { TodoTaskDTO } from '../src/todo-item/dto/todo-task.dto';
import { TodoItemEntity } from '../src/todo-item/entities/todo-item.entity';
import { TODO_TASK_FRAGMENT } from './graphql-fragments';


describe('Typegoose Discriminators with full override test 1', () => {
  let app: INestApplication;
  let todoItemModel: Model<TodoItemEntity>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    const { createFullOverrideTestModule1 } = await import('./test-setup');
    moduleRef = await createFullOverrideTestModule1();
    app = moduleRef.createNestApplication();
    await app.init();
    todoItemModel = moduleRef.get<Model<TodoItemEntity>>(getModelToken(TodoItemEntity.name));
  });

  afterEach(async () => {
    await todoItemModel.deleteMany({});
  });

  afterAll(async () => {
    if (app) {
      await todoItemModel.deleteMany({});
      await app.close();
    }
  });

  async function createTestTask(title: string, completed = false): Promise<TodoTaskDTO> {
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
              title,
              completed,
              priority: 1
            }
          }
        }
      });

    expect(response.body.errors).toBeUndefined();
    return response.body.data.createOneTodoTask;
  }

  describe('custom service', () => {
    it('should mark all tasks as complete', async () => {
      await createTestTask('Task 1');
      await createTestTask('Task 2');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              markAllAsComplete 
            }
          `
        });

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.markAllAsComplete).toBe(2);

      const tasks = await todoItemModel.find({ documentType: 'TodoTaskEntity' });
      expect(tasks.every((task) => task.completed)).toBe(true);
    });
  });
});
