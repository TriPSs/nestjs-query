// eslint-disable-next-line max-classes-per-file
import { Args, ArgsType, InputType, Resolver } from '@nestjs/graphql'
import { Class, ModifyRelationOptions, QueryService } from '@ptc-org/nestjs-query-core'

import { OperationGroup } from '../../auth'
import { getDTONames, mergeBaseResolverOpts } from '../../common'
import { ModifyRelationAuthorizerFilter } from '../../decorators'
import { ResolverRelationMutation } from '../../decorators/resolver-relation-mutation.decorator'
import { AuthorizerInterceptor } from '../../interceptors'
import { MutationArgsType, RelationInputType, RelationsInputType } from '../../types'
import { transformAndValidate } from '../helpers'
import { BaseServiceResolver, ServiceResolver } from '../resolver.interface'
import { flattenRelations, removeRelationOpts } from './helpers'
import { RelationsOpts, ResolverRelation } from './relations.interface'

const UpdateOneRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (!relation.update?.enabled) {
      return Base
    }

    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoNames = getDTONames(DTOClass)
    const { baseNameLower, baseName } = getDTONames(relationDTO as Class<Relation>, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? baseNameLower

    @InputType(`Set${baseName}On${dtoNames.baseName}Input`)
    class RIT extends RelationInputType(DTOClass, relationDTO as Class<unknown>) {}

    @ArgsType()
    class SetArgs extends MutationArgsType(RIT) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class UpdateOneMixin extends Base {
      @ResolverRelationMutation(
        () => DTOClass,
        {
          description: relation.update?.description,
          complexity: relation.update?.complexity
        },
        mergeBaseResolverOpts(relation.update, commonResolverOpts),
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [`set${baseName}On${dtoNames.baseName}`](
        @Args() setArgs: SetArgs,
        @ModifyRelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.UPDATE,
          many: false
        })
        modifyRelationsFilter?: ModifyRelationOptions<DTO, Relation>
      ): Promise<DTO> {
        const { input } = await transformAndValidate(SetArgs, setArgs)
        return this.service.setRelation(relationName, input.id, input.relationId, modifyRelationsFilter)
      }
    }

    return UpdateOneMixin
  }

const UpdateManyRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (!relation.update?.enabled) {
      return Base
    }

    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoNames = getDTONames(DTOClass)
    const { baseNameLower, baseName } = getDTONames(relationDTO as Class<Relation>, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? baseNameLower

    @InputType(`Add${baseName}To${dtoNames.baseName}Input`)
    class AddRelationInput extends RelationsInputType(DTOClass, relationDTO as Class<unknown>) {}

    @ArgsType()
    class AddArgs extends MutationArgsType(AddRelationInput) {}

    @InputType(`Set${baseName}On${dtoNames.baseName}Input`)
    class SetRelationInput extends RelationsInputType(DTOClass, relationDTO as Class<unknown>) {}

    @ArgsType()
    class SetArgs extends MutationArgsType(SetRelationInput) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class UpdateManyMixin extends Base {
      @ResolverRelationMutation(
        () => DTOClass,
        {
          description: relation.update?.description,
          complexity: relation.update?.complexity
        },
        mergeBaseResolverOpts(relation.update, commonResolverOpts),
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [`add${baseName}To${dtoNames.baseName}`](
        @Args() addArgs: AddArgs,
        @ModifyRelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.UPDATE,
          many: true
        })
        modifyRelationsFilter?: ModifyRelationOptions<DTO, Relation>
      ): Promise<DTO> {
        const { input } = await transformAndValidate(AddArgs, addArgs)
        return this.service.addRelations(relationName, input.id, input.relationIds, modifyRelationsFilter)
      }

      @ResolverRelationMutation(
        () => DTOClass,
        {
          complexity: relation.update?.complexity
        },
        mergeBaseResolverOpts(relation.update, commonResolverOpts),
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [`set${baseName}On${dtoNames.baseName}`](
        @Args() addArgs: SetArgs,
        @ModifyRelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.UPDATE,
          many: true
        })
        modifyRelationsFilter?: ModifyRelationOptions<DTO, Relation>
      ): Promise<DTO> {
        const { input } = await transformAndValidate(AddArgs, addArgs)
        return this.service.setRelations(relationName, input.id, input.relationIds, modifyRelationsFilter)
      }
    }

    return UpdateManyMixin
  }

export const UpdateRelationsMixin =
  <DTO>(DTOClass: Class<DTO>, relations: RelationsOpts) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    const manyRelations = flattenRelations(relations.many ?? {})
    const oneRelations = flattenRelations(relations.one ?? {})

    const WithMany = manyRelations.reduce((RB, a) => UpdateManyRelationMixin(DTOClass, a)(RB), Base)
    return oneRelations.reduce((RB, a) => UpdateOneRelationMixin(DTOClass, a)(RB), WithMany)
  }

export const UpdateRelationsResolver = <
  DTO,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  relations: RelationsOpts
): Class<ServiceResolver<DTO, QS>> => UpdateRelationsMixin(DTOClass, relations)(BaseServiceResolver)
