import { Args, Parent, registerEnumType, Resolver } from '@nestjs/graphql'
import { AggregateResponse, Class, GroupBy, MapReflector, QueryService } from '@ptc-org/nestjs-query-core'

import { getGraphqlObjectName } from '../../common'
import { getFilterableFields, ResolverField } from '../../decorators'
import { ServiceResolver } from '../resolver.interface'

const reflector = new MapReflector('nestjs-query:aggregate-response-type')

registerEnumType(GroupBy, {
  name: 'GroupBy', // this one is mandatory
  description: 'Group by' // this one is optional
})

export const GroupByAggregateMixin =
  <DTO>(DTOClass: Class<DTO>, AR: Class<AggregateResponse<DTO>>) =>
  <B extends Class<ServiceResolver<DTO, QueryService<DTO, unknown, unknown>>>>(Base: B): B => {
    const objName = getGraphqlObjectName(DTOClass, 'Unable to make AggregationResponseType.')

    const aggName = `${objName}AggregateGroupBy`
    return reflector.memoize(DTOClass, aggName, () => {
      const fields = getFilterableFields(DTOClass).filter((field) => field.target === Date)

      // If there are no date fields return base
      if (!fields.length) {
        return Base
      }

      return fields.reduce((RB, field) => {
        @Resolver(() => AR, { isAbstract: true })
        class ReadOneMixin extends RB {
          @ResolverField(field.propertyName, () => field.target, { nullable: true })
          [field.propertyName](
            @Parent() dto: DTO,
            @Args('by', {
              type: () => GroupBy,
              defaultValue: GroupBy.DAY,
              nullable: true
            })
            by: string
          ): unknown {
            return dto[field.propertyName]
          }
        }

        return ReadOneMixin
      }, Base)
    })
  }
