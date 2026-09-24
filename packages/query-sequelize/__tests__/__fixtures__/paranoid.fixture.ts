import { Sequelize, SequelizeOptions } from 'sequelize-typescript'

import { ParanoidTestEntity } from './paranoid-test.entity'
import { ParanoidTestEntityRelation } from './paranoid-test-entity-relation.entity'
import { ParanoidTestRelation } from './paranoid-test-relation.entity'

export const PARANOID_CONNECTION_OPTIONS: SequelizeOptions = {
  dialect: 'sqlite',
  database: ':memory:',
  logging: false,
  models: [ParanoidTestEntity, ParanoidTestEntityRelation, ParanoidTestRelation]
}

export const PARANOID_TEST_ENTITY_PK = 'paranoid-test-entity-1'
export const DELETED_PARANOID_TEST_ENTITY_PK = 'paranoid-test-entity-2'
export const DELETED_PARANOID_TEST_RELATION_PK = 'paranoid-test-relation-2'
export const RELATION_OF_DELETED_PARANOID_TEST_ENTITY_PK = 'paranoid-test-relation-3'

const PLAIN_PARANOID_TEST_ENTITIES: Pick<ParanoidTestEntity, 'paranoidTestEntityPk' | 'stringType'>[] = [
  { paranoidTestEntityPk: PARANOID_TEST_ENTITY_PK, stringType: 'a' },
  { paranoidTestEntityPk: DELETED_PARANOID_TEST_ENTITY_PK, stringType: 'b' }
]

const PLAIN_PARANOID_TEST_RELATIONS: Pick<
  ParanoidTestRelation,
  'paranoidTestRelationPk' | 'relationName' | 'paranoidTestEntityId'
>[] = [
  {
    paranoidTestRelationPk: 'paranoid-test-relation-1',
    relationName: 'a',
    paranoidTestEntityId: PARANOID_TEST_ENTITY_PK
  },
  {
    paranoidTestRelationPk: DELETED_PARANOID_TEST_RELATION_PK,
    relationName: 'b',
    paranoidTestEntityId: PARANOID_TEST_ENTITY_PK
  },
  {
    paranoidTestRelationPk: RELATION_OF_DELETED_PARANOID_TEST_ENTITY_PK,
    relationName: 'c',
    paranoidTestEntityId: DELETED_PARANOID_TEST_ENTITY_PK
  }
]

/**
 * The join rows give the first entity every relation, so the many to many relation can tell a soft deleted relation
 * (`paranoid-test-relation-2`) apart from a relation whose join row was soft deleted
 * (`paranoid-test-relation-3`).
 */
const PLAIN_PARANOID_TEST_ENTITY_RELATIONS = PLAIN_PARANOID_TEST_RELATIONS.map(({ paranoidTestRelationPk }) => ({
  paranoidTestEntityId: PARANOID_TEST_ENTITY_PK,
  paranoidTestRelationId: paranoidTestRelationPk
}))

export const seedParanoid = async (sequelize: Sequelize): Promise<void> => {
  await sequelize.sync({ force: true })

  await ParanoidTestEntity.bulkCreate(PLAIN_PARANOID_TEST_ENTITIES)
  await ParanoidTestRelation.bulkCreate(PLAIN_PARANOID_TEST_RELATIONS)
  await ParanoidTestEntityRelation.bulkCreate(PLAIN_PARANOID_TEST_ENTITY_RELATIONS)

  await ParanoidTestEntity.destroy({ where: { paranoidTestEntityPk: DELETED_PARANOID_TEST_ENTITY_PK } })
  await ParanoidTestRelation.destroy({ where: { paranoidTestRelationPk: DELETED_PARANOID_TEST_RELATION_PK } })
  await ParanoidTestEntityRelation.destroy({
    where: { paranoidTestRelationId: RELATION_OF_DELETED_PARANOID_TEST_ENTITY_PK }
  })
}
