// eslint-disable-next-line max-classes-per-file
import { PartialType } from '@nestjs/swagger'
import { Class, DeepPartial, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { ApiSchema, MutationArgsType, Put } from '../'
import { OperationGroup } from '../auth'
import { DTONames, getDTONames } from '../common'
import { AuthorizerFilter } from '../decorators'
import { BodyHookArgs } from '../decorators/hook-args.decorator'
import { ParamArgs } from '../decorators/param-args.decorator'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { ParamArgsType } from '../types/param-args.type'
import { UpdateOneInputType } from '../types/update-one-input.type'
import { BaseServiceResolver, ControllerClass, MutationOpts, ServiceController } from './controller.interface'

export interface UpdateControllerOpts<DTO, U = DeepPartial<DTO>> extends MutationOpts {
  UpdateDTOClass?: Class<U>
  UpdateOneInput?: Class<UpdateOneInputType<U>>
}

export interface UpdateController<DTO, U, QS extends QueryService<DTO, unknown, U>> extends ServiceController<DTO, QS> {
  updateOne(id: ParamArgsType, input: MutationArgsType<UpdateOneInputType<U>>, authFilter?: Filter<DTO>): Promise<DTO>
}

/** @internal */
const defaultUpdateDTO = <DTO, U>(dtoNames: DTONames, DTOClass: Class<DTO>): Class<U> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class DefaultUpdateDTO extends PartialType(DTOClass) {}

  return DefaultUpdateDTO as Class<U>
}

const defaultUpdateOneInput = <U>(dtoNames: DTONames, UpdateDTO: Class<U>): Class<UpdateOneInputType<U>> => {
  return UpdateOneInputType(UpdateDTO)
}

/**
 * @internal
 * Mixin to add `update` graphql endpoints.
 */
export const Updateable =
  <DTO, U, QS extends QueryService<DTO, unknown, U>>(DTOClass: Class<DTO>, opts: UpdateControllerOpts<DTO, U>) =>
  <B extends Class<ServiceController<DTO, QS>>>(BaseClass: B): Class<UpdateController<DTO, U, QS>> & B => {
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)

    const {
      UpdateDTOClass = defaultUpdateDTO(dtoNames, DTOClass),
      UpdateOneInput = defaultUpdateOneInput(dtoNames, UpdateDTOClass)
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'UpdateDTOClass', 'UpdateOneInput', 'UpdateManyInput')

    @ApiSchema({ name: `Update${DTOClass.name}` })
    class UOI extends MutationArgsType(UpdateOneInput) {}

    @ApiSchema({ name: `FindUpdate${DTOClass.name}Args` })
    class UOP extends ParamArgsType(DTOClass) {}

    class UpdateResolverBase extends BaseClass {
      @Put(
        () => DTOClass,
        {
          path: opts?.one?.path ?? ':id',
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.updateOne`,
            tags: [...(opts.tags || []), ...(opts.one?.tags ?? [])],
            description: opts?.one?.description,
            ...opts?.one?.operationOptions
          },
          body: {
            type: UOI
          }
        },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_UPDATE_ONE, UpdateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)]
        },
        commonResolverOpts,
        opts?.one ?? {}
      )
      public updateOne(
        @ParamArgs() params: UOP,
        @BodyHookArgs() { input }: UOI,
        @AuthorizerFilter({
          operationGroup: OperationGroup.UPDATE,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        return this.service.updateOne(params.getId(), input.update, { filter: authorizeFilter ?? {} })
      }
    }

    return UpdateResolverBase
  }

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const UpdateController = <
  DTO,
  U = DeepPartial<DTO>,
  QS extends QueryService<DTO, unknown, U> = QueryService<DTO, unknown, U>
>(
  DTOClass: Class<DTO>,
  opts: UpdateControllerOpts<DTO, U> = {}
): ControllerClass<DTO, QS, UpdateController<DTO, U, QS>> => Updateable(DTOClass, opts)(BaseServiceResolver)
