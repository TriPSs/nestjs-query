import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'todo_item' })
export class TodoItemEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({
    nullable: true,
    name: 'description'
  })
  'todo item description'?: string

  @Column()
  completed!: boolean

  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  updated!: Date
}
