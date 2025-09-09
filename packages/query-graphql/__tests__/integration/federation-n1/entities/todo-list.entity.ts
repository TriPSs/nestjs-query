// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { TodoItem } from './todo-item.entity'

@Entity('test_todo_list')
export class TodoList {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @OneToMany(() => TodoItem, (item) => item.list)
  items: TodoItem[]
}
