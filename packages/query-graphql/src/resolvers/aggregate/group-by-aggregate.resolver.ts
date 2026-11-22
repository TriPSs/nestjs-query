import { Provider } from '@nestjs/common'
import { Args, Parent, registerEnumType, Resolver } from '@nestjs/graphql'
import { Class, GroupBy, MapReflector } from '@ptc-org/nestjs-query-core'

import { getGraphqlObjectName } from '../../common'
import { getFilterableFields, ResolverField } from '../../decorators'
import { AggregateResponseType } from '../../types'

const reflector = new MapReflector('nestjs-query:aggregate-group-by-resolver')

registerEnumType(GroupBy, {
  name: 'GroupBy', // this one is mandatory
  description: 'Group by' // this one is optional
})

// @nestjs/graphql 14 binds inherited field resolvers to the final resolver's parent
// type, so the group-by field resolvers live on their own @Resolver class targeting
// the aggregate group-by type instead of being mixed into the CRUD resolver.
export const createGroupByResolver = <DTO>(DTOClass: Class<DTO>): Provider | null => {
  const objName = getGraphqlObjectName(DTOClass, 'Unable to make AggregationResponseType.')
  const aggName = `${objName}AggregateGroupBy`

  return reflector.memoize(DTOClass, aggName, () => {
    const fields = getFilterableFields(DTOClass).filter((field) => field.target === Date)

    // If there are no date fields there is nothing to resolve
    if (!fields.length) {
      return null
    }

    const [, GroupByType] = AggregateResponseType(DTOClass)

    const GroupByResolverClass = fields.reduce(
      (Base, field) => {
        @Resolver(() => GroupByType)
        class GroupByResolver extends Base {
          @ResolverField(field.schemaName, () => field.target, { nullable: true })
          [field.schemaName](
            @Parent() dto: DTO,
            @Args('by', {
              type: () => GroupBy,
              defaultValue: GroupBy.DAY
            }) // eslint-disable-next-line @typescript-eslint/no-unused-vars
            by: string
          ): unknown {
            return (dto as Record<string, unknown>)[field.propertyName]
          }
        }

        return GroupByResolver
      },
      class Base {} as Class<unknown>
    )

    // need to set class name so DI works properly
    Object.defineProperty(GroupByResolverClass, 'name', { value: `${objName}GroupByResolver`, writable: false })
    return GroupByResolverClass
  })
}
