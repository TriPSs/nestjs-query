import { MikroORM, EntityManager } from '@mikro-orm/core'

import { TestEntity } from './test.entity'
import { TestRelation } from './test-relation.entity'
import { TestSoftDeleteEntity } from './test-soft-delete.entity'

export const TEST_ENTITIES: TestEntity[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
  const testEntity = new TestEntity()
  testEntity.testEntityPk = `test-entity-${i}`
  testEntity.stringType = `foo${i}`
  testEntity.boolType = i % 2 === 0
  testEntity.numberType = i
  testEntity.dateType = new Date(`2020-02-${i.toString().padStart(2, '0')}`)
  return testEntity
})

export const TEST_RELATIONS: TestRelation[] = TEST_ENTITIES.reduce((relations, te) => {
  return [
    ...relations,
    ...[1, 2, 3].map((i) => {
      const relation = new TestRelation()
      relation.testRelationPk = `test-relations-${te.testEntityPk}-${i}`
      relation.relationName = `${te.stringType}-relation-${i}`
      relation.testEntityId = te.testEntityPk
      return relation
    })
  ]
}, [] as TestRelation[])

export const TEST_SOFT_DELETE_ENTITIES: TestSoftDeleteEntity[] = [1, 2, 3, 4, 5].map((i) => {
  const entity = new TestSoftDeleteEntity()
  entity.testEntityPk = `test-soft-delete-entity-${i}`
  entity.stringType = `foo${i}`
  return entity
})

export async function seed(em: EntityManager): Promise<void> {
  for (const entity of TEST_ENTITIES) {
    const newEntity = em.create(TestEntity, {
      testEntityPk: entity.testEntityPk,
      stringType: entity.stringType,
      boolType: entity.boolType,
      numberType: entity.numberType,
      dateType: entity.dateType
    })
    em.persist(newEntity)
  }

  await em.flush()

  for (const relation of TEST_RELATIONS) {
    const testEntity = await em.findOne(TestEntity, { testEntityPk: relation.testEntityId })
    const newRelation = em.create(TestRelation, {
      testRelationPk: relation.testRelationPk,
      relationName: relation.relationName,
      testEntityId: relation.testEntityId,
      testEntity
    })
    em.persist(newRelation)
  }

  await em.flush()

  for (const entity of TEST_SOFT_DELETE_ENTITIES) {
    const newEntity = em.create(TestSoftDeleteEntity, {
      testEntityPk: entity.testEntityPk,
      stringType: entity.stringType
    })
    em.persist(newEntity)
  }

  await em.flush()
}
