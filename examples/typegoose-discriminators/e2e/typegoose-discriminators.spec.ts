import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TodoTaskDTO } from '../src/todo-item/dto/todo-task.dto';
import { TodoAppointmentDTO } from '../src/todo-item/dto/todo-appointment.dto';
import { getModelToken } from '@m8a/nestjs-typegoose';
import { TodoItemEntity } from '../src/todo-item/entities/todo-item.entity';
import { Model } from 'mongoose';
import { TODO_TASK_FRAGMENT, TODO_APPOINTMENT_FRAGMENT } from './graphql-fragments';

describe('Typegoose Discriminators with Concrete DTOs', () => {
  let app: INestApplication;
  let todoItemModel: Model<TodoItemEntity>;

  // Variables to hold the created entities so we can use them across tests
  let task: TodoTaskDTO;
  let appointment: TodoAppointmentDTO;
  const taskTitle = `Task ${Date.now()}`;
  const appointmentTitle = `Appointment ${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    todoItemModel = moduleRef.get<Model<TodoItemEntity>>(getModelToken(TodoItemEntity.name));
  });

  beforeEach(async () => {
    await todoItemModel.deleteMany({});
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('create', () => {
    it('should create a new TodoTask', async () => {
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
                priority: 1,
              },
            },
          },
        });

      expect(response.body.errors).toBeUndefined();
      task = response.body.data.createOneTodoTask;
      expect(task.title).toBe(taskTitle);
      expect(task.documentType).toBe('TodoTaskEntity');
    });

    it('should create a new TodoAppointment', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateTodoAppointment($input: CreateOneTodoAppointmentInput!) {
              createOneTodoAppointment(input: $input) {
                ...TodoAppointmentFragment
              }
            }
            ${TODO_APPOINTMENT_FRAGMENT}
          `,
          variables: {
            input: {
              todoAppointment: {
                title: appointmentTitle,
                completed: false,
                dateTime: new Date(),
                participants: ['Me', 'You'],
              },
            },
          },
        });

      expect(response.body.errors).toBeUndefined();
      appointment = response.body.data.createOneTodoAppointment;
      expect(appointment.title).toBe(appointmentTitle);
      expect(appointment.documentType).toBe('TodoAppointmentEntity');
    });
  });

  describe('query and filter', () => {
    beforeEach(async () => {
      // Create a task and an appointment before each test in this block
      const createTaskResponse = await request(app.getHttpServer())
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
                priority: 1,
              },
            },
          },
        });
      task = createTaskResponse.body.data.createOneTodoTask;

      const createAppointmentResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateTodoAppointment($input: CreateOneTodoAppointmentInput!) {
              createOneTodoAppointment(input: $input) {
                ...TodoAppointmentFragment
              }
            }
            ${TODO_APPOINTMENT_FRAGMENT}
          `,
          variables: {
            input: {
              todoAppointment: {
                title: appointmentTitle,
                completed: false,
                dateTime: new Date(),
                participants: ['Me', 'You'],
              },
            },
          },
        });
      appointment = createAppointmentResponse.body.data.createOneTodoAppointment;
    });

    it('should query for all items and verify both are returned', async () => {
      const queryAllResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoItems {
                edges {
                  node {
                    id
                    title
                    documentType
                  }
                }
              }
            }
          `,
        });
      expect(queryAllResponse.body.errors).toBeUndefined();
      expect(queryAllResponse.body.data.todoItems.edges).toHaveLength(2);
      const titles = queryAllResponse.body.data.todoItems.edges.map((e: any) => e.node.title);
      expect(titles).toContain(taskTitle);
      expect(titles).toContain(appointmentTitle);
    });

    it('should filter on a base field', async () => {
      const filterByTitleResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoItems(filter: { title: { eq: "${taskTitle}" } }) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `,
        });
      expect(filterByTitleResponse.body.errors).toBeUndefined();
      expect(filterByTitleResponse.body.data.todoItems.edges).toHaveLength(1);
      expect(filterByTitleResponse.body.data.todoItems.edges[0].node.id).toBe(task.id);
    });

    it('should filter on a discriminated field', async () => {
      const filterByPriorityResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoTasks(filter: { priority: { eq: 1 } }) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `,
        });
      expect(filterByPriorityResponse.body.errors).toBeUndefined();
      expect(filterByPriorityResponse.body.data.todoTasks.edges).toHaveLength(1);
      expect(filterByPriorityResponse.body.data.todoTasks.edges[0].node.id).toBe(task.id);
    });
  });

  describe('update and delete', () => {
    beforeEach(async () => {
      // Create a task and an appointment before each test in this block
      const createTaskResponse = await request(app.getHttpServer())
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
                priority: 1,
              },
            },
          },
        });
      task = createTaskResponse.body.data.createOneTodoTask;

      const createAppointmentResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateTodoAppointment($input: CreateOneTodoAppointmentInput!) {
              createOneTodoAppointment(input: $input) {
                ...TodoAppointmentFragment
              }
            }
            ${TODO_APPOINTMENT_FRAGMENT}
          `,
          variables: {
            input: {
              todoAppointment: {
                title: appointmentTitle,
                completed: false,
                dateTime: new Date(),
                participants: ['Me', 'You'],
              },
            },
          },
        });
      appointment = createAppointmentResponse.body.data.createOneTodoAppointment;
    });

    it('should update the task', async () => {
      const updatedTaskTitle = `Updated Task ${Date.now()}`;
      const updateTaskResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation UpdateTodoTask($input: UpdateOneTodoTaskInput!) {
              updateOneTodoTask(input: $input) {
                ...TodoTaskFragment
              }
            }
            ${TODO_TASK_FRAGMENT}
          `,
          variables: {
            input: {
              id: task.id,
              update: {
                title: updatedTaskTitle,
              },
            },
          },
        });
      expect(updateTaskResponse.body.errors).toBeUndefined();
      expect(updateTaskResponse.body.data.updateOneTodoTask.title).toBe(updatedTaskTitle);
    });

    it('should delete the appointment', async () => {
      const deleteAppointmentResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              deleteOneTodoAppointment(input: { id: "${appointment.id}" }) {
                id
              }
            }
          `,
        });
      expect(deleteAppointmentResponse.body.errors).toBeUndefined();
      expect(deleteAppointmentResponse.body.data.deleteOneTodoAppointment.id).toBe(appointment.id);

      // 8. Verify the appointment is deleted
      const queryAllAfterDeleteResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoItems {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `,
        });
      expect(queryAllAfterDeleteResponse.body.errors).toBeUndefined();
      expect(queryAllAfterDeleteResponse.body.data.todoItems.edges).toHaveLength(1);
      expect(queryAllAfterDeleteResponse.body.data.todoItems.edges[0].node.id).toBe(task.id);
    });
  });
});