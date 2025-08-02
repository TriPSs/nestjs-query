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

const RemoveOneRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (!relation.remove?.enabled) {
      return Base
    }

    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoNames = getDTONames(DTOClass)
    const { baseNameLower, baseName } = getDTONames(relationDTO as Class<Relation>, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? baseNameLower

    @InputType(`Remove${baseName}From${dtoNames.baseName}Input`)
    class RIT extends RelationInputType(DTOClass, relationDTO as Class<unknown>) {}

    @ArgsType()
    class SetArgs extends MutationArgsType(RIT) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class RemoveOneMixin extends Base {
      @ResolverRelationMutation(
        () => DTOClass,
        {
          description: relation.remove?.description,
          complexity: relation.remove?.complexity
        },
        mergeBaseResolverOpts(relation.remove, commonResolverOpts),
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [`remove${baseName}From${dtoNames.baseName}`](
        @Args() setArgs: SetArgs,
        @ModifyRelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.UPDATE,
          many: false
        })
        modifyRelationsFilter?: ModifyRelationOptions<DTO, Relation>
      ): Promise<DTO> {
        const { input } = await transformAndValidate(SetArgs, setArgs)
        return this.service.removeRelation(relationName, input.id, input.relationId, modifyRelationsFilter)
      }
    }

    return RemoveOneMixin
  }

const RemoveManyRelationsMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (!relation.remove?.enabled) {
      return Base
    }

    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoNames = getDTONames(DTOClass)
    const { pluralBaseNameLower, pluralBaseName } = getDTONames(relationDTO as Class<Relation>, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? pluralBaseNameLower

    @InputType(`Remove${pluralBaseName}From${dtoNames.baseName}Input`)
    class RIT extends RelationsInputType(DTOClass, relationDTO as Class<unknown>) {}

    @ArgsType()
    class AddArgs extends MutationArgsType(RIT) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class Mixin extends Base {
      @ResolverRelationMutation(
        () => DTOClass,
        {
          description: relation.remove?.description,
          complexity: relation.remove?.complexity
        },
        mergeBaseResolverOpts(relation.remove, commonResolverOpts),
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [`remove${pluralBaseName}From${dtoNames.baseName}`](
        @Args() addArgs: AddArgs,
        @ModifyRelationAuthorizerFilter(pluralBaseNameLower, {
          operationGroup: OperationGroup.UPDATE,
          many: true
        })
        modifyRelationsFilter?: ModifyRelationOptions<DTO, Relation>
      ): Promise<DTO> {
        const { input } = await transformAndValidate(AddArgs, addArgs)
        return this.service.removeRelations(relationName, input.id, input.relationIds, modifyRelationsFilter)
      }
    }

    return Mixin
  }

export const RemoveRelationsMixin =
  <DTO>(DTOClass: Class<DTO>, relations: RelationsOpts) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    const manyRelations = flattenRelations(relations.many ?? {})
    const oneRelations = flattenRelations(relations.one ?? {})

    const WithMany = manyRelations.reduce((RB, a) => RemoveManyRelationsMixin(DTOClass, a)(RB), Base)
    return oneRelations.reduce((RB, a) => RemoveOneRelationMixin(DTOClass, a)(RB), WithMany)
  }

export const RemoveRelationsResolver = <
  DTO,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  relations: RelationsOpts
): Class<ServiceResolver<DTO, QS>> => RemoveRelationsMixin(DTOClass, relations)(BaseServiceResolver)
