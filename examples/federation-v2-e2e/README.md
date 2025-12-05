# Federation V2 E2E Test Environment

E2E test environment for testing [issue #410](https://github.com/TriPSs/nestjs-query/issues/410) fix:
"Federation referenceBy broken since v9.2.0: representation parameter undefined"

## Issue Fixed ✅

This test environment validates the fix for the bug where the `@ResolveReference()` method
was receiving `undefined` for the `representation` parameter when `@Context()` and 
`@InjectDataLoaderConfig()` decorators are present.

The fix adds `@Parent()` decorator to properly extract the representation from GraphQL resolver arguments.

## Directory Structure

```
federation-v2-e2e/
├── docker-compose.yml      # Orchestrates all services
├── user-service/           # User subgraph with numeric ID (exposed on host:3001)
│   ├── Dockerfile          # Multi-stage build with nestjs-query
│   └── src/
├── tag-service/            # Tag subgraph with UUID string ID (exposed on host:3003)
│   ├── Dockerfile          # Multi-stage build with nestjs-query
│   └── src/
├── todo-service/           # TodoItem subgraph (exposed on host:3002)
│   ├── Dockerfile          # Multi-stage build with nestjs-query
│   └── src/
├── gateway/                # Apollo Gateway (exposed on host:3000)
│   ├── Dockerfile
│   └── src/
├── e2e-test/               # Jest E2E test suite
│   ├── Dockerfile
│   └── e2e/
└── init-scripts/           # PostgreSQL initialization
```

## ID Type Coverage

This test environment validates Federation with different ID types:

- **Numeric ID**: `User.id` (integer) - Tests standard numeric primary key
- **UUID String ID**: `Tag.id` (UUID) - Tests string-based primary key

## Build Strategy

Each service uses a **multi-stage Docker build**:

1. **Stage 1 (builder)**: Copies the entire nestjs-query source code, installs dependencies, 
   builds all packages, and creates `.tgz` archives using `npm pack`.

2. **Stage 2 (runtime)**: Copies the packed `.tgz` files, installs them as local dependencies,
   then builds and runs the service.

This approach allows testing the **local source code** instead of published npm packages.

## Quick Start

```bash
# From the project root directory
cd examples/federation-v2-e2e

# 1. Build and start all services
docker compose up -d --build

# 2. Wait for services to be healthy (all should show "healthy")
docker compose ps

# 3. Test Federation query with pre-seeded data
curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ todoItems { edges { node { id title assignee { id name } tag { id name color } } } } }"}' | jq .

# 4. Cleanup
docker compose down -v
```

## Running E2E Tests

Run the automated Jest test suite:

```bash
# Run tests with the test profile
docker compose --profile test up --build e2e-test

# Or run all services and tests together
docker compose --profile test up --build
```

The test suite validates:
- Federation reference resolution works correctly
- User references with numeric ID are resolved
- Tag references with UUID string ID are resolved
- Issue #410 fix verification

## Expected Result

The query should return TodoItems with resolved User (numeric ID) and Tag (UUID ID) references:

```json
{
  "data": {
    "todoItems": {
      "edges": [
        {
          "node": {
            "id": "1",
            "title": "Learn GraphQL Federation",
            "assignee": {
              "id": "1",
              "name": "Alice"
            },
            "tag": {
              "id": "550e8400-e29b-41d4-a716-446655440001",
              "name": "Frontend",
              "color": "#3498db"
            }
          }
        },
        {
          "node": {
            "id": "2",
            "title": "Fix Issue #410",
            "assignee": {
              "id": "2",
              "name": "Bob"
            },
            "tag": {
              "id": "550e8400-e29b-41d4-a716-446655440003",
              "name": "Bug",
              "color": "#e74c3c"
            }
          }
        },
        {
          "node": {
            "id": "3",
            "title": "Write Tests",
            "assignee": {
              "id": "1",
              "name": "Alice"
            },
            "tag": {
              "id": "550e8400-e29b-41d4-a716-446655440002",
              "name": "Backend",
              "color": "#2ecc71"
            }
          }
        }
      ]
    }
  }
}
```

## The Fix

The issue was in `reference.resolver.ts`. The `representation` parameter needed the `@Parent()` decorator:

**Before (broken):**
```typescript
@ResolveReference()
async resolveReference(
  representation: RepresentationType,  // ❌ No decorator - gets undefined
  @Context() context: ExecutionContext,
  @InjectDataLoaderConfig() dataLoaderConfig?: DataLoaderOptions
): Promise<DTO>
```

**After (fixed):**
```typescript
@ResolveReference()
async resolveReference(
  @Parent() representation: RepresentationType,  // ✅ @Parent() extracts from args[0]
  @Context() context: ExecutionContext,
  @InjectDataLoaderConfig() dataLoaderConfig?: DataLoaderOptions
): Promise<DTO>
```

Additionally, `reference.loader.ts` was updated to handle ID type comparison correctly
by converting IDs to strings for consistent Map lookups.
