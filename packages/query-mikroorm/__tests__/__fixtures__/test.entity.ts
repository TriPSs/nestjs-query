import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, ManyToMany, OneToOne, Collection } from '@mikro-orm/core'

import { TestRelation } from './test-relation.entity'

@Entity()
export class TestEntity {
  @PrimaryKey()
  testEntityPk!: string

  @Property()
  stringType!: string

  @Property()
  boolType!: boolean

  @Property()
  numberType!: number

  @Property()
  dateType!: Date

  @OneToMany(() => TestRelation, (relation) => relation.testEntity)
  testRelations = new Collection<TestRelation>(this)

  @ManyToOne(() => TestRelation, { nullable: true })
  manyToOneRelation?: TestRelation

  @ManyToMany(() => TestRelation, (relation) => relation.manyTestEntities, { owner: true })
  manyTestRelations = new Collection<TestRelation>(this)

  @OneToOne(() => TestRelation, (relation) => relation.oneTestEntity, { owner: true, nullable: true })
  oneTestRelation?: TestRelation
}
