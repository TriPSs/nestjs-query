// eslint-disable-next-line import/no-extraneous-dependencies
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { SoftDeleteItem } from './soft-delete-item.entity'

@Entity('test_soft_delete_parent')
export class SoftDeleteParent {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ nullable: true })
  featuredItemId: number

  @ManyToOne(() => SoftDeleteItem, { nullable: true })
  @JoinColumn({ name: 'featuredItemId' })
  featuredItem: SoftDeleteItem

  @OneToMany(() => SoftDeleteItem, (item) => item.parent)
  items: SoftDeleteItem[]
}
