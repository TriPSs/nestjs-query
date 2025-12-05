import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { TodoItemEntity } from './todo-item.entity'

// Default test todo items for federation testing
const DEFAULT_TODO_ITEMS = [
  { id: 1, title: 'Learn GraphQL Federation', description: 'Study Apollo Federation v2', completed: false, assigneeId: 1 },
  { id: 2, title: 'Fix Issue #410', description: 'Fix referenceBy broken issue', completed: false, assigneeId: 2 },
  { id: 3, title: 'Write Tests', description: 'Add e2e tests for federation', completed: true, assigneeId: 1 }
]

@Injectable()
export class TodoItemSeederService implements OnModuleInit {
  private readonly logger = new Logger(TodoItemSeederService.name)

  constructor(
    @InjectRepository(TodoItemEntity)
    private readonly todoItemRepository: Repository<TodoItemEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed()
  }

  async seed(): Promise<void> {
    const count = await this.todoItemRepository.count()
    if (count > 0) {
      this.logger.log(`Database already has ${count} todo items, skipping seed`)
      return
    }

    this.logger.log('Seeding default todo items...')
    for (const todoData of DEFAULT_TODO_ITEMS) {
      const todo = this.todoItemRepository.create(todoData)
      await this.todoItemRepository.save(todo)
    }
    this.logger.log(`Seeded ${DEFAULT_TODO_ITEMS.length} default todo items`)
  }
}
