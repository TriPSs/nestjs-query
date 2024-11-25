import { DataSource, In } from 'typeorm';

import { RelationOfTestRelationEntity } from './relation-of-test-relation.entity';
import { TestEntity } from './test.entity';
import { TestRelation } from './test-relation.entity';
import { TestSoftDeleteEntity } from './test-soft-delete.entity';
import { TestSoftDeleteRelation } from './test-soft-delete.relation';
import { getTestConnection } from './connection.fixture';

export const TEST_ENTITIES: TestEntity[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
	const id = `test-entity-${i}`;

	return {
		id,
		boolType: i % 2 === 0,
		dateType: new Date(`2020-02-${i} 12:00`),
		numberType: i,
		stringType: `foo${i}`,
	} as TestEntity;
});

export const TEST_SOFT_DELETE_ENTITIES: TestSoftDeleteEntity[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
	const id = `test-entity-${i}`;
	return {
		id,
		stringType: `foo${i}`,
	};
});

export const TEST_SOFT_DELETE_RELATION_ENTITIES: TestSoftDeleteRelation[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
	const id = `test-deleted-entity-${i}`;
	return {
		id,
		stringType: `foo${i}`,
	};
});

export const TEST_RELATIONS: TestRelation[] = TEST_ENTITIES.reduce(
	(relations, te) => [
		...relations,
		{
			id: `test-relations-${te.id}-1`,
			relationName: `${te.stringType}-test-relation-one`,
			testEntityId: te.id,
			uniDirectionalTestEntityId: te.id,
		},
		{
			id: `test-relations-${te.id}-2`,
			relationName: `${te.stringType}-test-relation-two`,
			testEntityId: te.id,
			uniDirectionalTestEntityId: te.id,
		},
		{
			id: `test-relations-${te.id}-3`,
			relationName: `${te.stringType}-test-relation-three`,
			testEntityId: te.id,
			uniDirectionalTestEntityId: te.id,
		},
	],
	[] as TestRelation[],
);

export const TEST_RELATIONS_OF_RELATION = TEST_RELATIONS.map<Partial<RelationOfTestRelationEntity>>((testRelation) => ({
	relationName: `test-relation-of-${testRelation.relationName}`,
	id: `relation-of-test-relation-${testRelation.relationName}`,
	testRelationId: testRelation.id,
})) as RelationOfTestRelationEntity[];

export const seed = async (connection: DataSource = getTestConnection()): Promise<void> => {
	const testEntityRepo = connection.getRepository(TestEntity);
	const testRelationRepo = connection.getRepository(TestRelation);
	const relationOfTestRelationRepo = connection.getRepository(RelationOfTestRelationEntity);
	const testSoftDeleteRepo = connection.getRepository(TestSoftDeleteEntity);
	const testSoftDeleteRelationRepo = connection.getRepository(TestSoftDeleteRelation);

	const testEntities = await testEntityRepo.save(TEST_ENTITIES.map((e: TestEntity) => ({ ...e })));

	const testRelations = await testRelationRepo.save(TEST_RELATIONS.map((r: TestRelation) => ({ ...r })));
	const testSoftDeleteRelations = await testSoftDeleteRelationRepo.save(
		TEST_SOFT_DELETE_RELATION_ENTITIES.map((r: TestSoftDeleteRelation) => ({ ...r })),
	);

	await relationOfTestRelationRepo.save(TEST_RELATIONS_OF_RELATION.map((r: RelationOfTestRelationEntity) => ({ ...r })));

	await Promise.all(
		testEntities.map((te) => {
			// eslint-disable-next-line no-param-reassign
			te.oneTestRelation = testRelations.find((tr) => tr.id === `test-relations-${te.id}-1`);
			// eslint-disable-next-line no-param-reassign,prefer-destructuring
			te.oneSoftDeleteTestRelation = testSoftDeleteRelations[0];
			if (te.numberType % 2 === 0) {
				// eslint-disable-next-line no-param-reassign
				te.manyTestRelations = testRelations.filter((tr) => tr.relationName.endsWith('two'));
			}
			if (te.numberType % 3 === 0) {
				// eslint-disable-next-line no-param-reassign
				te.manyToManyUniDirectional = testRelations.filter((tr) => tr.relationName.endsWith('three'));
			}

			return testEntityRepo.save(te);
		}),
	);

	await Promise.all(
		testRelations.map(async (te) => {
			const relationOfTestRelationEntity = TEST_RELATIONS_OF_RELATION.find((r) => r.testRelationId === te.id);
			// eslint-disable-next-line no-param-reassign,prefer-destructuring
			te.relationOfTestRelationId = relationOfTestRelationEntity?.id;
			return testRelationRepo.save(te);
		}),
	);

	await testSoftDeleteRepo.save(TEST_SOFT_DELETE_ENTITIES.map((e: TestSoftDeleteEntity) => ({ ...e })));

	await testSoftDeleteRelationRepo.softDelete({
		id: In(TEST_SOFT_DELETE_RELATION_ENTITIES.map(({ id }) => id)),
	});
};
