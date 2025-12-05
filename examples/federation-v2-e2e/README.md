# Federation V2 E2E Test Environment

E2E test environment for reproducing [issue #410](https://github.com/TriPSs/nestjs-query/issues/410):
"Federation referenceBy broken since v9.2.0: representation parameter undefined"

## Issue Successfully Reproduced ✅

This test environment successfully reproduces the bug where the `@ResolveReference()` method
receives `undefined` for the `representation` parameter when `@Context()` and 
`@InjectDataLoaderConfig()` decorators are present.

## Directory Structure

```
federation-v2-e2e/
├── docker-compose.yml      # Orchestrates all services
├── user-service/           # User subgraph (exposed on host:3001)
│   ├── Dockerfile          # Multi-stage build with nestjs-query
│   └── src/
├── todo-service/           # TodoItem subgraph (exposed on host:3002)
│   ├── Dockerfile          # Multi-stage build with nestjs-query
│   └── src/
├── gateway/                # Apollo Gateway (exposed on host:3000)
│   ├── Dockerfile
│   └── src/
└── init-scripts/           # PostgreSQL initialization
```

## Build Strategy

Each service uses a **multi-stage Docker build**:

1. **Stage 1 (builder)**: Copies the entire nestjs-query source code, installs dependencies, 
   builds all packages, and creates `.tgz` archives using `npm pack`.

2. **Stage 2 (runtime)**: Copies the packed `.tgz` files, installs them as local dependencies,
   then builds and runs the service.

This approach allows testing the **local source code** instead of published npm packages.

## Quick Start

```bash
# From the federation-v2-e2e directory
cd examples/federation-v2-e2e

# 1. Build and start all services
docker compose up -d --build

# 2. Wait for services to be healthy
docker compose ps

# 3. Create a test user
curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createOneUser(input: { user: { name: \"Test User\", email: \"test@example.com\" } }) { id name email } }"}'

# 4. Create a TodoItem with assignee (triggers the bug)
curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createOneTodoItem(input: { todoItem: { title: \"Test Todo\", assigneeId: 1 } }) { id title assignee { id name } } }"}'

# 5. Cleanup
docker compose down -v
```

## Reproduction Result

### Step 3: Create User (Works)

```json
{
  "data": {
    "createOneUser": {
      "id": "1",
      "name": "Test User", 
      "email": "test@example.com"
    }
  }
}
```

### Step 4: Create TodoItem with Assignee (Bug Triggered)

**Actual Result** (Bug):
```json
{
  "errors": [
    {
      "message": "Cannot read properties of undefined (reading 'id')",
      "path": ["createOneTodoItem", "assignee"],
      "extensions": {
        "serviceName": "users"
      }
    }
  ],
  "data": {
    "createOneTodoItem": {
      "id": "1",
      "title": "Test Todo",
      "assignee": null
    }
  }
}
```

**Expected Result** (After Fix):
```json
{
  "data": {
    "createOneTodoItem": {
      "id": "1",
      "title": "Test Todo",
      "assignee": {
        "id": "1",
        "name": "Test User"
      }
    }
  }
}
```

## Problem Description

In v9.2.0, the `@ResolveReference()` method was enhanced with DataLoader support,
adding `@Context()` and `@InjectDataLoaderConfig()` parameter decorators:

```typescript
@ResolveReference()
async resolveReference(
  representation: RepresentationType,
  @Context() context: ExecutionContext,
  @InjectDataLoaderConfig() dataLoaderConfig?: DataLoaderOptions
): Promise<DTO> {
  const id = representation[key]; // ❌ representation is undefined!
}
```

The `@nestjs/graphql` `@ResolveReference()` decorator has known incompatibilities
with parameter decorators. When these decorators are present, the `representation`
parameter becomes `undefined`, causing the error:

```
Cannot read properties of undefined (reading 'id')
```
