To: `nestjs-query` Maintainer
Subject: Proposal for Enhanced GraphQL Polymorphism and Fragment Support via Explicit DTO Separation

Hello,

We are currently leveraging `nestjs-query` in a platform application where we extensively use Typegoose's discrimination feature for various entities. This allows us to model polymorphic data effectively at the database layer. However, we've encountered significant challenges in exposing and querying this polymorphic data via GraphQL, particularly when attempting to use GraphQL fragments.

This write-up outlines a conceptual change to `nestjs-query`'s internal architecture that we believe would natively address these challenges, significantly improving the developer experience for complex, data-rich applications.

---

### The Current Status Quo and the Problem

`nestjs-query` currently intertwines the concepts of an ORM entity and its GraphQL Data Transfer Object (DTO). The `DTOClass` provided to `NestjsQueryGraphQLModule.forFeature` serves a dual purpose: it defines the GraphQL schema (via `@ObjectType`, `@Field` decorators) and acts as the type for the underlying `QueryService` to interact with the ORM entity.

While this design simplifies common CRUD operations for direct entity-to-GraphQL mappings, it creates significant friction when dealing with **polymorphism** and **GraphQL fragments**:

1.  **Difficulty with GraphQL Interface/Union Types:** It's challenging to define a base DTO (e.g., `TodoItemDTO`) as a GraphQL `InterfaceType` and have its discriminated DTOs (e.g., `TodoTaskDTO`, `TodoAppointmentDTO`) automatically implement it. `nestjs-query`'s current schema generation doesn't natively infer or create these polymorphic GraphQL types from ORM discrimination metadata.
2.  **Manual `resolveType` and Resolver Boilerplate:** Without native support, we are forced to manually define GraphQL `UnionType`s or `InterfaceType`s and implement custom `@ResolveField` resolvers. These resolvers must manually fetch the underlying ORM entity, determine its discriminated type, and then map it to the correct concrete GraphQL DTO. This negates much of `nestjs-query`'s automation.
3.  **Lack of Native Fragment Support:** The core problem manifests as GraphQL validation errors when attempting to use fragments on polymorphic fields. GraphQL expects a field to be typed as an `Interface` or `Union` to allow fragments,but `nestjs-query` requires DTOs to be concrete `ObjectTypes`, and thus, true polymorphism isn't available, leading to errors like `"Fragment cannot be spread here as objects of type "TodoItem" can never be of type "TodoTask"."`

### Proposed Conceptual Change: Explicit DTO Separation

We propose a conceptual separation within `nestjs-query` between:

1.  **ORM/ODM Entity DTOs (Internal Representation):** A plain TypeScript class that strictly mirrors the properties of the ORM entity (e.g., `TodoItemEntityDTO`). This would be the internal representation that `nestjs-query`'s `Assemblers` and `QueryServices` primarily work with. It would include the discriminator key (e.g., `documentType` in Mongoose or dtype for TypeORM).
2.  **GraphQL DTOs (External Representation):** The classes decorated with `@nestjs/graphql` decorators (e.g., `TodoItemDTO`, `TodoTaskDTO`, `TodoAppointmentDTO`). These would define the GraphQL schema, including `InterfaceType`s and `ObjectType`s that implement them.

**How it would work:**

*   **ORM/ODM Modules (`nestjs-query-typegoose`, `nestjs-query-typeorm`, `nestjs-query-mongoose(theoretically)`):** These modules would be responsible for:
    *   Registering the ORM entities and their discrimination metadata (base entity, discriminator key, mapping of discriminator values to concrete entity classes).
    *   Providing a mechanism to generate or infer the `ORM Entity DTOs` from the ORM entities.
*   **Core `nestjs-query-graphql`:** This module would be enhanced to:
    *   **Detect Discrimination:** When configuring `NestjsQueryGraphQLModule.forFeature`, it would receive metadata from the ORM modules indicating if a DTO is part of a discrimination hierarchy.
    *   **Automated `InterfaceType` Generation:** If a DTO is identified as the base of a discrimination, NQG would automatically generate a GraphQL `InterfaceType` for it.
    *   **Automated `implements` Clause:** Discriminated DTOs would be generated as `ObjectType`s that automatically `implement` the generated `InterfaceType`.
    *   **Automated `resolveType` Injection:** For any GraphQL field returning the generated `InterfaceType` (or a list of it), NQG would automatically inject a `resolveType` function. This function would inspect the `discriminatorKey` on the underlying `ORM Entity DTO` (or the raw entity) and return the correct concrete GraphQL `ObjectType`.
    *   **Refined Assemblers:** `Assemblers` would be responsible for mapping between the `ORM Entity DTOs` and the `GraphQL DTOs`, handling the polymorphic conversion.

### Benefits of this Change (Solving the Problems)

This conceptual shift would provide significant benefits, particularly for platform development:

1.  **Native GraphQL Polymorphism:** `nestjs-query` would natively generate GraphQL `InterfaceType`s and handle the `resolveType` logic for discriminated entities, aligning with GraphQL best practices.
2.  **True Fragment Support:** This directly solves the `Fragment cannot be spread here` error, enabling clients to use fragments for querying polymorphic data seamlessly.
3.  **Clearer Separation of Concerns:** Decouples the database schema from the GraphQL API schema, allowing each to evolve more independently.
4.  **Scalability for Platforms:** For applications with potentially thousands of discriminated entities, this automation would drastically reduce the need for manual `UnionType` definitions and custom resolvers, eliminating a massive amount of boilerplate code.
5.  **Improved Developer Experience:** Developers would simply define their ORM entities and their GraphQL DTOs (with the base DTO as an `InterfaceType`), and `nestjs-query` would handle the complex polymorphic mapping and schema generation automatically, providing the proper and massively powerful "black box" abstraction desired.

### Concrete Examples from Our `typegoose-discriminators` E2E Test (Current Failures)

Consider our `TodoItem` example, where `TodoTask` and `TodoAppointment` are discriminated types of `TodoItem`.

**Current Failure Example 1: Querying all `TodoItem`s with Fragments**
In our e2e test, we attempt to query all `TodoItem`s and use fragments to retrieve type-specific fields:

```graphql
query GetAllTodoItemsWithDetails {
  todoItems { # This field currently returns [TodoItemDTO!]! where TodoItemDTO is an ObjectType
    id
    title
    documentType
    ... on TodoTask { # This fragment fails
      dueDate
    }
    ... on TodoAppointment { # This fragment fails
      location
    }
  }
}
```
This query currently fails with errors like: `"Fragment cannot be spread here as objects of type "TodoItem" can never be of type "TodoTask"."` This is because `TodoItemDTO` is generated as a concrete `ObjectType`, not an `InterfaceType` that `TodoTaskDTO` and `TodoAppointmentDTO` implement.

**Current Failure Example 2: `SubTask` Relation to `TodoItem`**
When `SubTaskDTO` has a one-to-one relation to `TodoItemDTO`:

```typescript
// In SubTaskDTO
@Relation('todoItem', () => TodoItemDTO, { /* ... */ })
todoItem!: TodoItemDTO;
```
This currently fails if `TodoItemDTO` is an `InterfaceType` because `@Relation` expects a concrete `ObjectType`. We are forced to use a `UnionType` and a custom resolver, adding significant boilerplate.

---

We believe this enhancement would significantly elevate `nestjs-query`'s capabilities for complex, real-world applications and address a critical pain point for developers working with polymorphic data. We would greatly appreciate your thoughts and feedback on this proposed conceptual change.

Thank you for your time and consideration.