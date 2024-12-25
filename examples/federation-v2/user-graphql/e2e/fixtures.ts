import { DataSource } from 'typeorm'

import { executeTruncate } from '../../../helpers'
import { UserEntity } from '../src/user/user.entity'

const tables = ['user']
export const truncate = async (dataSource: DataSource): Promise<void> => executeTruncate(dataSource, tables)

export const refresh = async (dataSource: DataSource): Promise<void> => {
  await truncate(dataSource)

  const userRepo = dataSource.getRepository(UserEntity)
  await userRepo.save([
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
    { name: 'User 3', email: 'user3@example.com' }
  ])
}
