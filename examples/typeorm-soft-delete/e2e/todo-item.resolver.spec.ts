import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getDataSourceToken } from '@nestjs/typeorm'
import { CursorConnectionType } from '@ptc-org/nestjs-query-graphql'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { SubTaskEntity } from '../src/sub-task/sub-task.entity'
import { TodoItemDTO } from '../src/todo-item/dto/todo-item.dto'
import { refresh } from './fixtures'
import { edgeNodes, pageInfoField, todoItemFields, todoItemWithTagsFields } from './graphql-fragments'

describe('SoftDelete - TodoItemResolver (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
        forbidUnknownValues: true
      })
    )

    await app.init()
    await refresh(app.get(DataSource))
  })

  afterAll(() => refresh(app.get(DataSource)))

  describe('find one', () => {
    it(`should find a todo item by id`, () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
          todoItem(id: 1) {
            ${todoItemFields}
          }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body).toEqual({
            data: {
              todoItem: { id: '1', title: 'Create Nest App', completed: true, description: null }
            }
          })
        }))

    it(`should throw item not found on non existing todo item`, () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
          todoItem(id: 100) {
            ${todoItemFields}
          }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(body.errors[0].message).toContain('Unable to find')
        }))
  })

  describe('query', () => {
    it(`should return a connection`, () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
          todoItems {
            ${pageInfoField}
            ${edgeNodes(todoItemFields)}
          }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItems
          expect(pageInfo).toEqual({
            endCursor: 'YXJyYXljb25uZWN0aW9uOjQ=',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
          })
          expect(edges).toHaveLength(5)
          expect(edges.map((e) => e.node)).toEqual([
            { id: '1', title: 'Create Nest App', completed: true, description: null },
            { id: '2', title: 'Create Entity', completed: false, description: null },
            { id: '3', title: 'Create Entity Service', completed: false, description: null },
            { id: '4', title: 'Add Todo Item Resolver', completed: false, description: null },
            { id: '5', title: 'How to create item With Sub Tasks', completed: false, description: null }
          ])
        }))

    it(`should allow querying`, () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
          todoItems(filter: { id: { in: [1, 2, 3] } }) {
            ${pageInfoField}
            ${edgeNodes(todoItemFields)}
          }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItems
          expect(pageInfo).toEqual({
            endCursor: 'YXJyYXljb25uZWN0aW9uOjI=',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
          })
          expect(edges).toHaveLength(3)
          expect(edges.map((e) => e.node)).toEqual([
            { id: '1', title: 'Create Nest App', completed: true, description: null },
            { id: '2', title: 'Create Entity', completed: false, description: null },
            { id: '3', title: 'Create Entity Service', completed: false, description: null }
          ])
        }))

    it(`should allow sorting`, () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
          todoItems(sorting: [{field: id, direction: DESC}]) {
            ${pageInfoField}
            ${edgeNodes(todoItemFields)}
          }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItems
          expect(pageInfo).toEqual({
            endCursor: 'YXJyYXljb25uZWN0aW9uOjQ=',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
          })
          expect(edges).toHaveLength(5)
          expect(edges.map((e) => e.node)).toEqual([
            { id: '5', title: 'How to create item With Sub Tasks', completed: false, description: null },
            { id: '4', title: 'Add Todo Item Resolver', completed: false, description: null },
            { id: '3', title: 'Create Entity Service', completed: false, description: null },
            { id: '2', title: 'Create Entity', completed: false, description: null },
            { id: '1', title: 'Create Nest App', completed: true, description: null }
          ])
        }))

    it(`should return deletedTodos and their subTasks`, async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
            mutation {
              deleteManyTodoItems(
                input: {
                  filter: {id: { in: ["1"]} },
                }
              ) {
                deletedCount
              }
            }
          `
        })
        .expect(200, {
          data: {
            deleteManyTodoItems: {
              deletedCount: 1
            }
          }
        })

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
            mutation {
              deleteManySubTasks(
                input: {
                  filter: {todoItemId: { in: ["1"]} },
                }
              ) {
                deletedCount
              }
            }
          `
        })
        .expect(200, {
          data: {
            deleteManySubTasks: {
              deletedCount: 3
            }
          }
        })

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
            {
              todoItemsWithDeleted {
                ${pageInfoField}
                ${edgeNodes(`
                  ${todoItemFields}

                  subTasksCount
                  subTasks {
                    id
                  }
                `)}
              }
            }
          `
        })
        .expect(200)
        .then(({ body }) => {
          const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItemsWithDeleted

          expect(pageInfo).toEqual({
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
            endCursor: 'YXJyYXljb25uZWN0aW9uOjQ='
          })

          const description = null
          const subTasksCount = 3
          const subTasks = [
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) })
          ]

          expect(edges).toHaveLength(5)
          expect(edges.map((e) => e.node)).toEqual(
            expect.arrayContaining([
              {
                id: '1',
                title: 'Create Nest App',
                completed: true,
                description,
                subTasksCount,
                subTasks
              },

              {
                id: '2',
                title: 'Create Entity',
                completed: false,
                description,
                subTasksCount,
                subTasks
              },

              {
                id: '3',
                title: 'Create Entity Service',
                completed: false,
                description,
                subTasksCount,
                subTasks
              },

              {
                id: '4',
                title: 'Add Todo Item Resolver',
                completed: false,
                description,
                subTasksCount,
                subTasks
              },

              {
                id: '5',
                title: 'How to create item With Sub Tasks',
                completed: false,
                description,
                subTasksCount,
                subTasks
              }
            ])
          )
        })

      const ds = app.get(getDataSourceToken())
      await ds.getRepository(SubTaskEntity).restore({ todoItemId: '1' })

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `
            mutation {
              restoreOneTodoItem(
                input: "1"
              ) {
                id
              }
            }
          `
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.data.restoreOneTodoItem).toEqual({ id: '1' })
        })
    })

    it(`should return the todos with their tags`, async () => {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `{
          todoItems {
            ${pageInfoField}
            ${edgeNodes(todoItemWithTagsFields)}
          }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItems
          expect(pageInfo).toEqual({
            endCursor: 'YXJyYXljb25uZWN0aW9uOjQ=',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
          })
          expect(edges).toHaveLength(5)
          expect(edges.map((e) => e.node)).toEqual([
            { id: '1', title: 'Create Nest App', toTags: [{ tag: { id: '1', name: 'To Review' } }] },
            { id: '2', title: 'Create Entity', toTags: [{ tag: { id: '1', name: 'To Review' } }] },
            { id: '3', title: 'Create Entity Service', toTags: [{ tag: { id: '1', name: 'To Review' } }] },
            {
              id: '4',
              title: 'Add Todo Item Resolver',
              toTags: [{ tag: { id: '2', name: 'Reviewed' } }]
            },
            { id: '5', title: 'How to create item With Sub Tasks', toTags: [{ tag: { id: '2', name: 'Reviewed' } }] }
          ])
        })
    })

    describe('paging', () => {
      it(`should allow paging with the 'first' field`, () =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            operationName: null,
            variables: {},
            query: `
              {
                todoItems(
                  paging: {first: 2}
                  sorting: [{field: id, direction: ASC}]
                ) {
                  ${pageInfoField}
                  ${edgeNodes(todoItemFields)}
                }
              }
            `
          })
          .expect(200)
          .then(({ body }) => {
            const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItems
            expect(pageInfo).toEqual({
              endCursor: 'YXJyYXljb25uZWN0aW9uOjE=',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
            })
            expect(edges).toHaveLength(2)
            expect(edges.map((e) => e.node)).toEqual([
              { id: '1', title: 'Create Nest App', completed: true, description: null },
              { id: '2', title: 'Create Entity', completed: false, description: null }
            ])
          }))

      it(`should allow paging with the 'first' field and 'after'`, () =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            operationName: null,
            variables: {},
            query: `
              {
                todoItems(
                  paging: {first: 2, after: "YXJyYXljb25uZWN0aW9uOjE="}
                  sorting: [{field: id, direction: ASC}]
                ) {
                  ${pageInfoField}
                  ${edgeNodes(todoItemFields)}
                }
              }
            `
          })
          .expect(200)
          .then(({ body }) => {
            const { edges, pageInfo }: CursorConnectionType<TodoItemDTO> = body.data.todoItems
            expect(pageInfo).toEqual({
              endCursor: 'YXJyYXljb25uZWN0aW9uOjM=',
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjI='
            })
            expect(edges).toHaveLength(2)
            expect(edges.map((e) => e.node)).toEqual([
              { id: '3', title: 'Create Entity Service', completed: false, description: null },
              { id: '4', title: 'Add Todo Item Resolver', completed: false, description: null }
            ])
          }))
    })
  })

  describe('create one', () => {
    it('should allow creating a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            createOneTodoItem(
              input: {
                todoItem: { title: "Test Todo", completed: false }
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200, {
          data: {
            createOneTodoItem: {
              id: '6',
              title: 'Test Todo',
              completed: false
            }
          }
        }))

    it('should validate a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            createOneTodoItem(
              input: {
                todoItem: { title: "Test Todo with a too long title!", completed: false }
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(JSON.stringify(body.errors[0])).toContain('title must be shorter than or equal to 20 characters')
        }))
  })

  describe('create many', () => {
    it('should allow creating a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            createManyTodoItems(
              input: {
                todoItems: [
                  { title: "Many Test Todo 1", completed: false },
                  { title: "Many Test Todo 2", completed: true }
                ]
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200, {
          data: {
            createManyTodoItems: [
              { id: '7', title: 'Many Test Todo 1', completed: false },
              { id: '8', title: 'Many Test Todo 2', completed: true }
            ]
          }
        }))

    it('should validate a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            createManyTodoItems(
              input: {
                todoItems: [{ title: "Test Todo With A Really Long Title", completed: false }]
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(JSON.stringify(body.errors[0])).toContain('title must be shorter than or equal to 20 characters')
        }))
  })

  describe('update one', () => {
    it('should allow updating a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            updateOneTodoItem(
              input: {
                id: "6",
                update: { title: "Update Test Todo", completed: true }
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200, {
          data: {
            updateOneTodoItem: {
              id: '6',
              title: 'Update Test Todo',
              completed: true
            }
          }
        }))

    it('should require an id', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            updateOneTodoItem(
              input: {
                update: { title: "Update Test Todo With A Really Long Title" }
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(body.errors[0].message).toBe('Field "UpdateOneTodoItemInput.id" of required type "ID!" was not provided.')
        }))

    it('should validate an update', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            updateOneTodoItem(
              input: {
                id: "6",
                update: { title: "Update Test Todo With A Really Long Title" }
              }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(JSON.stringify(body.errors[0])).toContain('title must be shorter than or equal to 20 characters')
        }))
  })

  describe('update many', () => {
    it('should allow updating a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            updateManyTodoItems(
              input: {
                filter: {id: { in: ["7", "8"]} },
                update: { title: "Update Many Test", completed: true }
              }
            ) {
              updatedCount
            }
        }`
        })
        .expect(200, {
          data: {
            updateManyTodoItems: {
              updatedCount: 2
            }
          }
        }))

    it('should require a filter', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            updateManyTodoItems(
              input: {
                update: { title: "Update Many Test", completed: true }
              }
            ) {
              updatedCount
            }
        }`
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(body.errors[0].message).toBe(
            'Field "UpdateManyTodoItemsInput.filter" of required type "TodoItemUpdateFilter!" was not provided.'
          )
        }))

    it('should require a non-empty filter', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            updateManyTodoItems(
              input: {
                filter: { },
                update: { title: "Update Many Test", completed: true }
              }
            ) {
              updatedCount
            }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(JSON.stringify(body.errors[0])).toContain('filter must be a non-empty object')
        }))
  })

  describe('delete one', () => {
    it('should allow deleting a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            deleteOneTodoItem(
              input: { id: "6" }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(200, {
          data: {
            deleteOneTodoItem: {
              id: '6',
              title: 'Update Test Todo',
              completed: true
            }
          }
        }))

    it('should require an id', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            deleteOneTodoItem(
              input: { }
            ) {
              id
              title
              completed
            }
        }`
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(body.errors[0].message).toBe('Field "DeleteOneTodoItemInput.id" of required type "ID!" was not provided.')
        }))
  })

  describe('delete many', () => {
    it('should allow updating a todoItem', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            deleteManyTodoItems(
              input: {
                filter: {id: { in: ["7", "8"]} },
              }
            ) {
              deletedCount
            }
        }`
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            data: {
              deleteManyTodoItems: {
                deletedCount: expect.any(Number)
              }
            }
          })
        }))

    it('should require a filter', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            deleteManyTodoItems(
              input: { }
            ) {
              deletedCount
            }
        }`
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(body.errors[0].message).toBe(
            'Field "DeleteManyTodoItemsInput.filter" of required type "TodoItemDeleteFilter!" was not provided.'
          )
        }))

    it('should require a non-empty filter', () =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          variables: {},
          query: `mutation {
            deleteManyTodoItems(
              input: {
                filter: { },
              }
            ) {
              deletedCount
            }
        }`
        })
        .expect(200)
        .then(({ body }) => {
          expect(body.errors).toHaveLength(1)
          expect(JSON.stringify(body.errors[0])).toContain('filter must be a non-empty object')
        }))
  })

  afterAll(async () => {
    await app.close()
  })
})
