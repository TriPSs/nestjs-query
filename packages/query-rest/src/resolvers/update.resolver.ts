// eslint-disable-next-line max-classes-per-file
import { Param } from '@nestjs/common'
import { PartialType } from '@nestjs/mapped-types'
import { Class, DeepPartial, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { AuthorizerFilter, BodyHookArgs, Put } from '../decorators'
import { HookTypes } from '../hooks'
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors'
import { MutationArgsType, UpdateOneInputType } from '../types'
import { BaseServiceResolver, MutationOpts, ResolverClass, ServiceResolver } from './resolver.interface'

export interface UpdateResolverOpts<DTO, U = DeepPartial<DTO>> extends MutationOpts {
  UpdateDTOClass?: Class<U>
  UpdateOneInput?: Class<UpdateOneInputType<U>>
}

export interface UpdateResolver<DTO, U, QS extends QueryService<DTO, unknown, U>> extends ServiceResolver<DTO, QS> {
  updateOne(id: string, input: MutationArgsType<UpdateOneInputType<U>>, authFilter?: Filter<DTO>): Promise<DTO>
}

/** @internal */
const defaultUpdateDTO = <DTO, U>(DTOClass: Class<DTO>): Class<U> => {
  const DefaultUpdateDTO = PartialType(DTOClass) as Class<U>

  Object.defineProperty(DefaultUpdateDTO, 'name', {
    writable: false,
    // set a unique name otherwise DI does not inject a unique one for each request
    value: `Update${DTOClass.name}`
  })

  return DefaultUpdateDTO
}

const defaultUpdateOneInput = <DTO, U>(DTOClass: Class<DTO>, UpdateDTO: Class<U>): Class<UpdateOneInputType<U>> => {
  return UpdateOneInputType(DTOClass, UpdateDTO)
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

    const { UpdateDTOClass = defaultUpdateDTO(DTOClass), UpdateOneInput = defaultUpdateOneInput(DTOClass, UpdateDTOClass) } = opts

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'UpdateDTOClass', 'UpdateOneInput', 'UpdateManyInput')

    class UOI extends MutationArgsType(UpdateOneInput) {}

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
        @Param('id') id: string,
        @BodyHookArgs() { input }: UOI,
        @AuthorizerFilter({
          operationGroup: OperationGroup.UPDATE,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<DTO> {
        return this.service.updateOne(id, input.update, { filter: authorizeFilter ?? {} })
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
