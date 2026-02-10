import { Collection, Entity, ManyToMany, ManyToOne, OneToOne, PrimaryKey, Property } from '@mikro-orm/core'

import { TestEntity } from './test.entity'

@Entity()
export class TestRelation {
  @PrimaryKey()
  id!: string

  @Property()
  relationName!: string

  @ManyToOne(() => TestEntity, { nullable: true })
  testEntity?: TestEntity

  @ManyToMany(() => TestEntity, (entity) => entity.manyTestRelations, { owner: true })
  manyTestEntities = new Collection<TestEntity>(this)

  @OneToOne(() => TestEntity, (entity) => entity.oneTestRelation, { nullable: true })
  oneTestEntity?: TestEntity
}
