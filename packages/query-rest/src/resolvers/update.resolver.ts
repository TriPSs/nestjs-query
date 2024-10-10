// eslint-disable-next-line max-classes-per-file
import { Param } from '@nestjs/common'
import { PartialType } from '@nestjs/swagger'
import { Class, DeepPartial, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { DTONames, getDTONames } from '../common'
import { ApiSchema, AuthorizerFilter, BodyHookArgs, Put } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { MutationArgsType, UpdateOneInputType } from '../types'
import { FindOneArgsType } from '../types/find-one-args.type'
import { BaseServiceResolver, MutationOpts, ResolverClass, ServiceResolver } from './resolver.interface'

export interface UpdateResolverOpts<DTO, U = DeepPartial<DTO>> extends MutationOpts {
  UpdateDTOClass?: Class<U>
  UpdateOneInput?: Class<UpdateOneInputType<U>>
}

export interface UpdateResolver<DTO, U, QS extends QueryService<DTO, unknown, U>> extends ServiceResolver<DTO, QS> {
  updateOne(id: FindOneArgsType, input: MutationArgsType<UpdateOneInputType<U>>, authFilter?: Filter<DTO>): Promise<DTO>
}

/** @internal */
const defaultUpdateDTO = <DTO, U>(dtoNames: DTONames, DTOClass: Class<DTO>): Class<U> => {
  @ApiSchema({ name: `Update${dtoNames.baseName}` })
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
  <DTO, U, QS extends QueryService<DTO, unknown, U>>(DTOClass: Class<DTO>, opts: UpdateResolverOpts<DTO, U>) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<UpdateResolver<DTO, U, QS>> & B => {
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)

    const {
      UpdateDTOClass = defaultUpdateDTO(dtoNames, DTOClass),
      UpdateOneInput = defaultUpdateOneInput(dtoNames, UpdateDTOClass)
    } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'UpdateDTOClass', 'UpdateOneInput', 'UpdateManyInput')

    class UOI extends MutationArgsType(UpdateOneInput) {}

    @ApiSchema({ name: `FindUpdate${DTOClass.name}Args` })
    class UOP extends FindOneArgsType(DTOClass) {}

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
            type: UpdateDTOClass
          }
        },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_UPDATE_ONE, UpdateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)]
        },
        commonResolverOpts,
        opts?.one ?? {}
      )
      public updateOne(
        @Param() params: UOP,
        @BodyHookArgs() { input }: UOI,
        @AuthorizerFilter({
          operationGroup: OperationGroup.UPDATE,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        return this.service.updateOne(params.id, input.update, { filter: authorizeFilter ?? {} })
      }
    }

    return UpdateResolverBase
  }

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const UpdateResolver = <
  DTO,
  U = DeepPartial<DTO>,
  QS extends QueryService<DTO, unknown, U> = QueryService<DTO, unknown, U>
>(
  DTOClass: Class<DTO>,
  opts: UpdateResolverOpts<DTO, U> = {}
): ResolverClass<DTO, QS, UpdateResolver<DTO, U, QS>> => Updateable(DTOClass, opts)(BaseServiceResolver)
