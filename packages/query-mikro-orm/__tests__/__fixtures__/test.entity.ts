import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core'

import { TestRelation } from './test-relation.entity'

@Entity()
export class TestEntity {
  @PrimaryKey()
  id!: string

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

  @ManyToMany(() => TestRelation, (relation) => relation.manyTestEntities)
  manyTestRelations = new Collection<TestRelation>(this)

  @OneToOne(() => TestRelation, (relation) => relation.oneTestEntity, { nullable: true, owner: true })
  oneTestRelation?: TestRelation
}
