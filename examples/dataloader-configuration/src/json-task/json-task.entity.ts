import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'json_task' })
export class JsonTaskEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column({ nullable: true })
  description?: string

  @Column({ type: 'jsonb', nullable: true })
  display: object

  @Column({ nullable: true })
  createdBy?: string

  @Column({ nullable: true })
  updatedBy?: string
}
