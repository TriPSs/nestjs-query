import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { typeormOrmConfig } from '../../helpers'
import { SubTaskModule } from './sub-task/sub-task.module'
import { TagModule } from './tag/tag.module'
import { TodoItemModule } from './todo-item/todo-item.module'

@Module({
  imports: [TypeOrmModule.forRoot(typeormOrmConfig('basic')), SubTaskModule, TodoItemModule, TagModule]
})
export class AppModule {}
