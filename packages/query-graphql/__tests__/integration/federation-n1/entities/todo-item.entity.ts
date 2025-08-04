// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { TodoList } from './todo-list.entity'

@Entity('test_todo_item')
export class TodoItem {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  listId: number

  @Column()
  content: string

  @ManyToOne(() => TodoList, (list) => list.items)
  list: TodoList
}
