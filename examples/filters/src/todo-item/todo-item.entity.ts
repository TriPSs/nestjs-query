import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'todo_item' })
export class TodoItemEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({
    type: String,
    nullable: true,
    name: 'description'
  })
  'todo item description'?: string | null

  @Column()
  completed!: boolean

  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  updated!: Date
}
