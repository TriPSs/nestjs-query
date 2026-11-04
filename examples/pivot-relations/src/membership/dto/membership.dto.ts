import { GraphQLISODateTime, ObjectType } from '@nestjs/graphql'
import { FilterableField, PivotMapping } from '@ptc-org/nestjs-query-graphql'

import { GroupDTO } from '../../group/dto/group.dto'
import { UserDTO } from '../../user/dto/user.dto'

/**
 * The properties of the relationship between a user and a group.
 *
 * The keys live on the entity, not here — this type is only the data the relationship carries.
 */
@ObjectType('Membership')
@PivotMapping([
  [
    { DTO: () => UserDTO, key: 'userId' },
    { DTO: () => GroupDTO, key: 'groupId' }
  ]
])
export class MembershipDTO {
  @FilterableField(() => GraphQLISODateTime, { nullable: true })
  since?: Date

  @FilterableField({ nullable: true })
  role?: string
}
