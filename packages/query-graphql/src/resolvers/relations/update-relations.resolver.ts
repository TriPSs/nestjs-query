// eslint-disable-next-line max-classes-per-file
import { Inject, NotFoundException } from '@nestjs/common'
import { Args, ArgsType, InputType, Resolver } from '@nestjs/graphql'
import {
  Class,
  Filter,
  getQueryServiceToken,
  mergeFilter,
  ModifyRelationOptions,
  QueryService,
  upperCaseFirst
} from '@ptc-org/nestjs-query-core'

import { OperationGroup } from '../../auth'
import { getDTONames, mergeBaseResolverOpts } from '../../common'
import { getIDField, ModifyRelationAuthorizerFilter } from '../../decorators'
import { ResolverRelationMutation } from '../../decorators/resolver-relation-mutation.decorator'
import { AuthorizerInterceptor } from '../../interceptors'
import {
  getOrCreatePivotPropertiesType,
  MutationArgsType,
  PivotPropertiesInputType,
  RelationInputType,
  RelationsInputType
} from '../../types'
import { transformAndValidate } from '../helpers'
import { BaseServiceResolver, ServiceResolver } from '../resolver.interface'
import { flattenRelations, removeRelationOpts } from './helpers'
import {
  DEFAULT_PIVOT_FIELD_NAME,
  getPivotFilter,
  getPivotService,
  pivotKeyFields,
  pivotPropertiesTypeName,
  resolvePivot
} from './pivot.helpers'
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
    const { baseNameLower, baseName } = getDTONames(relationDTO, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? baseNameLower

    @InputType(`Set${baseName}On${dtoNames.baseName}Input`)
    class RIT extends RelationInputType(DTOClass, relationDTO) {}

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
    const relationNames = getDTONames(relationDTO, { dtoName: relation.dtoName })
    const { baseNameLower, baseName } = relationNames
    const relationName = relation.relationName ?? baseNameLower

    const resolved = relation.pivot ? resolvePivot(relation.pivot, DTOClass, relationDTO, baseNameLower) : undefined
    const pivot = resolved?.enableUpdate ? resolved : undefined
    const pivotFieldName = pivot?.fieldName ?? DEFAULT_PIVOT_FIELD_NAME
    const pivotServiceKey = `pivot${baseName}Service`
    const PivotProperties = pivot
      ? getOrCreatePivotPropertiesType(pivot.DTO, {
          typeName: pivotPropertiesTypeName(dtoNames, relationNames),
          omit: pivotKeyFields(pivot)
        })
      : undefined
    const relationsInputOpts = PivotProperties
      ? { pivot: { PropertiesClass: PivotProperties, fieldName: pivotFieldName, description: pivot?.description } }
      : undefined

    @InputType(`Add${baseName}To${dtoNames.baseName}Input`)
    class AddRelationInput extends RelationsInputType(DTOClass, relationDTO, relationsInputOpts) {}

    @ArgsType()
    class AddArgs extends MutationArgsType(AddRelationInput) {}

    @InputType(`Set${baseName}On${dtoNames.baseName}Input`)
    class SetRelationInput extends RelationsInputType(DTOClass, relationDTO, relationsInputOpts) {}

    @ArgsType()
    class SetArgs extends MutationArgsType(SetRelationInput) {}

    /**
     * Writes the pivot properties of the relations that were just added or set.
     */
    const writePivotProperties = async (
      resolver: object,
      id: string | number,
      relationIds: (string | number)[],
      properties?: unknown
    ): Promise<void> => {
      if (!pivot || !properties || !relationIds.length) {
        return
      }
      const pivotService = getPivotService(resolver, pivotServiceKey, pivot)
      await pivotService.updateMany(properties, getPivotFilter(pivot, [id], relationIds))
    }

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
        const dto = await this.service.addRelations(relationName, input.id, input.relationIds, modifyRelationsFilter)
        await writePivotProperties(this, input.id, input.relationIds, input[pivotFieldName])
        return dto
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
        const { input } = await transformAndValidate(SetArgs, addArgs)
        const dto = await this.service.setRelations(relationName, input.id, input.relationIds, modifyRelationsFilter)
        await writePivotProperties(this, input.id, input.relationIds, input[pivotFieldName])
        return dto
      }
    }

    if (pivot) {
      Inject(getQueryServiceToken(pivot.ServiceClass))(UpdateManyMixin.prototype, pivotServiceKey)
    }

    return UpdateManyMixin
  }

