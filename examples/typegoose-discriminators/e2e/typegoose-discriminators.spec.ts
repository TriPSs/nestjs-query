import { getModelToken } from '@m8a/nestjs-typegoose'
import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'

import { SubTaskDTO } from '../src/sub-task/dto/sub-task.dto'
import { TodoAppointmentDTO } from '../src/todo-item/dto/todo-appointment.dto'
import { TodoItemDTO } from '../src/todo-item/dto/todo-item.dto'
import { TodoTaskDTO } from '../src/todo-item/dto/todo-task.dto'
import { TodoItemEntity } from '../src/todo-item/entities/todo-item.entity'
import { TODO_APPOINTMENT_FRAGMENT, TODO_TASK_FRAGMENT } from './graphql-fragments'

describe('Typegoose Discriminators with Concrete DTOs', () => {
  let app: INestApplication
  let todoItemModel: Model<TodoItemEntity>
  let moduleRef: TestingModule

  async function createTestTask(title: string): Promise<TodoTaskDTO> {
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
              completed: false,
              priority: 1
            }
          }
        }
      })

    expect(response.body.errors).toBeUndefined()
    return response.body.data.createOneTodoTask as TodoTaskDTO
  }

  async function createTestAppointment(title: string): Promise<TodoAppointmentDTO> {
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
              title,
              completed: false,
              dateTime: new Date(),
              participants: ['Me', 'You']
            }
          }
        }
      })

    expect(response.body.errors).toBeUndefined()
    return response.body.data.createOneTodoAppointment as TodoAppointmentDTO
  }

  beforeAll(async () => {
    const { createTestModule } = await import('./test-setup')
    moduleRef = await createTestModule()
    app = moduleRef.createNestApplication()
    await app.init()
    todoItemModel = moduleRef.get<Model<TodoItemEntity>>(getModelToken(TodoItemEntity.name))
  })

  afterEach(async () => {
    await todoItemModel.deleteMany({})
  })

  afterAll(async () => {
    if (app) {
      await todoItemModel.deleteMany({})
      await app.close()
    }
  })

  describe('create', () => {
    it('should create a new TodoTask', async () => {
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
      expect(task.title).toBe(taskTitle)
      expect(task.documentType).toBe('TodoTaskEntity')
    })

    it('should create a new TodoAppointment', async () => {
      const appointmentTitle = `Appointment ${Date.now()}`
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
                participants: ['Me', 'You']
              }
            }
          }
        })

      expect(response.body.errors).toBeUndefined()
      const appointment = response.body.data.createOneTodoAppointment
      expect(appointment.title).toBe(appointmentTitle)
      expect(appointment.documentType).toBe('TodoAppointmentEntity')
    })
  })

  describe('query and filter', () => {
    it('should query for all items and verify both are returned', async () => {
      const taskTitle = `Task ${Date.now()}`
      const appointmentTitle = `Appointment ${Date.now()}`
      await createTestTask(taskTitle)
      await createTestAppointment(appointmentTitle)

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
          `
        })
      expect(queryAllResponse.body.errors).toBeUndefined()
      expect(queryAllResponse.body.data.todoItems.edges).toHaveLength(2)
      const edges = queryAllResponse.body.data.todoItems.edges as { node: { title: string } }[]
      const titles = edges.map((e) => e.node.title)
      expect(titles).toContain(taskTitle)
      expect(titles).toContain(appointmentTitle)
    })

    it('should filter on a base field', async () => {
      const taskTitle = `Task ${Date.now()}`
      const task = await createTestTask(taskTitle)
      await createTestAppointment(`Appointment ${Date.now()}`)

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
          `
        })
      expect(filterByTitleResponse.body.errors).toBeUndefined()
      expect(filterByTitleResponse.body.data.todoItems.edges).toHaveLength(1)
      expect(filterByTitleResponse.body.data.todoItems.edges[0].node.id).toBe(task.id)
    })

    it('should filter on a discriminated field', async () => {
      const taskTitle = `Task ${Date.now()}`
      const task = await createTestTask(taskTitle)

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
          `
        })
      expect(filterByPriorityResponse.body.errors).toBeUndefined()
      expect(filterByPriorityResponse.body.data.todoTasks.edges).toHaveLength(1)
      expect(filterByPriorityResponse.body.data.todoTasks.edges[0].node.id).toBe(task.id)
    })

    it('should query a TodoTask and return all fragment fields', async () => {
      const taskTitle = `Task ${Date.now()}`
      const task = await createTestTask(taskTitle)

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoTask(id: "${task.id}") {
                ...TodoTaskFragment
              }
            }
            ${TODO_TASK_FRAGMENT}
          `
        })

      expect(response.body.errors).toBeUndefined()
      const todoTask = response.body.data.todoTask
      expect(todoTask.id).toBe(task.id)
      expect(todoTask.title).toBe(taskTitle)
      expect(todoTask.completed).toBe(false)
      expect(todoTask.documentType).toBe('TodoTaskEntity')
      expect(todoTask.priority).toBe(1)
    })

    it('should query a TodoAppointment and return all fragment fields', async () => {
      const appointmentTitle = `Appointment ${Date.now()}`
      const appointment = await createTestAppointment(appointmentTitle)

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoAppointment(id: "${appointment.id}") {
                ...TodoAppointmentFragment
              }
            }
            ${TODO_APPOINTMENT_FRAGMENT}
          `
        })

      expect(response.body.errors).toBeUndefined()
      const todoAppointment = response.body.data.todoAppointment
      expect(todoAppointment.id).toBe(appointment.id)
      expect(todoAppointment.title).toBe(appointmentTitle)
      expect(todoAppointment.completed).toBe(false)
      expect(todoAppointment.documentType).toBe('TodoAppointmentEntity')
      expect(todoAppointment.dateTime).toBeDefined()
      expect(todoAppointment.participants).toEqual(['Me', 'You'])
    })

    it('should query all todoItems and return fragment fields for each discriminated type', async () => {
      const taskTitle = `Task ${Date.now()}`
      const appointmentTitle = `Appointment ${Date.now()}`
      const task = await createTestTask(taskTitle)
      const appointment = await createTestAppointment(appointmentTitle)

      const response = await request(app.getHttpServer())
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
                    ... on TodoTask {
                      priority
                    }
                    ... on TodoAppointment {
                      dateTime
                      participants
                    }
                  }
                }
              }
            }
          `
        })

      expect(response.body.errors).toBeUndefined()
      const nodes = (response.body.data.todoItems.edges as { node: TodoItemDTO }[]).map((edge) => edge.node)
      expect(nodes).toHaveLength(2)

      const returnedTask = nodes.find((node) => node.id === task.id) as TodoTaskDTO | undefined
      expect(returnedTask).toBeDefined()
      expect(returnedTask.title).toBe(taskTitle)
      expect(returnedTask.documentType).toBe('TodoTaskEntity')
      expect(returnedTask.priority).toBe(1)

      const returnedAppointment = nodes.find((node) => node.id === appointment.id) as TodoAppointmentDTO | undefined
      expect(returnedAppointment).toBeDefined()
      expect(returnedAppointment.title).toBe(appointmentTitle)
      expect(returnedAppointment.documentType).toBe('TodoAppointmentEntity')
      expect(returnedAppointment.dateTime).toBeDefined()
      expect(returnedAppointment.participants).toEqual(['Me', 'You'])
    })
  })

  describe('update and delete', () => {
    it('should update the task', async () => {
      const task = await createTestTask(`Task ${Date.now()}`)
      const updatedTaskTitle = `Updated Task ${Date.now()}`
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
                title: updatedTaskTitle
              }
            }
          }
        })
      expect(updateTaskResponse.body.errors).toBeUndefined()
      expect(updateTaskResponse.body.data.updateOneTodoTask.title).toBe(updatedTaskTitle)
    })

    it('should delete the appointment', async () => {
      const task = await createTestTask(`Task ${Date.now()}`)
      const appointment = await createTestAppointment(`Appointment ${Date.now()}`)

      const deleteAppointmentResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              deleteOneTodoAppointment(input: { id: "${appointment.id}" }) {
                id
              }
            }
          `
        })
      expect(deleteAppointmentResponse.body.errors).toBeUndefined()
      expect(deleteAppointmentResponse.body.data.deleteOneTodoAppointment.id).toBe(appointment.id)

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
          `
        })
      expect(queryAllAfterDeleteResponse.body.errors).toBeUndefined()
      expect(queryAllAfterDeleteResponse.body.data.todoItems.edges).toHaveLength(1)
      expect(queryAllAfterDeleteResponse.body.data.todoItems.edges[0].node.id).toBe(task.id)
    })
  })

  describe('relations', () => {
    // Variables to hold the created entities so we can use them across tests
    let task: TodoTaskDTO
    let appointment: TodoAppointmentDTO
    let taskSubTask: SubTaskDTO
    let appointmentSubTask: SubTaskDTO
    const taskTitle = `Task ${Date.now()}`
    const appointmentTitle = `Appointment ${Date.now()}`
    const subTaskTitle = `Sub Task ${Date.now()}`

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
                priority: 1
              }
            }
          }
        })
      task = createTaskResponse.body.data.createOneTodoTask as TodoTaskDTO

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
                participants: ['Me', 'You']
              }
            }
          }
        })
      appointment = createAppointmentResponse.body.data.createOneTodoAppointment as TodoAppointmentDTO

      const createTaskSubTaskResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateSubTask($input: CreateOneSubTaskInput!) {
              createOneSubTask(input: $input) {
                id
                title
              }
            }
          `,
          variables: {
            input: {
              subTask: {
                title: subTaskTitle,
                completed: false,
                todoItem: task.id
              }
            }
          }
        })

      taskSubTask = createTaskSubTaskResponse.body.data.createOneSubTask as SubTaskDTO

      const createAppointmentSubTaskResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateSubTask($input: CreateOneSubTaskInput!) {
              createOneSubTask(input: $input) {
                id
                title
              }
            }
          `,
          variables: {
            input: {
              subTask: {
                title: subTaskTitle,
                completed: false,
                todoItem: appointment.id
              }
            }
          }
        })
      appointmentSubTask = createAppointmentSubTaskResponse.body.data.createOneSubTask
    })

    it('should query for task and its subTasks', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoTask(id: "${task.id}") {
                id
                title
                subTasks {
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
              }
            }
          `
        })

      expect(response.body.errors).toBeUndefined()
      const todoTask = response.body.data.todoTask
      expect(todoTask.id).toBe(task.id)
      expect(todoTask.title).toBe(taskTitle)
      expect(todoTask.subTasks.edges).toHaveLength(1)
      expect(todoTask.subTasks.edges[0].node.id).toBe(taskSubTask.id)
      expect(todoTask.subTasks.edges[0].node.title).toBe(subTaskTitle)
    })

    it('should query for appointment and its subTasks', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              todoAppointment(id: "${appointment.id}") {
                id
                title
                subTasks {
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
              }
            }
          `
        })

      expect(response.body.errors).toBeUndefined()
      const todoAppointment = response.body.data.todoAppointment
      expect(todoAppointment.id).toBe(appointment.id)
      expect(todoAppointment.title).toBe(appointmentTitle)
      expect(todoAppointment.subTasks.edges).toHaveLength(1)
      expect(todoAppointment.subTasks.edges[0].node.id).toBe(appointmentSubTask.id)
      expect(todoAppointment.subTasks.edges[0].node.title).toBe(subTaskTitle)
    })
  })
})
