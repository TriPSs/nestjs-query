import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { TagEntity } from './tag.entity'

// Default test tags for federation testing with UUID IDs
// Using fixed UUIDs to ensure consistent references from todo-service
const DEFAULT_TAGS = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Frontend', color: '#3498db' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Backend', color: '#2ecc71' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Bug', color: '#e74c3c' }
]

@Injectable()
export class TagSeederService implements OnModuleInit {
  private readonly logger = new Logger(TagSeederService.name)

  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed()
  }

  async seed(): Promise<void> {
    const count = await this.tagRepository.count()
    if (count > 0) {
      this.logger.log(`Database already has ${count} tags, skipping seed`)
      return
    }

    this.logger.log('Seeding default tags...')
    for (const tagData of DEFAULT_TAGS) {
      const tag = this.tagRepository.create(tagData)
      await this.tagRepository.save(tag)
    }
    this.logger.log(`Seeded ${DEFAULT_TAGS.length} default tags`)
  }
}
