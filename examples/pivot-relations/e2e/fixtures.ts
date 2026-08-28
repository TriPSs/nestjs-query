import { DataSource } from 'typeorm'

import { executeTruncate } from '../../helpers'
import { GroupEntity } from '../src/group/group.entity'
import { MembershipEntity } from '../src/membership/membership.entity'
import { UserEntity } from '../src/user/user.entity'

const tables = ['membership', 'user', 'group']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const userRepo = dataSource.getRepository(UserEntity)
  const groupRepo = dataSource.getRepository(GroupEntity)
  const membershipRepo = dataSource.getRepository(MembershipEntity)

  const [alice, bob] = await userRepo.save([{ name: 'Alice' }, { name: 'Bob' }])
  const [admins, engineers, guests] = await groupRepo.save([{ name: 'Admins' }, { name: 'Engineers' }, { name: 'Guests' }])

  await membershipRepo.save([
    { userId: alice.id, groupId: admins.id, since: new Date('2020-01-01T00:00:00.000Z'), role: 'owner' },
    { userId: alice.id, groupId: engineers.id, since: new Date('2021-06-15T00:00:00.000Z'), role: 'member' },
    { userId: bob.id, groupId: engineers.id, since: new Date('2022-03-10T00:00:00.000Z'), role: 'member' },
    // A relationship without properties, to prove the field is nullable.
    { userId: bob.id, groupId: guests.id }
  ])
}
