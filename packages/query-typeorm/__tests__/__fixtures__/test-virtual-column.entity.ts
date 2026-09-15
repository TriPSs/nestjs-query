import { Entity, OneToMany, PrimaryColumn, VirtualColumn } from 'typeorm'

import { TestVirtualColumnRelation } from './test-virtual-column.relation'

@Entity()
export class TestVirtualColumnEntity {
  @PrimaryColumn({ name: 'test_virtual_column_pk' })
  testVirtualColumnPk!: string

  @OneToMany(() => TestVirtualColumnRelation, (relation) => relation.testVirtualColumnEntity)
  virtualColumnRelations?: TestVirtualColumnRelation[]

  @VirtualColumn({
    query: (alias) =>
      `SELECT COUNT(*) FROM test_virtual_column_relation WHERE test_virtual_column_entity_id = ${alias}.test_virtual_column_pk`
  })
  relationCount!: number
}
