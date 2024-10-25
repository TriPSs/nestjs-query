import { Json } from 'sequelize/types/utils'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

import { JsonTypeDTO } from './dto/jsonType.dto'

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
