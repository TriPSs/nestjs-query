import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, VirtualColumn } from 'typeorm'

import { TestVirtualColumnEntity } from './test-virtual-column.entity'

@Entity()
export class TestVirtualColumnRelation {
  @PrimaryColumn({ name: 'test_virtual_column_relation_pk' })
  testVirtualColumnRelationPk!: string

  @Column({ name: 'test_virtual_column_entity_id', nullable: true })
  testVirtualColumnEntityId?: string

  @ManyToOne(() => TestVirtualColumnEntity, (entity) => entity.virtualColumnRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_virtual_column_entity_id' })
  testVirtualColumnEntity?: TestVirtualColumnEntity

  @VirtualColumn({
    query: (alias) =>
      `SELECT COUNT(*) FROM test_virtual_column_relation WHERE test_virtual_column_entity_id = ${alias}.test_virtual_column_entity_id`
  })
  siblingCount!: number
}
