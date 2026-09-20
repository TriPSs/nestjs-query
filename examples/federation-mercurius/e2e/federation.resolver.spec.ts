import { NestFastifyApplication } from '@nestjs/platform-fastify'
import request from 'supertest'

import { GATEWAY_PORT } from '../ports'
import { seedTodoItem, seedUser, startApplications, stopApplications, TestApplications, truncateApplications } from './fixtures'
import { createSubscriptionClient } from './ws.helper'

describe('Federation subscriptions (mercurius gateway - e2e)', () => {
  let apps: TestApplications
  let gateway: NestFastifyApplication

  beforeAll(async () => {
    apps = await startApplications()
    gateway = apps.gatewayApp
  })

  afterAll(async () => {
    await stopApplications(apps)
  })

  beforeEach(async () => {
    await truncateApplications(apps)
  })

  const graphql = async (query: string) => {
    const res = await request(gateway.getHttpServer()).post('/graphql').send({ query }).expect(200)
    expect(res.body.errors).toBeUndefined()
    return res
  }

  it('should deliver todo item events published by the mercurius subgraph', async () => {
    const client = await createSubscriptionClient(`http://localhost:${GATEWAY_PORT}`)
    client.subscribe('subscription { createdTodoItem { id title } }')

    const res = await graphql(
      'mutation { createOneTodoItem(input: { todoItem: { title: "From gateway", completed: false } }) { id title } }'
    )

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.createdTodoItem.title).toBe('From gateway')
    expect(Number(res.body.data.createOneTodoItem.id)).toBe(Number(event.payload.data.createdTodoItem.id))

    await client.close()
  })

  it('should deliver user events published by the apollo subgraph', async () => {
    const client = await createSubscriptionClient(`http://localhost:${GATEWAY_PORT}`)
    client.subscribe('subscription { createdUser { id name } }')

    await graphql('mutation { createOneUser(input: { user: { name: "Jane", email: "jane@example.com" } }) { id } }')

    const event = await client.next()
    expect(event.payload.errors).toBeUndefined()
    expect(event.payload.data.createdUser.name).toBe('Jane')

    await client.close()
  })

  it('should resolve federated entities across subgraphs', async () => {
    const user = await seedUser(apps, 'Jane')
    await seedTodoItem(apps, 'With assignee', user.id)

    const res = await graphql('{ todoItems { edges { node { title assignee { name } } } } }')

    expect(res.body.errors).toBeUndefined()
    expect(res.body.data.todoItems.edges).toHaveLength(1)
    expect(res.body.data.todoItems.edges[0].node.assignee.name).toBe('Jane')
  })

  it('should resolve federated entities inside subscription payloads', async () => {
    const user = await seedUser(apps, 'Jane')

    const client = await createSubscriptionClient(`http://localhost:${GATEWAY_PORT}`)
    client.subscribe('subscription { createdTodoItem { id title assignee { name } } }')

    await graphql(
      `mutation { createOneTodoItem(input: { todoItem: { title: "Enriched", completed: false, assigneeId: ${user.id} } }) { id } }`
    )

    const event = await client.next()
    expect(event.payload.data.createdTodoItem.assignee?.name).toBe('Jane')

    await client.close()
  })
})
