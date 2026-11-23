import { Class, QueryService } from '@ptc-org/nestjs-query-core'

import { getRelations } from '../../decorators'
import { getReferences } from '../../decorators/reference.decorator'
import { BaseResolverOptions } from '../../decorators/resolver-method.decorator'
import { ServiceResolver } from '../resolver.interface'
import { AggregateRelationsMixin } from './aggregate-relations.resolver'
import { ReadRelationsMixin } from './read-relations.resolver'
import { ReferencesRelationMixin } from './references-relation.resolver'
import { RemoveRelationsMixin } from './remove-relations.resolver'
import { UpdateRelationsMixin } from './update-relations.resolver'

export interface RelatableOpts extends BaseResolverOptions {
  enableTotalCount?: boolean
  enableAggregate?: boolean
}

// @nestjs/graphql 14 refuses field resolvers declared by sibling resolver classes.
// Relation resolvers depend only on the DTO decoration, so register them once per
// DTO class: later registrations of the same DTO (e.g. one per paging strategy)
// reuse the ones from the first.
const relatableDTOs = new WeakSet<Class<unknown>>()

export const Relatable =
  <DTO, QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>>(
    DTOClass: Class<DTO>,
    opts: RelatableOpts = {}
  ) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(Base: B): B => {
    if (relatableDTOs.has(DTOClass)) {
      return Base
    }
    relatableDTOs.add(DTOClass)

    const { enableTotalCount, enableAggregate } = opts
    const relations = getRelations(DTOClass, opts)
    const references = getReferences(DTOClass, opts)

    const referencesMixin = ReferencesRelationMixin(DTOClass, references)
    const aggregateRelationsMixin = AggregateRelationsMixin(DTOClass, { ...relations, enableAggregate })
    const readRelationsMixin = ReadRelationsMixin(DTOClass, { ...relations, enableTotalCount })
    const updateRelationsMixin = UpdateRelationsMixin(DTOClass, relations)

    return referencesMixin(
      aggregateRelationsMixin(readRelationsMixin(updateRelationsMixin(RemoveRelationsMixin(DTOClass, relations)(Base))))
    )
  }
