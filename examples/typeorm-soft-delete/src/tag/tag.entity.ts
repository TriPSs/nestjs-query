import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

import { TodoToTagEntity } from '../todo-to-tag/todo-to-tag.entity'

@Entity({ name: 'tag' })
export class TagEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @OneToMany(() => TodoToTagEntity, (todoToTag) => todoToTag.tag)
  toTodos!: TodoToTagEntity[]

  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  updated!: Date

  @DeleteDateColumn()
  deleted?: Date
}
