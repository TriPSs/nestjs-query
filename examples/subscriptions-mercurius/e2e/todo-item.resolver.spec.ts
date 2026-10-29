import { INestApplication, ValidationPipe } from '@nestjs/common'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { refresh } from './fixtures'
import { createSubscriptionClient } from './ws.helper'

describe('TodoItemResolver subscriptions (mercurius - e2e)', () => {
  let app: INestApplication
  let url: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
        forbidUnknownValues: true
      })
    )

    await app.listen(0)
    url = await app.getUrl()
  })

  afterAll(async () => {
    await refresh(app.get(DataSource))
    await app.close()
  })

  const createTodo = (input: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { input },
        query: `mutation createTodo($input: TodoItemInput!) {
          createOneTodoItem(input: { todoItem: $input }) { id title completed }
        }`
      })
      .expect(200)

  it('should deliver created events over the websocket', async () => {
    await refresh(app.get(DataSource))
    const client = await createSubscriptionClient(url)

    client.subscribe(`subscription {
      createdTodoItem { id title completed }
    }`)

    const response = await createTodo({ title: 'Ws Created', completed: false })

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.createdTodoItem.title).toBe('Ws Created')
    expect(response.body.data.createOneTodoItem.title).toBe('Ws Created')

    await client.close()
  })

  it('should apply the client filter to created events', async () => {
    await refresh(app.get(DataSource))
    const client = await createSubscriptionClient(url)

    client.subscribe(`subscription {
      createdTodoItem(input: { filter: { title: { eq: "Matching" } } }) { id title completed }
    }`)

    await createTodo({ title: 'Not Matching', completed: false })
    await client.expectNoEvents()

    await createTodo({ title: 'Matching', completed: false })

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.createdTodoItem.title).toBe('Matching')

    await client.close()
  })

  it('should apply authorization scoping through the subscription resolvers', async () => {
    await refresh(app.get(DataSource))
    const client = await createSubscriptionClient(url)

    client.subscribe(`subscription {
      updatedOneTodoItem { id title }
    }`)

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { id: 1, input: { completed: true } },
        query: `mutation updateTodo($id: ID!, $input: TodoItemUpdate!) {
          updateOneTodoItem(input: { id: $id, update: $input }) { id completed }
        }`
      })
      .expect(200)

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.updatedOneTodoItem.id).toBe('1')

    client.subscribe(`subscription { deletedOneTodoItem { id } }`)
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: { id: 1 },
        query: `mutation deleteTodo($id: ID!) { deleteOneTodoItem(input: { id: $id }) { id } }`
      })
      .expect(200)

    const deletedEvent = await client.next()
    expect(deletedEvent.payload.errors).toBeUndefined()

    await client.close()
  })

  it('should return a standard error payload', () =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({ operationName: null, variables: {}, query: '{ todoItems { id ' })
      .expect(400)
      .then(({ body }) => {
        expect(Array.isArray(body.errors)).toBe(true)
        expect(body.errors.length).toBeGreaterThan(0)
        expect(typeof body.errors[0].message).toBe('string')
        expect(body.data).toBeNull()
      }))
})
