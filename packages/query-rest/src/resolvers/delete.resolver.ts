// eslint-disable-next-line max-classes-per-file
import { Param } from '@nestjs/common'
import { Class, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { OperationGroup } from '../auth'
import { getDTONames } from '../common'
import { AuthorizerFilter, Delete } from '../decorators'
import { AuthorizerInterceptor } from '../interceptors'
import { FindOneArgsType } from '../types/find-one-args.type'
import { BaseServiceResolver, MutationOpts, ResolverClass, ServiceResolver } from './resolver.interface'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DeleteResolverOpts<DTO> extends MutationOpts {
  /**
   * Use soft delete when doing delete mutation
   */
  useSoftDelete?: boolean
}

export interface DeleteResolver<DTO, QS extends QueryService<DTO, unknown, unknown>> extends ServiceResolver<DTO, QS> {
  deleteOne(id: FindOneArgsType, authorizeFilter?: Filter<DTO>): Promise<Partial<DTO>>
}

/**
 * @internal
 * Mixin to add `delete` graphql endpoints.
 */
export const Deletable =
  <DTO, QS extends QueryService<DTO, unknown, unknown>>(DTOClass: Class<DTO>, opts: DeleteResolverOpts<DTO>) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<DeleteResolver<DTO, QS>> & B => {
    const dtoNames = getDTONames(DTOClass, opts)

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'DeleteOneInput', 'DeleteManyInput', 'useSoftDelete')

    class DOP extends FindOneArgsType(DTOClass) {}

    Object.defineProperty(DOP, 'name', {
      writable: false,
      // set a unique name otherwise DI does not inject a unique one for each request
      value: `FindDelete${DTOClass.name}Args`
    })

    class DeleteResolverBase extends BaseClass {
      @Delete(
        () => DTOClass,
        {
          path: opts?.one?.path ?? ':id',
          operation: {
            operationId: `${dtoNames.pluralBaseNameLower}.deleteOne`,
            tags: [...(opts.tags || []), ...(opts.one?.tags ?? [])],
            description: opts?.one?.description,
            ...opts?.one?.operationOptions
          }
        },
        { interceptors: [AuthorizerInterceptor(DTOClass)] },
        commonResolverOpts,
        opts.one ?? {}
      )
      async deleteOne(
        @Param() params: DOP,
        @AuthorizerFilter({
          operationGroup: OperationGroup.DELETE,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<Partial<DTO>> {
        return this.service.deleteOne(params.id, {
          filter: authorizeFilter ?? {},
          useSoftDelete: opts?.useSoftDelete ?? false
        })
      }
    }

    return DeleteResolverBase
  }
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const DeleteResolver = <DTO, QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>>(
  DTOClass: Class<DTO>,
  opts: DeleteResolverOpts<DTO> = {}
): ResolverClass<DTO, QS, DeleteResolver<DTO, QS>> => Deletable<DTO, QS>(DTOClass, opts)(BaseServiceResolver)
