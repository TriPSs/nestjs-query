import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VirtualColumn
} from 'typeorm'

import { SubTaskEntity } from '../sub-task/sub-task.entity'
import { TodoToTagEntity } from '../todo-to-tag/todo-to-tag.entity'

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

  @OneToMany(() => TodoToTagEntity, (todoToTag) => todoToTag.todoItem)
  toTags!: TodoToTagEntity[]

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

  @DeleteDateColumn()
  deleted?: Date

  @Column({ type: 'integer', nullable: false, default: 0 })
  priority!: number

  @Column({ nullable: true })
  createdBy?: string

  @Column({ nullable: true })
  updatedBy?: string
}
