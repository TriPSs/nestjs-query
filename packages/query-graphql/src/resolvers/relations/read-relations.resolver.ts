import { ExecutionContext, Inject, Optional } from '@nestjs/common'
import { Args, ArgsType, Context, Parent, Resolver } from '@nestjs/graphql'
import { Class, mergeQuery, QueryService } from '@ptc-org/nestjs-query-core'

import { Authorizer, getAuthorizerToken, OperationGroup } from '../../auth'
import { getDTONames } from '../../common'
import { GraphQLResolveInfoResult, GraphQLResultInfo, ResolverField } from '../../decorators'
import { InjectDataLoaderConfig } from '../../decorators/inject-dataloader-config.decorator'
import { AuthorizerInterceptor } from '../../interceptors'
import { CountRelationsLoader, DataLoaderFactory, FindRelationsLoader, QueryRelationsLoader } from '../../loader'
import { DataLoaderOptions } from '../../pipes/inject-data-loader-config.pipe'
import { QueryArgsType } from '../../types'
import { transformAndValidate } from '../helpers'
import { BaseServiceResolver, ServiceResolver } from '../resolver.interface'
import { flattenRelations, removeRelationOpts } from './helpers'
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
    const authorizerKey = Symbol(`authorizerFor${DTOClass.name}`)
    const relationAuthorizerKey = Symbol(`authorizerFor${relation.dtoName}`)
    const findLoader = new FindRelationsLoader<DTO, Relation>(relationDTO, relationName)

    @Resolver(() => DTOClass, { isAbstract: true })
    class ReadOneMixin extends Base {
      @Optional() @Inject(getAuthorizerToken(DTOClass)) [authorizerKey]?: Authorizer<Relation>;

      @Optional() @Inject(getAuthorizerToken(relationDTO)) [relationAuthorizerKey]?: Authorizer<Relation>

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
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<Relation>,
        @InjectDataLoaderConfig()
        dataLoaderConfig?: DataLoaderOptions
      ): Promise<Relation | undefined> {
        const authContext = {
          operationName: baseNameLower,
          operationGroup: OperationGroup.READ,
          readonly: true,
          many: false
        }
        const authFilter = relation.auth
          ? await relation.auth?.authorize(context, authContext)
          : ((await this[authorizerKey]?.authorizeRelation(baseNameLower, context, authContext)) ??
            (await this[relationAuthorizerKey]?.authorize(context, authContext)))
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
    const authorizerKey = Symbol(`authorizerFor${DTOClass.name}`)
    const relationAuthorizerKey = Symbol(`authorizerFor${relation.dtoName}`)
    const queryLoader = new QueryRelationsLoader<DTO, Relation>(relationDTO, relationName)
    const countLoader = new CountRelationsLoader<DTO, Relation>(relationDTO, relationName)
    const connectionName = `${dtoName}${baseName}Connection`

    @ArgsType()
    class RelationQA extends QueryArgsType(relationDTO, {
      ...relation,
      connectionName,
      disableKeySetPagination: true
    }) {}

    // disable keyset pagination for relations otherwise recursive paging will not work
    const { ConnectionType: CT } = RelationQA

    @Resolver(() => DTOClass, { isAbstract: true })
    class ReadManyMixin extends Base {
      @Optional() @Inject(getAuthorizerToken(DTOClass)) [authorizerKey]?: Authorizer<Relation>;

      @Optional() @Inject(getAuthorizerToken(relationDTO)) [relationAuthorizerKey]?: Authorizer<Relation>

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
        @GraphQLResultInfo(DTOClass)
        resolveInfo?: GraphQLResolveInfoResult<Relation>,
        @InjectDataLoaderConfig()
        dataLoaderConfig?: DataLoaderOptions
      ): Promise<InstanceType<typeof CT>> {
        const authContext = {
          operationName: baseNameLower,
          operationGroup: OperationGroup.READ,
          readonly: true,
          many: true
        }
        const authFilter = relation.auth
          ? await relation.auth?.authorize(context, authContext)
          : ((await this[authorizerKey]?.authorizeRelation(baseNameLower, context, authContext)) ??
            (await this[relationAuthorizerKey]?.authorize(context, authContext)))
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

        return CT.createFromPromise(
          (query) => relationLoader.load({ dto, query }),
          mergeQuery(relationQuery, { filter: authFilter, relations: resolveInfo?.relations }),
          (filter) => relationCountLoader.load({ dto, filter })
        )
      }
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
