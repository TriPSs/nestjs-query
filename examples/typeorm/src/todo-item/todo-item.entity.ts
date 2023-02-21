import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VirtualColumn
} from 'typeorm'

import { SubTaskEntity } from '../sub-task/sub-task.entity'
import { TagEntity } from '../tag/tag.entity'

@Entity({ name: 'todo_item' })
export class TodoItemEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({ nullable: true })
  description?: string

  @Column()
  completed!: boolean

  @OneToMany(() => SubTaskEntity, (subTask) => subTask.todoItem)
  subTasks!: SubTaskEntity[]

  @VirtualColumn({
    query: (alias) => `SELECT COUNT(*)
                       FROM sub_task
                       WHERE todo_item_id = ${alias}.id`
  })
  subTasksCount: number

  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  updated!: Date

  @ManyToMany(() => TagEntity, (tag) => tag.todoItems)
  @JoinTable()
  tags!: TagEntity[]

  @Column({ type: 'integer', nullable: false, default: 0 })
  priority!: number

  @Column({ nullable: true })
  createdBy?: string

  @Column({ nullable: true })
  updatedBy?: string
}
