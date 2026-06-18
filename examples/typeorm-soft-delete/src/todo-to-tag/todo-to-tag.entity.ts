import { DeleteDateColumn, Entity, JoinColumn, ManyToOne, ObjectType, PrimaryColumn } from 'typeorm'

import { TagEntity } from '../tag/tag.entity'
import { TodoItemEntity } from '../todo-item/todo-item.entity'

@Entity({ name: 'todo_to_tag' })
export class TodoToTagEntity {
  @PrimaryColumn({ name: 'todo_id' })
  todoID!: number

  @ManyToOne((): ObjectType<TodoItemEntity> => TodoItemEntity, (t) => t.toTags)
  @JoinColumn({ name: 'todo_id' })
  todoItem: TodoItemEntity

  @PrimaryColumn({ name: 'tag_id' })
  tagID!: number

  @ManyToOne((): ObjectType<TagEntity> => TagEntity, (t) => t.toTodos)
  @JoinColumn({ name: 'tag_id' })
  tag: TagEntity

  @DeleteDateColumn()
  deleted?: Date
}
