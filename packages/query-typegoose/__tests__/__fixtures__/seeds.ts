/* eslint-disable no-underscore-dangle,@typescript-eslint/no-unsafe-return */
import { DocumentType, getDiscriminatorModelForClass, getModelForClass, mongoose } from '@typegoose/typegoose'

import { TestEntity } from './test.entity'
import { TestDiscriminatedEntity } from './test-discriminated.entity'
import { TestReference } from './test-reference.entity'

export const TEST_ENTITIES: DocumentType<TestEntity>[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (i) =>
    ({
      boolType: i % 2 === 0,
      dateType: new Date(`2020-02-${i} 12:00`),
      numberType: i,
      stringType: `foo${i}`
    }) as DocumentType<TestEntity>
)

export const TEST_DISCRIMINATED_ENTITIES: DocumentType<TestDiscriminatedEntity>[] = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(
  (i) =>
    ({
      boolType: i % 2 === 0,
      dateType: new Date(`2020-02-${i} 12:00`),
      numberType: i,
      stringType: `foo${i}-descrim`,
      stringType2: `bar${i}-descrim`
    }) as DocumentType<TestDiscriminatedEntity>
)

export const TEST_REFERENCES: DocumentType<TestReference>[] = TEST_ENTITIES.reduce(
  (relations, te) => [
    ...relations,
    {
      referenceName: `${te.stringType}-test-reference-1-one`
    } as DocumentType<TestReference>,
    {
      referenceName: `${te.stringType}-test-reference-2-two`
    } as DocumentType<TestReference>,
    {
      referenceName: `${te.stringType}-test-reference-3-three`
    } as DocumentType<TestReference>
  ],
  [] as DocumentType<TestReference>[]
)

export const TEST_REFERENCES_FOR_DISCRIMINATES: DocumentType<TestReference>[] = TEST_DISCRIMINATED_ENTITIES.reduce(
  (relations, tde) => [
    ...relations,
    {
      referenceName: `${tde.stringType}-test-reference-1-one`
    } as DocumentType<TestReference>,
    {
      referenceName: `${tde.stringType}-test-reference-2-two`
    } as DocumentType<TestReference>,
    {
      referenceName: `${tde.stringType}-test-reference-3-three`
    } as DocumentType<TestReference>
  ],
  [] as DocumentType<TestReference>[]
)

export const seed = async (connection: mongoose.Connection): Promise<void> => {
  const TestEntityModel = getModelForClass(TestEntity, { existingConnection: connection })
  const TestReferencesModel = getModelForClass(TestReference, { existingConnection: connection })
  const TestDiscriminatedModel = getDiscriminatorModelForClass(TestEntityModel, TestDiscriminatedEntity)

  const testEntities = await TestEntityModel.create(TEST_ENTITIES)
  const testDiscriminatedEntities = await TestDiscriminatedModel.create(TEST_DISCRIMINATED_ENTITIES)
  const testReferences = await TestReferencesModel.create(TEST_REFERENCES)
  const testReferencesForDiscriminates = await TestReferencesModel.create(TEST_REFERENCES_FOR_DISCRIMINATES)

  testEntities.forEach((te, index) => Object.assign(TEST_ENTITIES[index], te.toObject({ virtuals: true })))

  testDiscriminatedEntities.forEach((tde, index) =>
    Object.assign(TEST_DISCRIMINATED_ENTITIES[index], tde.toObject({ virtuals: true }))
  )

  testReferences.forEach((tr, index) => Object.assign(TEST_REFERENCES[index], tr.toObject({ virtuals: true })))
  testReferencesForDiscriminates.forEach((trfd, index) =>
    Object.assign(TEST_REFERENCES_FOR_DISCRIMINATES[index], trfd.toObject({ virtuals: true }))
  )

  const entityUpdates = testEntities.map((te, index) => {
    const references = testReferences.filter((tr: TestReference) => tr.referenceName.includes(`${te.stringType}-`))
    TEST_ENTITIES[index].testReference = references[0]._id
    TEST_ENTITIES[index].testReferences = references.map((r) => r._id)
    return {
      updateOne: {
        filter: { _id: te._id },
        update: { $set: { testReferences: references.map((r) => r._id), testReference: references[0]._id } }
      }
    }
  })

  const discriminatedEntityUpdates = testDiscriminatedEntities.map((tde, index) => {
    const references = testReferencesForDiscriminates.filter((trfd: TestReference) =>
      trfd.referenceName.includes(`${tde.stringType}-`)
    )
    TEST_DISCRIMINATED_ENTITIES[index].testReference = references[0]._id
    TEST_DISCRIMINATED_ENTITIES[index].testReferences = references.map((r) => r._id)
    return {
      updateOne: {
        filter: { _id: tde._id },
        update: { $set: { testReferences: references.map((r) => r._id), testReference: references[0]._id } }
      }
    }
  })

  const referenceUpdates = [...testEntities, ...testDiscriminatedEntities].flatMap((entity) => {
    const references = [...testReferences, ...testReferencesForDiscriminates].filter((reference: TestReference) =>
      reference.referenceName.includes(`${entity.stringType}-`)
    )
    return references.map((reference) => {
      const fixtureReferences = reference.referenceName.includes('descrim') ? TEST_REFERENCES_FOR_DISCRIMINATES : TEST_REFERENCES
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fixtureReferences.find((tr) => tr._id.toString() === reference._id.toString()).testEntity = entity._id
      return {
        updateOne: {
          filter: { _id: reference._id },
          update: { $set: { testEntity: entity._id } }
        }
      }
    })
  })

  await Promise.all([
    TestEntityModel.bulkWrite([...entityUpdates, ...discriminatedEntityUpdates]),
    TestReferencesModel.bulkWrite(referenceUpdates)
  ])
}
