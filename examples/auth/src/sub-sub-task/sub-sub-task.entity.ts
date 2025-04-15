import { Column, Entity, JoinColumn, ManyToOne, ObjectType, PrimaryGeneratedColumn } from 'typeorm'

import { SubTaskEntity } from '../sub-task/sub-task.entity'

@Entity({ name: 'sub_sub_task' })
export class SubSubTaskEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column()
  public!: boolean

  @Column({ nullable: false, name: 'sub_task_id' })
  subTaskId!: string

  @ManyToOne((): ObjectType<SubTaskEntity> => SubTaskEntity, (st) => st.subSubTasks, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'sub_task_id' })
  subTask!: SubTaskEntity
}
