/**
 * This is the doc comment for file1.ts
 * @packageDocumentation
 */
// eslint-disable-next-line max-classes-per-file
import { Args, ArgsType, InputType, OmitType, Resolver } from '@nestjs/graphql'
import { Class, DeepPartial, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { DTONames, getDTONames } from '../common'
import { AuthorizerFilter, MutationHookArgs, ResolverMutation, ResolverSubscription } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { EventType, getDTOEventName } from '../subscription'
import {
  CreateManyInputType,
  CreateOneInputType,
  MutationArgsType,
  SubscriptionArgsType,
  SubscriptionFilterInputType
} from '../types'
import { createSubscriptionFilter, getSubscriptionEventName } from './helpers'
import { BaseServiceResolver, ResolverClass, ServiceResolver, SubscriptionResolverOpts } from './resolver.interface'

export type CreatedEvent<DTO> = { [eventName: string]: DTO }

interface AuthValidationOpts {
  /**
   * Determines whether the auth filter should be passed into the query service
   */
  validateWithAuthFilter?: boolean
}

export interface CreateResolverOpts<DTO, C = DeepPartial<DTO>> extends SubscriptionResolverOpts, AuthValidationOpts {
  /**
   * The Input DTO that should be used to create records.
   */
  CreateDTOClass?: Class<C>
  /**
   * The class to be used for `createOne` input.
   */
  CreateOneInput?: Class<CreateOneInputType<C>>
  /**
   * The class to be used for `createMany` input.
   */
  CreateManyInput?: Class<CreateManyInputType<C>>

  createOneMutationName?: string
  createManyMutationName?: string

  one?: SubscriptionResolverOpts['one'] & AuthValidationOpts
  many?: SubscriptionResolverOpts['many'] & AuthValidationOpts
}

export interface CreateResolver<DTO, C, QS extends QueryService<DTO, C, unknown>> extends ServiceResolver<DTO, QS> {
  createOne(input: MutationArgsType<CreateOneInputType<C>>, authorizeFilter?: Filter<DTO>): Promise<DTO>

  createMany(input: MutationArgsType<CreateManyInputType<C>>, authorizeFilter?: Filter<DTO>): Promise<DTO[]>

  createdSubscription(input?: SubscriptionArgsType<DTO>, authorizeFilter?: Filter<DTO>): AsyncIterator<CreatedEvent<DTO>>
}

/** @internal */
const defaultCreateDTO = <DTO, C>(dtoNames: DTONames, DTOClass: Class<DTO>): Class<C> => {
  @InputType(`Create${dtoNames.baseName}`)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class CreateInput extends OmitType(DTOClass, [], InputType) {}

  return CreateInput as Class<C>
}

/** @internal */
const defaultCreateOneInput = <C>(dtoNames: DTONames, InputDTO: Class<C>): Class<CreateOneInputType<C>> => {
  const { baseName, baseNameLower } = dtoNames

  @InputType(`CreateOne${baseName}Input`)
  class CO extends CreateOneInputType(baseNameLower, InputDTO) {}

  return CO
}

/** @internal */
const defaultCreateManyInput = <C>(dtoNames: DTONames, InputDTO: Class<C>): Class<CreateManyInputType<C>> => {
  const { pluralBaseName, pluralBaseNameLower } = dtoNames

  @InputType(`CreateMany${pluralBaseName}Input`)
  class CM extends CreateManyInputType(pluralBaseNameLower, InputDTO) {}

  return CM
}

/**
 * @internal
 * Mixin to add `create` graphql endpoints.
 */
export const Creatable =
  <DTO, C, QS extends QueryService<DTO, C, unknown>>(DTOClass: Class<DTO>, opts: CreateResolverOpts<DTO, C>) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<CreateResolver<DTO, C, QS>> & B => {
    const dtoNames = getDTONames(DTOClass, opts)
    const { baseName, pluralBaseName } = dtoNames
    const enableSubscriptions = opts.enableSubscriptions === true
    const enableOneSubscriptions = opts.one?.enableSubscriptions ?? enableSubscriptions
    const enableManySubscriptions = opts.many?.enableSubscriptions ?? enableSubscriptions
    const createdEvent = getDTOEventName(EventType.CREATED, DTOClass)
    const {
      CreateDTOClass = defaultCreateDTO(dtoNames, DTOClass),
      CreateOneInput = defaultCreateOneInput(dtoNames, CreateDTOClass),
      CreateManyInput = defaultCreateManyInput(dtoNames, CreateDTOClass)
    } = opts
    const createOneMutationName = opts.one?.name ?? `createOne${baseName}`
    const createManyMutationName = opts.many?.name ?? `createMany${pluralBaseName}`
    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'CreateDTOClass', 'CreateOneInput', 'CreateManyInput')

    @ArgsType()
    class CO extends MutationArgsType(CreateOneInput) {}

    @ArgsType()
    class CM extends MutationArgsType(CreateManyInput) {}

    @InputType(`Create${baseName}SubscriptionFilterInput`)
    class SI extends SubscriptionFilterInputType(DTOClass) {}

    @ArgsType()
    class SA extends SubscriptionArgsType(SI) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionFilter = createSubscriptionFilter(SI, createdEvent)

    @Resolver(() => DTOClass, { isAbstract: true })
    class CreateResolverBase extends BaseClass {
      @ResolverMutation(
        () => DTOClass,
        { name: createOneMutationName, description: opts?.one?.description, complexity: opts?.one?.complexity },
        commonResolverOpts,
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_CREATE_ONE, CreateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)]
        },
        opts.one ?? {}
      )
      async createOne(
        @MutationHookArgs() input: CO,
        @AuthorizerFilter({
          operationGroup: OperationGroup.CREATE,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        const createOneOpts =
          opts?.validateWithAuthFilter || opts?.one?.validateWithAuthFilter ? { filter: authorizeFilter ?? {} } : undefined
        const created = await this.service.createOne(input.input.input, createOneOpts)
        if (enableOneSubscriptions) {
          await this.publishCreatedEvent(created, authorizeFilter)
        }
        return created
      }

      @ResolverMutation(
        () => [DTOClass],
        { name: createManyMutationName, description: opts?.many?.description, complexity: opts?.many?.complexity },
        { ...commonResolverOpts },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_CREATE_MANY, CreateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)]
        },
        opts.many ?? {}
      )
      async createMany(
        @MutationHookArgs() input: CM,
        @AuthorizerFilter({
          operationGroup: OperationGroup.CREATE,
          many: true
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO[]> {
        const createManyOpts =
          opts.validateWithAuthFilter || opts.many?.validateWithAuthFilter ? { filter: authorizeFilter ?? {} } : undefined
        const created = await this.service.createMany(input.input.input, createManyOpts)
        if (enableManySubscriptions) {
          await Promise.all(created.map((c) => this.publishCreatedEvent(c, authorizeFilter)))
        }
        return created
      }

      async publishCreatedEvent(dto: DTO, authorizeFilter?: Filter<DTO>): Promise<void> {
        if (this.pubSub) {
          const eventName = getSubscriptionEventName(createdEvent, authorizeFilter)
          await this.pubSub.publish(eventName, { [createdEvent]: dto })
        }
      }

      @ResolverSubscription(() => DTOClass, { name: createdEvent, filter: subscriptionFilter }, commonResolverOpts, {
        enableSubscriptions: enableOneSubscriptions || enableManySubscriptions,
        interceptors: [AuthorizerInterceptor(DTOClass)]
      })
      createdSubscription(
        @Args() input?: SA,
        @AuthorizerFilter({ operationGroup: OperationGroup.CREATE, many: false })
        authorizeFilter?: Filter<DTO>
      ): AsyncIterator<CreatedEvent<DTO>> {
        if (!this.pubSub || !(enableManySubscriptions || enableOneSubscriptions)) {
          throw new Error(`Unable to subscribe to ${createdEvent}`)
        }

        const eventName = getSubscriptionEventName(createdEvent, authorizeFilter)
        return this.pubSub.asyncIterableIterator<CreatedEvent<DTO>>(eventName)
      }
    }

    return CreateResolverBase
  }

/**
 * Factory to create a new abstract class that can be extended to add `create` endpoints.
 *
 * Assume we have `TodoItemDTO`, you can create a resolver with `createOneTodoItem` and `createManyTodoItems` graphql
 * query endpoints using the following code.
 *
 * ```ts
 * @Resolver()
 * export class TodoItemResolver extends CreateResolver(TodoItemDTO) {
 *   constructor(readonly service: TodoItemService) {
 *    super(service);
 *   }
 * }
 * ```
 *
 * @param DTOClass - The DTO class that should be returned from the `createOne` and `createMany` endpoint.
 * @param opts - Options to customize endpoints.
 * @typeparam DTO - The type of DTO that should be created.
 * @typeparam C - The create DTO type.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const CreateResolver = <
  DTO,
  C = DeepPartial<DTO>,
  QS extends QueryService<DTO, C, unknown> = QueryService<DTO, C, unknown>
>(
  DTOClass: Class<DTO>,
  opts: CreateResolverOpts<DTO, C> = {}
): ResolverClass<DTO, QS, CreateResolver<DTO, C, QS>> => Creatable(DTOClass, opts)(BaseServiceResolver)
