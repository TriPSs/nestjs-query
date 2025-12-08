import { Entity, PrimaryKey, Property, ManyToOne, ManyToMany, OneToOne, Collection } from '@mikro-orm/core'

import { TestEntity } from './test.entity'

@Entity()
export class TestRelation {
  @PrimaryKey()
  testRelationPk!: string

  @Property()
  relationName!: string

  @Property({ nullable: true })
  testEntityId?: string

  @ManyToOne(() => TestEntity, { nullable: true })
  testEntity?: TestEntity

  @ManyToMany(() => TestEntity, (entity) => entity.manyTestRelations)
  manyTestEntities = new Collection<TestEntity>(this)

  @OneToOne(() => TestEntity, (entity) => entity.oneTestRelation, { nullable: true })
  oneTestEntity?: TestEntity
}
