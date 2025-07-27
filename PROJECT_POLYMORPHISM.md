# Project: Native GraphQL Polymorphism for Discriminated Entities in Nestjs-Query

## 1. Project Goal

The primary goal of this mini-project is to enhance `nestjs-query` to natively support GraphQL polymorphism (Interface Types, Union Types, and fragment resolution) for Typegoose discriminated entities. This aims to eliminate the need for extensive userland boilerplate and provide a seamless developer experience for applications leveraging polymorphic data.

## 2. Problem Statement (Recap)

`nestjs-query` currently intertwines ORM entities and GraphQL DTOs, leading to limitations when dealing with polymorphic data:

*   **Lack of Native Interface/Union Type Generation:** `nestjs-query` does not automatically generate GraphQL `InterfaceType`s for base discriminated DTOs, nor does it automatically make discriminated DTOs implement these interfaces.
*   **Boilerplate for `resolveType` and Custom Resolvers:** Achieving polymorphism requires manual definition of GraphQL `UnionType`s or `InterfaceType`s, and custom `@ResolveField` resolvers to handle the `resolveType` logic and entity-to-DTO mapping.
*   **Fragment Support Issues:** Without proper GraphQL Interface/Union typing, GraphQL fragments on polymorphic fields fail with validation errors (e.g., `"Fragment cannot be spread here as objects of type "TodoItem" can never be of type "TodoTask"."`).
*   **Scalability Concerns:** For platforms with many discriminated entities, the manual workaround becomes unmanageable, even with code generation, due to the sheer volume of verbose and repetitive code.

## 3. Proposed Solution: `discriminateDTOs` Configuration

We propose adding a new configuration property, `discriminateDTOs`, to `NestjsQueryGraphQLModule.forFeature`. This property will allow users to explicitly define their polymorphic DTO hierarchies, providing `nestjs-query` with the necessary metadata to automate GraphQL schema generation and resolution for discriminated entities.

This approach treats polymorphic DTOs as a distinct configuration, allowing `nestjs-query` to apply specialized logic without altering its existing behavior for concrete DTOs.

### 3.1. `discriminateDTOs` Interface

The `discriminateDTOs` property will be an array of `DiscriminateDTOsOpts` objects, each defining a polymorphic DTO hierarchy. The interfaces are designed to be flexible, allowing for full customization of resolvers, services, and assemblers for both the base DTO and its discriminated types.

```typescript
// packages/query-graphql/src/module.ts

// Extends AutoResolverOpts to allow full customization for each discriminated DTO
export interface DiscriminatedDTO<
  DTO = any,
  Entity = any,
  C = DeepPartial<DTO>,
  U = DeepPartial<DTO>,
  R extends ReadResolverOpts<DTO> = ReadResolverOpts<DTO>,
  PS extends PagingStrategies = PagingStrategies.CURSOR
> extends AutoResolverOpts<DTO, any, C, U, R, PS> {
  // These are still required for our internal discrimination logic
  DTOClass: Class<DTO>;
  EntityClass: Class<Entity>;
}

// Extends AutoResolverOpts for the base DTO as well
export interface DiscriminateDTOsOpts<
  BaseDTO = any,
  BaseEntity = any,
  C = DeepPartial<BaseDTO>,
  U = DeepPartial<BaseDTO>,
  R extends ReadResolverOpts<BaseDTO> = ReadResolverOpts<BaseDTO>,
  PS extends PagingStrategies = PagingStrategies.CURSOR
> extends AutoResolverOpts<BaseDTO, any, C, U, R, PS> {
  // These are still required for our internal discrimination logic
  baseDTO: AbstractClass<BaseDTO>;
  baseEntity: Class<BaseEntity>;
  discriminatorKey: string;
  // The discriminators array will now use our new DiscriminatedDTO interface
  discriminators: DiscriminatedDTO<any, any>[];
}

// Update the main feature options to use the new DiscriminateDTOsOpts
export interface NestjsQueryGraphqlModuleFeatureOpts {
  // ... existing properties
  discriminateDTOs?: DiscriminateDTOsOpts<any, any>[];
  // ... existing properties
}
```

### 3.2. Module Configuration Example (`NestjsQueryGraphQLModule.forFeature`)

```typescript
// Conceptual example of NestjsQueryGraphQLModule.forFeature configuration
NestjsQueryGraphQLModule.forFeature({
  // ... existing DTOs and resolvers
  dtos: [
    // ... concrete DTOs like SubTaskDTO
  ],
  discriminateDTOs: [
    {
      baseDTO: TodoItemDTO, // The GraphQL InterfaceType
      baseEntity: TodoItemEntity, // The base Typegoose Entity
      discriminatorKey: 'documentType', // The discriminator key in the entity
      // Custom options for the base DTO's resolver (e.g., to disable mutations)
      read: { one: { name: 'todoItem' }, many: { name: 'todoItems' } },
      discriminators: [
        {
          DTOClass: TodoTaskDTO,
          EntityClass: TodoTaskEntity,
          CreateDTOClass: CreateTodoTaskInput, // Custom Create DTO for this type
          // Custom options for this discriminated DTO's resolver
          read: { one: { name: 'todoTask' }, many: { name: 'todoTasks' } }
        },
        {
          DTOClass: TodoAppointmentDTO,
          EntityClass: TodoAppointmentEntity,
          CreateDTOClass: CreateTodoAppointmentInput
        }
      ]
    }
  ]
})
```

