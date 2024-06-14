import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'todo_item' })
export class TodoItemEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column()
  completed!: boolean
}
