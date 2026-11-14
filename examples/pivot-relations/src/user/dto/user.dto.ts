import { ID, ObjectType } from '@nestjs/graphql'
import { CursorConnection, FilterableField } from '@ptc-org/nestjs-query-graphql'

import { GroupDTO } from '../../group/dto/group.dto'
import { MembershipDTO } from '../../membership/dto/membership.dto'

@ObjectType('User')
@CursorConnection('groups', () => GroupDTO, {
  enableTotalCount: true,
  update: { enabled: true },
  remove: { enabled: true },
  // How the membership ties User to Group comes from its own @PivotMapping.
  pivot: {
    DTO: () => MembershipDTO,
    enableUpdate: true,
    // allows `groups(filter: { properties: { role: { eq: "owner" } } })`
    enableFilter: true
  }
})
export class UserDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  name!: string
}
