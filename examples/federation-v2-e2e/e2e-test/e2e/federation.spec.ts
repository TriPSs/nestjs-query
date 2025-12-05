import { GraphQLClient } from 'graphql-request'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000/graphql'

const client = new GraphQLClient(GATEWAY_URL)

interface User {
  id: string
  name: string
  email: string
}

interface Tag {
  id: string
  name: string
}

interface TodoItem {
  id: string
  title: string
  assignee: User | null
  tag: Tag | null
}

interface TodoItemEdge {
  node: TodoItem
}

interface TodoItemsResponse {
  todoItems: {
    edges: TodoItemEdge[]
  }
}

interface UsersResponse {
  users: {
    edges: { node: User }[]
  }
}

interface TagsResponse {
  tags: {
    edges: { node: Tag }[]
  }
}

describe('Federation V2 E2E Tests - Issue #410', () => {
  describe('Reference Resolution', () => {
    it('should resolve TodoItems with User and Tag references', async () => {
      const query = `{
        todoItems {
          edges {
            node {
              id
              title
              assignee { id name email }
              tag { id name }
            }
          }
        }
      }`

      const response = await client.request<TodoItemsResponse>(query)

      expect(response.todoItems).toBeDefined()
      expect(response.todoItems.edges.length).toBeGreaterThan(0)
    })

    it('should resolve User reference with numeric ID', async () => {
      const query = `{
        todoItems {
          edges {
            node {
              id
              title
              assignee { id name email }
            }
          }
        }
      }`

      const response = await client.request<TodoItemsResponse>(query)
      const todoWithAssignee = response.todoItems.edges.find((e) => e.node.assignee !== null)

      expect(todoWithAssignee).toBeDefined()
      expect(todoWithAssignee?.node.assignee).not.toBeNull()
      expect(todoWithAssignee?.node.assignee?.id).toBeDefined()
      expect(todoWithAssignee?.node.assignee?.name).toBeDefined()
      expect(todoWithAssignee?.node.assignee?.email).toBeDefined()

      // Verify numeric ID format (should be a number string like "1", "2")
      expect(todoWithAssignee?.node.assignee?.id).toMatch(/^\d+$/)
    })

    it('should resolve Tag reference with UUID string ID', async () => {
      const query = `{
        todoItems {
          edges {
            node {
              id
              title
              tag { id name }
            }
          }
        }
      }`

      const response = await client.request<TodoItemsResponse>(query)
      const todoWithTag = response.todoItems.edges.find((e) => e.node.tag !== null)

      expect(todoWithTag).toBeDefined()
      expect(todoWithTag?.node.tag).not.toBeNull()
      expect(todoWithTag?.node.tag?.id).toBeDefined()
      expect(todoWithTag?.node.tag?.name).toBeDefined()

      // Verify UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(todoWithTag?.node.tag?.id).toMatch(uuidRegex)
    })
  })

  describe('Subgraph Services', () => {
    it('should query users from User service', async () => {
      const query = `{
        users {
          edges {
            node { id name email }
          }
        }
      }`

      const response = await client.request<UsersResponse>(query)

      expect(response.users.edges.length).toBeGreaterThanOrEqual(2)

      const alice = response.users.edges.find((e) => e.node.name === 'Alice')
      expect(alice).toBeDefined()
      expect(alice?.node.email).toBe('alice@example.com')
    })

    it('should query tags from Tag service', async () => {
      const query = `{
        tags {
          edges {
            node { id name }
          }
        }
      }`

      const response = await client.request<TagsResponse>(query)

      expect(response.tags.edges.length).toBeGreaterThanOrEqual(3)

      const frontendTag = response.tags.edges.find((e) => e.node.name === 'Frontend')
      expect(frontendTag).toBeDefined()

      // Verify UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      expect(frontendTag?.node.id).toMatch(uuidRegex)
    })
  })

  describe('Issue #410 Verification', () => {
    it('representation parameter should not be undefined', async () => {
      // This test verifies that the @Parent() decorator fix works
      // Before the fix, representation was undefined causing "Cannot read property 'id' of undefined"
      const query = `{
        todoItems {
          edges {
            node {
              assignee { id }
              tag { id }
            }
          }
        }
      }`

      // If representation is undefined, this query would fail with an error
      const response = await client.request<TodoItemsResponse>(query)

      // Count resolved references
      const resolvedAssignees = response.todoItems.edges.filter((e) => e.node.assignee !== null).length
      const resolvedTags = response.todoItems.edges.filter((e) => e.node.tag !== null).length

      expect(resolvedAssignees).toBeGreaterThan(0)
      expect(resolvedTags).toBeGreaterThan(0)
    })

    it('should handle ID type mismatch between representation and entity', async () => {
      // This test verifies the String(id) fix for Map lookups
      // Federation sends numeric IDs as numbers, but entity IDs might be strings (or vice versa)
      const query = `{
        todoItems {
          edges {
            node {
              id
              assignee { id name }
              tag { id name }
            }
          }
        }
      }`

      const response = await client.request<TodoItemsResponse>(query)

      // All todos should have their references resolved correctly
      for (const edge of response.todoItems.edges) {
        // Assignee and tag may be null, but if present, they should have valid data
        const { assignee, tag } = edge.node
        expect(assignee === null || (assignee.id !== undefined && assignee.name !== undefined)).toBe(true)
        expect(tag === null || (tag.id !== undefined && tag.name !== undefined)).toBe(true)
      }
    })
  })
})
