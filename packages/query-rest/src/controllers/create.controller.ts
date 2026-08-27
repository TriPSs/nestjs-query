// eslint-disable-next-line max-classes-per-file
import { OmitType } from '@nestjs/swagger'
import { Class, DeepPartial, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { ApiSchema, HookTypes, MutationArgsType, Post } from '../'
import { OperationGroup } from '../auth'
import { DTONames, getDTONames } from '../common'
import { AuthorizerFilter } from '../decorators'
import { BodyHookArgs } from '../decorators/hook-args.decorator'
import { ParamArgs } from '../decorators/param-args.decorator'
import { HookInterceptor } from '../interceptors'
import { AuthorizerInterceptor } from '../interceptors/authorizer.interceptor'
import { CreateOneInputType } from '../types'
import { ParamArgsType } from '../types/param-args.type'
import { BaseServiceResolver, ControllerClass, MutationOpts, ServiceController } from './controller.interface'

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

export interface CreateController<DTO, C, QS extends QueryService<DTO, C, unknown>> extends ServiceController<DTO, QS> {
  createOne(id: ParamArgsType, input: MutationArgsType<CreateOneInputType<C>>, authorizeFilter?: Filter<DTO>): Promise<DTO>
}

/** @internal */
const defaultCreateDTO = <DTO, C>(dtoNames: DTONames, DTOClass: Class<DTO>): Class<C> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class DefaultCreateDTO extends OmitType(DTOClass, []) {}

  return DefaultCreateDTO as Class<C>
}

/** @internal */
const defaultCreateOneInput = <C>(dtoNames: DTONames, InputDTO: Class<C>): Class<CreateOneInputType<C>> => {
  return CreateOneInputType(InputDTO)
}

/**
 * @internal
 * Mixin to add `create` REST endpoints.
 */
export const Creatable =
  <DTO, C, QS extends QueryService<DTO, C, unknown>>(DTOClass: Class<DTO>, opts: CreateResolverOpts<DTO, C>) =>
  <B extends Class<ServiceController<DTO, QS>>>(BaseClass: B): Class<CreateController<DTO, C, QS>> & B => {
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)

    const {
      CreateDTOClass = defaultCreateDTO(dtoNames, DTOClass),
      CreateOneInput = defaultCreateOneInput(dtoNames, CreateDTOClass)
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'CreateDTOClass', 'CreateOneInput', 'CreateManyInput')

    @ApiSchema({ name: `Create${DTOClass.name}` })
    class COI extends MutationArgsType(CreateOneInput) {}

    @ApiSchema({ name: `Create${DTOClass.name}Args` })
    class COP extends ParamArgsType(CreateDTOClass) {}

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
            type: COI
          }
        },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_CREATE_ONE, CreateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)]
        },
        commonResolverOpts,
        opts.one ?? {}
      )
      public async createOne(
        @ParamArgs() params: COP,
        @BodyHookArgs() { input }: COI,
        @AuthorizerFilter({
          operationGroup: OperationGroup.CREATE,
          many: false
        }) // eslint-disable-next-line @typescript-eslint/no-unused-vars
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.service.createOne({
          ...params,
          ...input
        })
      }
    }

    return CreateControllerBase
  }

/**
 * Factory to create a new abstract class that can be extended to add `create` endpoints.
 *
 * Assume we have `TodoItemDTO`, you can create a controller with a `POST` endpoint using the following code.
 *
 * ```ts
 * import { Controller } from '@nestjs/common'
 * import { CreateController } from '@ptc-org/nestjs-query-rest'
 *
 * @Controller('todo-items')
 * export class TodoItemController extends CreateController(TodoItemDTO) {
 *   constructor(readonly service: TodoItemService) {
 *     super(service)
 *   }
 * }
 * ```
 *
 * @param DTOClass - The DTO class returned from the `createOne` endpoint.
 * @param opts - Options to customize endpoints.
 * @typeparam DTO - The type of DTO that should be created.
 * @typeparam C - The create DTO type.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const CreateController = <
  DTO,
  C = DeepPartial<DTO>,
  QS extends QueryService<DTO, C, unknown> = QueryService<DTO, C, unknown>
>(
  DTOClass: Class<DTO>,
  opts: CreateResolverOpts<DTO, C> = {}
): ControllerClass<DTO, QS, CreateController<DTO, C, QS>> => Creatable(DTOClass, opts)(BaseServiceResolver)
