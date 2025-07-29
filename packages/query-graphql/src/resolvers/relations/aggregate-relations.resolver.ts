import { ExecutionContext, Inject, Optional } from '@nestjs/common'
import { Args, ArgsType, Context, Parent, Resolver } from '@nestjs/graphql'
import { AggregateQuery, AggregateResponse, Class, mergeFilter, QueryService } from '@ptc-org/nestjs-query-core'

import { Authorizer, getAuthorizerToken, OperationGroup } from '../../auth'
import { getDTONames } from '../../common'
import { AggregateQueryParam, ResolverField } from '../../decorators'
import { InjectDataLoaderConfig } from '../../decorators/inject-dataloader-config.decorator'
import { AuthorizerInterceptor } from '../../interceptors'
import { AggregateRelationsLoader, DataLoaderFactory } from '../../loader'
import { DataLoaderOptions } from '../../pipes/inject-data-loader-config.pipe'
import { AggregateArgsType, AggregateResponseType } from '../../types'
import { transformAndValidate } from '../helpers'
import { BaseServiceResolver, ServiceResolver } from '../resolver.interface'
import { flattenRelations, removeRelationOpts } from './helpers'
import { RelationsOpts, ResolverRelation } from './relations.interface'

export interface AggregateRelationsResolverOpts extends RelationsOpts {
  /**
   * Enable relation aggregation queries on relation
   */
  enableAggregate?: boolean
}

type AggregateRelationOpts<Relation> = ResolverRelation<Relation>

const AggregateRelationMixin =
  <DTO, Relation>(DTOClass: Class<DTO>, relation: AggregateRelationOpts<Relation>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    if (!relation.enableAggregate && !relation.aggregate?.enabled) {
      return Base
    }
    const commonResolverOpts = relation.aggregate || removeRelationOpts(relation)
    const relationDTO = relation.DTO
    const dtoName = getDTONames(DTOClass).baseName
    const { baseName, baseNameLower } = getDTONames(relationDTO, {
      dtoName: relation.dtoName
    })
    const relationName = relation.relationName ?? baseNameLower
    const aggregateRelationLoaderName = `aggregate${baseName}For${dtoName}`
    const aggregateLoader = new AggregateRelationsLoader<DTO, Relation>(relationDTO, relationName)
    const authorizerKey = Symbol(`authorizerFor${DTOClass.name}`)
    const relationAuthorizerKey = Symbol(`authorizerFor${relation.dtoName}`)

    @ArgsType()
    class RelationQA extends AggregateArgsType(relationDTO) {}

    const [AR] = AggregateResponseType(relationDTO, { prefix: `${dtoName}${baseName}` })

    @Resolver(() => DTOClass, { isAbstract: true })
    class AggregateMixin extends Base {
      @Optional() @Inject(getAuthorizerToken(DTOClass)) [authorizerKey]?: Authorizer<Relation>;

      @Optional() @Inject(getAuthorizerToken(relationDTO)) [relationAuthorizerKey]?: Authorizer<Relation>

      @ResolverField(
        `${baseNameLower}Aggregate`,
        () => [AR],
        {
          description: relation.aggregate?.description
        },
        commonResolverOpts,
        {
          interceptors: [AuthorizerInterceptor(DTOClass)]
        }
      )
      async [`aggregate${baseName}`](
        @Parent() dto: DTO,
        @Args() q: RelationQA,
        @AggregateQueryParam() aggregateQuery: AggregateQuery<Relation>,
        @Context() context: ExecutionContext,
        @InjectDataLoaderConfig()
        dataLoaderConfig?: DataLoaderOptions
      ): Promise<AggregateResponse<Relation>> {
        const qa = await transformAndValidate(RelationQA, q)
        const loader = DataLoaderFactory.getOrCreateLoader(
          context,
          aggregateRelationLoaderName,
          () => aggregateLoader.createLoader(this.service),
          dataLoaderConfig
        )
        const authContext = {
          operationName: baseNameLower,
          operationGroup: OperationGroup.AGGREGATE,
          readonly: true,
          many: true
        }
        const authFilter = relation.auth
          ? await relation.auth?.authorize(context, authContext)
          : ((await this[authorizerKey]?.authorizeRelation(baseNameLower, context, authContext)) ??
            (await this[relationAuthorizerKey]?.authorize(context, authContext)))

        return loader.load({
          dto,
          filter: mergeFilter(qa.filter ?? {}, authFilter ?? {}),
          aggregate: aggregateQuery
        })
      }
    }

    return AggregateMixin
  }

export const AggregateRelationsMixin =
  <DTO>(DTOClass: Class<DTO>, relations: AggregateRelationsResolverOpts) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    const { many, enableAggregate } = relations
    const manyRelations = flattenRelations(many ?? {})
    return manyRelations.reduce((RB, a) => AggregateRelationMixin(DTOClass, { enableAggregate, ...a })(RB), Base)
  }

export const AggregateRelationsResolver = <DTO>(
  DTOClass: Class<DTO>,
  relations: AggregateRelationsResolverOpts
): Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>> =>
  AggregateRelationsMixin(DTOClass, relations)(BaseServiceResolver)
