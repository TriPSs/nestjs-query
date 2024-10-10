// eslint-disable-next-line max-classes-per-file
import { OmitType } from '@nestjs/swagger'
import { Class, DeepPartial, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { DTONames, getDTONames } from '../common'
import { ApiSchema, BodyHookArgs, Post } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { CreateOneInputType, MutationArgsType } from '../types'
import { BaseServiceResolver, MutationOpts, ResolverClass, ServiceResolver } from './resolver.interface'

export interface CreateResolverOpts<DTO, C = DeepPartial<DTO>> extends MutationOpts {
  /**
   * The Input DTO that should be used to create records.
   */
  CreateDTOClass?: Class<C>
  /**
   * The class to be used for `createOne` input.
   */
  CreateOneInput?: Class<CreateOneInputType<C>>
}

export interface CreateResolver<DTO, C, QS extends QueryService<DTO, C, unknown>> extends ServiceResolver<DTO, QS> {
  createOne(input: MutationArgsType<CreateOneInputType<C>>, authorizeFilter?: Filter<DTO>): Promise<DTO>
}

/** @internal */
const defaultCreateDTO = <DTO, C>(dtoNames: DTONames, DTOClass: Class<DTO>): Class<C> => {
  @ApiSchema({ name: `Create${dtoNames.baseName}` })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class DefaultCreateDTO extends OmitType(DTOClass, []) {}

  return DefaultCreateDTO as Class<C>
}

/** @internal */
const defaultCreateOneInput = <C>(dtoNames: DTONames, InputDTO: Class<C>): Class<CreateOneInputType<C>> => {
  class CO extends CreateOneInputType(InputDTO) {}

  return CO
}

/**
 * @internal
 * Mixin to add `create` graphql endpoints.
 */
export const Creatable =
  <DTO, C, QS extends QueryService<DTO, C, unknown>>(DTOClass: Class<DTO>, opts: CreateResolverOpts<DTO, C>) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<CreateResolver<DTO, C, QS>> & B => {
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)

    const {
      CreateDTOClass = defaultCreateDTO(dtoNames, DTOClass),
      CreateOneInput = defaultCreateOneInput(dtoNames, CreateDTOClass)
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'CreateDTOClass', 'CreateOneInput', 'CreateManyInput')

    class COI extends MutationArgsType(CreateOneInput) {}

    class CreateControllerBase extends BaseClass {
      @Post(
        () => DTOClass,
        {
          disabled: opts.disabled,
          path: opts.one?.path,
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.createOne`,
            tags: [...(opts.tags || []), ...(opts.one?.tags ?? [])],
            description: opts?.one?.description,
            ...opts?.one?.operationOptions
          },
          body: {
            type: CreateDTOClass
          }
        },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_CREATE_ONE, CreateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)]
        },
        commonResolverOpts,
        opts.one ?? {}
      )
      public async createOne(@BodyHookArgs() { input }: COI): Promise<DTO> {
        // Ignore `authorizeFilter` for now but give users the ability to throw an UnauthorizedException
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.service.createOne(input)
      }
    }

    return CreateControllerBase
  }

/**
 * Factory to create a new abstract class that can be extended to add `create` endpoints.
 *
 * Assume we have `TodoItemDTO`, you can create a resolver with `createOneTodoItem` and `createManyTodoItems` graphql
 * query endpoints using the following code.
 *
 * ```ts
 * @Controller()
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
