// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { SoftDeleteParent } from './soft-delete-parent.entity'

@Entity('test_soft_delete_item')
export class SoftDeleteItem {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  parentId: number

  @Column()
  content: string

  @DeleteDateColumn()
  deletedAt: Date

  @ManyToOne(() => SoftDeleteParent, (parent) => parent.items)
  parent: SoftDeleteParent
}