/**
 * Adds a mutation to write the pivot properties of an existing relationship.
 */
const UpdatePivotPropertiesRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (!relation.update?.enabled || !relation.pivot) {
      return Base
    }

    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoNames = getDTONames(DTOClass)
    const relationNames = getDTONames(relationDTO, { dtoName: relation.dtoName })
    const { baseNameLower, baseName } = relationNames

    const pivot = resolvePivot(relation.pivot, DTOClass, relationDTO, baseNameLower)
    if (!pivot.enableUpdate) {
      return Base
    }

    const pivotFieldName = pivot.fieldName ?? DEFAULT_PIVOT_FIELD_NAME
    const pivotServiceKey = `pivot${baseName}PropertiesService`
    const mutationName = `set${baseName}${upperCaseFirst(pivotFieldName)}On${dtoNames.baseName}`
    const relationName = relation.relationName ?? baseNameLower
    const relationIdField = getIDField(relationDTO)?.propertyName ?? 'id'

    const PivotProperties = getOrCreatePivotPropertiesType(pivot.DTO, {
      typeName: pivotPropertiesTypeName(dtoNames, relationNames),
      omit: pivotKeyFields(pivot)
    })

    @InputType(`${upperCaseFirst(mutationName)}Input`)
    class PivotPropertiesInput extends PivotPropertiesInputType(DTOClass, relationDTO, PivotProperties, {
      fieldName: pivotFieldName,
      description: pivot.description
    }) {}

    @ArgsType()
    class PivotPropertiesArgs extends MutationArgsType(PivotPropertiesInput) {}

    @Resolver(() => DTOClass, { isAbstract: true })
    class UpdatePivotPropertiesMixin extends Base {
      @ResolverRelationMutation(
        () => DTOClass,
        {
          description: pivot.description,
          complexity: relation.update?.complexity
        },
        mergeBaseResolverOpts(relation.update, commonResolverOpts),
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [mutationName](
        @Args() pivotArgs: PivotPropertiesArgs,
        @ModifyRelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.UPDATE,
          many: true
        })
        modifyRelationsFilter?: ModifyRelationOptions<DTO, Relation>
      ): Promise<DTO> {
        const { input } = await transformAndValidate(PivotPropertiesArgs, pivotArgs)
        const pivotService = getPivotService(this, pivotServiceKey, pivot)

        // The relationship is not created here, only its properties are written, so both ends are
        // checked first - which also applies the authorizer filters.
        const dto = await this.service.getById(input.id, { filter: modifyRelationsFilter?.filter })
        const [existing] = await this.service.queryRelations(relationDTO, relationName, dto, {
          filter: mergeFilter({ [relationIdField]: { eq: input.relationId } } as Filter<Relation>, {
            ...modifyRelationsFilter?.relationFilter
          }),
          paging: { limit: 1 }
        })

        if (!existing) {
          throw new NotFoundException(`Unable to find ${baseName} ${input.relationId} on ${dtoNames.baseName} ${input.id}`)
        }

        await pivotService.updateMany(input[pivotFieldName], getPivotFilter(pivot, [input.id], [input.relationId]))

        return dto
      }
    }

    Inject(getQueryServiceToken(pivot.ServiceClass))(UpdatePivotPropertiesMixin.prototype, pivotServiceKey)

    return UpdatePivotPropertiesMixin
  }

export const UpdateRelationsMixin =
  <DTO>(DTOClass: Class<DTO>, relations: RelationsOpts) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    const manyRelations = flattenRelations(relations.many ?? {})
    const oneRelations = flattenRelations(relations.one ?? {})

    const WithMany = manyRelations.reduce(
      (RB, a) => UpdatePivotPropertiesRelationMixin(DTOClass, a)(UpdateManyRelationMixin(DTOClass, a)(RB)),
      Base
    )
    return oneRelations.reduce((RB, a) => UpdateOneRelationMixin(DTOClass, a)(RB), WithMany)
  }

export const UpdateRelationsResolver = <
  DTO,
  QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>
>(
  DTOClass: Class<DTO>,
  relations: RelationsOpts
): Class<ServiceResolver<DTO, QS>> => UpdateRelationsMixin(DTOClass, relations)(BaseServiceResolver)
