import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity()
export class TestSoftDeleteEntity {
  @PrimaryKey()
  testEntityPk!: string

  @Property()
  stringType!: string

  @Property({ nullable: true })
  deletedAt?: Date
}
