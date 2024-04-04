import { Column, DeleteDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class TestSoftDeleteEntity {
  @PrimaryColumn({ name: 'test_entity_pk' })
  testEntityPk!: string

  @Column({ name: 'string_type' })
  stringType!: string

  @Column({ name: 'bool_type' })
  boolType!: boolean

  @Column({ name: 'number_type' })
  numberType!: number

  @Column({ name: 'date_type' })
  dateType!: Date

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date
}
