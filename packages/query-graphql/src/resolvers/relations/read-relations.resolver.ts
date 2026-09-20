import { ExecutionContext, Inject } from '@nestjs/common'
import { Args, ArgsType, Context, Parent, Resolver } from '@nestjs/graphql'
import { Class, Filter, getQueryServiceToken, mergeFilter, mergeQuery, QueryService } from '@ptc-org/nestjs-query-core'

import { OperationGroup } from '../../auth'
import { getDTONames } from '../../common'
import { GraphQLResolveInfoResult, GraphQLResultInfo, RelationAuthorizerFilter, ResolverField } from '../../decorators'
import { InjectDataLoaderConfig } from '../../decorators/inject-dataloader-config.decorator'
import { AuthorizerInterceptor } from '../../interceptors'
import {
  CountRelationsLoader,
  DataLoaderFactory,
  FindRelationsLoader,
  PivotFilterLoader,
  PivotRelationsLoader,
  QueryRelationsLoader
} from '../../loader'
import { DataLoaderOptions } from '../../pipes/inject-data-loader-config.pipe'
import { DEFAULT_PIVOT_FIELD_NAME, PagingStrategies, QueryArgsType } from '../../types'
import { transformAndValidate } from '../helpers'
import { BaseServiceResolver, ServiceResolver } from '../resolver.interface'
import { flattenRelations, removeRelationOpts } from './helpers'
import { getPivotService, resolvePivot } from './pivot.helpers'
import { RelationsOpts, ResolverRelation } from './relations.interface'

export interface ReadRelationsResolverOpts extends RelationsOpts {
  enableTotalCount?: boolean
}

const ReadOneRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (relation.disableRead) {
      return Base
    }
    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const { baseNameLower, baseName } = getDTONames(relationDTO, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? baseNameLower
    const loaderName = `load${baseName}For${DTOClass.name}`
    const findLoader = new FindRelationsLoader<DTO, Relation>(relationDTO, relationName)

    @Resolver(() => DTOClass, { isAbstract: true })
    class ReadOneMixin extends Base {
      @ResolverField(
        baseNameLower,
        () => relationDTO,
        {
          nullable: relation.nullable,
          complexity: relation.complexity,
          description: relation?.description,
          deprecationReason: relation?.deprecationReason
        },
        commonResolverOpts,
        { interceptors: [AuthorizerInterceptor(DTOClass)] }
      )
      async [`find${baseName}`](
        @Parent() dto: DTO,
        @Context() context: ExecutionContext,
        @RelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.READ,
          many: false
        })
        authFilter?: Filter<Relation>,
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<Relation>,
        @InjectDataLoaderConfig()
        dataLoaderConfig?: DataLoaderOptions
      ): Promise<Relation | undefined> {
        return DataLoaderFactory.getOrCreateLoader(
          context,
          loaderName,
          () =>
            findLoader.createLoader(this.service, {
              resolveInfo: resolveInfo?.info,
              withDeleted: relation.withDeleted,
              lookedAhead: relation.enableLookAhead
            }),
          dataLoaderConfig
        ).load({
          dto,
          filter: authFilter,
          relations: resolveInfo?.relations
        })
      }
    }

    return ReadOneMixin
  }

const ReadManyRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: ResolverRelation<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (relation.disableRead) {
      return Base
    }
    const commonResolverOpts = removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoName = getDTONames(DTOClass).baseName
    const { baseNameLower, baseName } = getDTONames(relationDTO, { dtoName: relation.dtoName })
    const relationName = relation.relationName ?? baseNameLower
    const relationLoaderName = `load${baseName}For${DTOClass.name}`
    const countRelationLoaderName = `count${baseName}For${DTOClass.name}`
    const pivotRelationLoaderName = `loadPivot${baseName}For${DTOClass.name}`
    const queryLoader = new QueryRelationsLoader<DTO, Relation>(relationDTO, relationName)
    const countLoader = new CountRelationsLoader<DTO, Relation>(relationDTO, relationName)
    const connectionName = `${dtoName}${baseName}Connection`

    if (relation.pivot && relation.pagingStrategy && relation.pagingStrategy !== PagingStrategies.CURSOR) {
      throw new Error(
        `Unable to expose pivot properties on the '${baseNameLower}' relation of ${DTOClass.name}. ` +
          `Pivot properties are exposed on edges, which are only created by the ${PagingStrategies.CURSOR} paging strategy.`
      )
    }

    const pivot = relation.pivot ? resolvePivot(relation.pivot, DTOClass, relationDTO, baseNameLower) : undefined
    const pivotServiceKey = `pivot${baseName}For${DTOClass.name}Service`
    const pivotFilterLoaderName = `filterPivot${baseName}For${DTOClass.name}`
    const pivotFieldName = pivot?.fieldName ?? DEFAULT_PIVOT_FIELD_NAME
    const pivotNodeIdField = pivot?.node.idField ?? 'id'

    const pivotLoader = pivot ? new PivotRelationsLoader<DTO, Relation, unknown>(pivot) : undefined
    const pivotFilterLoader =
      pivot?.enableFilter && !relation.disableFilter ? new PivotFilterLoader<DTO, unknown>(pivot) : undefined

    @ArgsType()
    class RelationQA extends QueryArgsType(relationDTO, {
      ...relation,
      edgePivot: pivot,
      connectionName,
      disableKeySetPagination: true
    }) {}

    // disable keyset pagination for relations otherwise recursive paging will not work
    const { ConnectionType: CT } = RelationQA

    @Resolver(() => DTOClass, { isAbstract: true })
    class ReadManyMixin extends Base {
      /**
       * Resolves the connection of the relation, exposing the properties of each relationship on the
       * edges when the relation declares a pivot.
       */
      @ResolverField(
        baseNameLower,
        () => CT.resolveType,
        {
          nullable: relation.nullable,
          complexity: relation.complexity,
          description: relation?.description,
          deprecationReason: relation?.deprecationReason
        },
        commonResolverOpts,
        { interceptors: [AuthorizerInterceptor(DTOClass)] }
      )
      async [`query${baseName}`](
        @Parent() dto: DTO,
        @Args() q: RelationQA,
        @Context() context: ExecutionContext,
        @RelationAuthorizerFilter(baseNameLower, {
          operationGroup: OperationGroup.READ,
          many: true
        })
        relationFilter?: Filter<Relation>,
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<Relation>,
        @InjectDataLoaderConfig()
        dataLoaderConfig?: DataLoaderOptions
      ): Promise<InstanceType<typeof CT>> {
        const relationQuery = await transformAndValidate(RelationQA, q)
        const relationLoader = DataLoaderFactory.getOrCreateLoader(
          context,
          relationLoaderName,
          () => queryLoader.createLoader(this.service, { withDeleted: relation.withDeleted }),
          dataLoaderConfig
        )

        const relationCountLoader = DataLoaderFactory.getOrCreateLoader(
          context,
          countRelationLoaderName,
          () => countLoader.createLoader(this.service, { withDeleted: relation.withDeleted }),
          dataLoaderConfig
        )

        const pivotRelationLoader = pivotLoader
          ? DataLoaderFactory.getOrCreateLoader(
              context,
              pivotRelationLoaderName,
              () => pivotLoader.createLoader(getPivotService(this, pivotServiceKey, pivot)),
              dataLoaderConfig
            )
          : undefined

        // The filter on the pivot properties is not a field of the relation, so it is taken out and
        // resolved into the ids of the nodes it matches.
        const { [pivotFieldName]: pivotFilter, ...filter } = (relationQuery.filter ?? {}) as Record<string, unknown>
        let pivotNodeIds: unknown[] | undefined

        if (pivotFilterLoader && pivotFilter) {
          pivotNodeIds = await DataLoaderFactory.getOrCreateLoader(
            context,
            pivotFilterLoaderName,
            () => pivotFilterLoader.createLoader(getPivotService(this, pivotServiceKey, pivot)),
            dataLoaderConfig
          ).load({ dto, filter: pivotFilter as Filter<unknown> })

          if (!pivotNodeIds.length) {
            // Nothing matched, so there is no point in querying the relation at all.
            const noNodes: Relation[] = []

            return CT.createFromPromise(
              () => Promise.resolve(noNodes),
              mergeQuery(relationQuery, { filter: relationFilter }),
              () => Promise.resolve(0)
            )
          }
        }

        const query = mergeQuery(
          { ...relationQuery, filter: filter as Filter<Relation> },
          {
            filter: pivotNodeIds
              ? mergeFilter({ [pivotNodeIdField]: { in: pivotNodeIds } } as Filter<Relation>, relationFilter ?? {})
              : relationFilter,
            relations: resolveInfo?.relations
          }
        )

        return CT.createFromPromise(
          (pagedQuery) => relationLoader.load({ dto, query: pagedQuery }),
          query,
          (countFilter) => relationCountLoader.load({ dto, filter: countFilter }),
          pivotRelationLoader ? { pivot: (node) => pivotRelationLoader.load({ dto, node }) } : undefined
        )
      }
    }

    if (pivot) {
      Inject(getQueryServiceToken(pivot.ServiceClass))(ReadManyMixin.prototype, pivotServiceKey)
    }

    return ReadManyMixin
  }

export const ReadRelationsMixin =
  <DTO>(DTOClass: Class<DTO>, relations: ReadRelationsResolverOpts) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    const { many, one, enableTotalCount } = relations
    const manyRelations = flattenRelations(many ?? {})
    const oneRelations = flattenRelations(one ?? {})
    const WithMany = manyRelations.reduce((RB, a) => ReadManyRelationMixin(DTOClass, { enableTotalCount, ...a })(RB), Base)
    return oneRelations.reduce((RB, a) => ReadOneRelationMixin(DTOClass, a)(RB), WithMany)
  }

export const ReadRelationsResolver = <DTO, QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>>(
  DTOClass: Class<DTO>,
  relations: ReadRelationsResolverOpts
): Class<ServiceResolver<DTO, QS>> => ReadRelationsMixin(DTOClass, relations)(BaseServiceResolver)