## 4. Key Components and Tasks

### 4.1. DTO Definitions (Userland)

*   **Base DTO as GraphQL `InterfaceType`:**
    *   `TodoItemDTO` will be defined as an `InterfaceType` (e.g., `@InterfaceType('TodoItem')`).
    *   It will contain common fields shared by all discriminated types (e.g., `id`, `title`, `completed`, `documentType`).
    *   **Crucially, it must provide a `resolveType` function** to map runtime data to the correct concrete GraphQL `ObjectType`.

*   **Discriminated DTOs as GraphQL `ObjectType`s:**
    *   `TodoTaskDTO` and `TodoAppointmentDTO` will be defined as `ObjectType`s (e.g., `@ObjectType('TodoTask', { implements: () => TodoItemDTO })`).
    *   They will implement `TodoItemDTO` and include their specific fields (e.g., `dueDate` for `TodoTaskDTO`, `location` for `TodoAppointmentDTO`).
    *   **Relations defined on the base DTO (e.g., `subTasks`) will be automatically inherited by concrete DTOs.**

### 4.2. Entity Definitions (Userland)

*   **Base Entity:** `TodoItemEntity` will remain the base Typegoose entity with a `discriminatorKey`.
*   **Discriminated Entities:** `TodoTaskEntity` and `TodoAppointmentEntity` will be Typegoose discriminators of `TodoItemEntity`.
*   **Virtual References:** Ensure virtual references are correctly defined on the base entity for relations (e.g., `subTasks` on `TodoItemEntity`).

### 4.3. Internal `nestjs-query` Changes

*   **Schema Generation Enhancement:**
    *   `nestjs-query-graphql` will read the `discriminateDTOs` configuration.
    *   For each entry, it will ensure the `baseDTO` is registered as an `InterfaceType` and that `discriminators.DTOClass` are registered as `ObjectType`s implementing the `baseDTO`.
    *   It will automatically generate the necessary GraphQL schema for polymorphic queries (e.g., a top-level query returning `[baseDTO!]!`).
*   **Automated Query Service and Assembler Provisioning:**
    *   The `nestjs-query-graphql` module will dynamically create and provide specialized `Assembler` classes for each discriminated DTO. These assemblers will automatically inject the correct `discriminatorKey` and `value` into the entity during creation/update.
    *   These custom assemblers will then be passed to `NestjsQueryCoreModule.forFeature` to automatically generate `AssemblerQueryService` instances for each DTO.
    *   The `nestjs-query-typegoose` module will ensure that a `TypegooseQueryService` is provided for the base entity and all discriminated entities.
*   **Relation Handling:**
    *   Relations defined on the base DTO will be automatically applied to the resolvers of the concrete DTOs.

### 4.4. Testing Strategy

*   **TDD Approach:** We will follow a Test-Driven Development (TDD) approach.
*   **E2E Tests (Existing):** The existing `typegoose-discriminators` e2e tests already demonstrate the current failures related to polymorphism and fragments. These will serve as our initial failing tests.
*   **Unit Tests (New):** Add unit tests within `nestjs-query-graphql` to verify:
    *   Correct GraphQL schema generation for `InterfaceType`s and implementing `ObjectType`s.
    *   Correct integration of user-provided `resolveType` functions.
    *   Proper mapping of discriminated entities to their respective GraphQL DTOs.
*   **Extensibility Tests (New):** Add E2E tests to verify that user-provided services, assemblers, and resolvers correctly override the auto-generated ones for discriminated DTOs.

## 5. Documentation

*   **Update `discriminateDTOs` Documentation:** Clearly document the new `discriminateDTOs` feature, including the automatic service and assembler generation.
*   **Extensibility Guide:** Provide a clear guide on how to override the default behavior with custom services, assemblers, and resolvers.

## 6. Open Questions/Considerations

*   **Metadata Granularity:** What is the minimum and maximum metadata required in `discriminateDTOs` to enable robust automation?
*   **Custom Services/Resolvers:** How will custom services and resolvers for polymorphic hierarchies be integrated and prioritized over generated ones?
*   **TypeORM Integration:** How can this design be generalized to support TypeORM's discrimination features, ensuring consistency across ORMs?
*   **Backward Compatibility:** How will this new feature be introduced without breaking existing `nestjs-query` implementations?

## 6. Theoretical Applicability to TypeORM

This conceptual change is designed to be ORM-agnostic at its core. TypeORM also supports entity discrimination (table inheritance). By abstracting the discrimination metadata, `nestjs-query` could offer consistent, native GraphQL polymorphism and fragment support across both Typegoose and TypeORM, providing a unified and powerful solution for diverse database backends.
