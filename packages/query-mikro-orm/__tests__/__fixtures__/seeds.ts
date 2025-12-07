import { EntityManager } from '@mikro-orm/core'

import { TestEntity } from './test.entity'
import { TestRelation } from './test-relation.entity'

export const TEST_ENTITIES: Omit<TestEntity, 'testRelations' | 'manyToOneRelation' | 'manyTestRelations' | 'oneTestRelation'>[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
].map((i) => ({
  id: `test-entity-${i}`,
  boolType: i % 2 === 0,
  dateType: new Date(`2020-02-${String(i).padStart(2, '0')} 12:00`),
  numberType: i,
  stringType: `foo${i}`,
}))

export const TEST_RELATIONS: Omit<TestRelation, 'testEntity' | 'manyTestEntities' | 'oneTestEntity'>[] = TEST_ENTITIES.flatMap((te) => [
  {
    id: `test-relations-${te.id}-1`,
    relationName: `${te.stringType}-test-relation-one`,
  },
  {
    id: `test-relations-${te.id}-2`,
    relationName: `${te.stringType}-test-relation-two`,
  },
  {
    id: `test-relations-${te.id}-3`,
    relationName: `${te.stringType}-test-relation-three`,
  },
])

export async function seed(em: EntityManager): Promise<void> {
  const testEntities = TEST_ENTITIES.map((data) => {
    const entity = new TestEntity()
    Object.assign(entity, data)
    return entity
  })

  for (const entity of testEntities) {
    em.persist(entity)
  }

  const testRelations = TEST_RELATIONS.map((data, index) => {
    const relation = new TestRelation()
    Object.assign(relation, data)
    const entityIndex = Math.floor(index / 3)
    relation.testEntity = em.getReference(TestEntity, testEntities[entityIndex].id)
    return relation
  })

  for (const relation of testRelations) {
    em.persist(relation)
  }

  await em.flush()

  for (let i = 0; i < testEntities.length; i++) {
    const entity = testEntities[i]
    const firstRelation = testRelations[i * 3]

    entity.oneTestRelation = em.getReference(TestRelation, firstRelation.id)

    if (entity.numberType % 2 === 0) {
      const twoRelations = testRelations.filter((tr) => tr.relationName.endsWith('two'))
      for (const rel of twoRelations) {
        entity.manyTestRelations.add(rel)
      }
    }
  }

  await em.flush()
}
