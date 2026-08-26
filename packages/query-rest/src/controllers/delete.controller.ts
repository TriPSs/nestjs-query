// eslint-disable-next-line max-classes-per-file
import { Class, Filter, QueryService } from '@ptc-org/nestjs-query-core'
import omit from 'lodash.omit'

import { AuthorizerFilter, AuthorizerInterceptor, Delete, OperationGroup, ParamArgsType } from '../'
import { getDTONames } from '../common'
import { ParamArgs } from '../decorators/param-args.decorator'
import { BaseServiceResolver, ControllerClass, MutationOpts, ServiceController } from './controller.interface'

export interface DeleteResolverOpts extends MutationOpts {
  /**
   * Use soft delete when doing delete mutation
   */
  useSoftDelete?: boolean
}

export interface DeleteController<DTO, QS extends QueryService<DTO, unknown, unknown>> extends ServiceController<DTO, QS> {
  deleteOne(id: ParamArgsType, authorizeFilter?: Filter<DTO>): Promise<Partial<DTO>>
}

/**
 * @internal
 * Mixin to add `delete` REST endpoints.
 */
export const Deletable =
  <DTO, QS extends QueryService<DTO, unknown, unknown>>(DTOClass: Class<DTO>, opts: DeleteResolverOpts) =>
  <B extends Class<ServiceController<DTO, QS>>>(BaseClass: B): Class<DeleteController<DTO, QS>> & B => {
    if (opts.disabled) {
      return BaseClass as never
    }

    const dtoNames = getDTONames(DTOClass, opts)

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'DeleteOneInput', 'DeleteManyInput', 'useSoftDelete')

    class DOP extends ParamArgsType(DTOClass) {}

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
        @ParamArgs() params: DOP,
        @AuthorizerFilter({
          operationGroup: OperationGroup.DELETE,
          many: false
        })
        authorizeFilter?: Filter<DTO>
      ): Promise<Partial<DTO>> {
        return this.service.deleteOne(params.getId(), {
          filter: authorizeFilter ?? {},
          useSoftDelete: opts?.useSoftDelete ?? false
        })
      }
    }

    return DeleteResolverBase
  }
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const DeleteController = <DTO, QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>>(
  DTOClass: Class<DTO>,
  opts: DeleteResolverOpts = {}
): ControllerClass<DTO, QS, DeleteController<DTO, QS>> => Deletable<DTO, QS>(DTOClass, opts)(BaseServiceResolver)
