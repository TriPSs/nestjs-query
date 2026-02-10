import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { UserEntity } from './user.entity'

// Default test users for federation testing
const DEFAULT_USERS = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
]

@Injectable()
export class UserSeederService implements OnModuleInit {
  private readonly logger = new Logger(UserSeederService.name)

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed()
  }

  async seed(): Promise<void> {
    const count = await this.userRepository.count()
    if (count > 0) {
      this.logger.log(`Database already has ${count} users, skipping seed`)
      return
    }

    this.logger.log('Seeding default users...')
    for (const userData of DEFAULT_USERS) {
      const user = this.userRepository.create(userData)
      await this.userRepository.save(user)
    }
    this.logger.log(`Seeded ${DEFAULT_USERS.length} default users`)
  }
}
