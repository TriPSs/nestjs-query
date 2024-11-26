import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Filter, SortDirection } from '@rezonate/nestjs-query-core';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

import { TypeOrmQueryService } from '../../src';
import { FilterQueryBuilder } from '../../src/query';
import {
	closeTestConnection,
	CONNECTION_OPTIONS,
	getTestConnection,
	refresh,
	truncate,
} from '../__fixtures__/connection.fixture';
import {
	TEST_ENTITIES,
	TEST_RELATIONS,
	TEST_SOFT_DELETE_ENTITIES,
	TEST_SOFT_DELETE_RELATION_ENTITIES,
} from '../__fixtures__/seeds';
import { TestEntity } from '../__fixtures__/test.entity';
import { TestEntityRelationEntity } from '../__fixtures__/test-entity-relation.entity';
import { TestRelation } from '../__fixtures__/test-relation.entity';
import { TestSoftDeleteEntity } from '../__fixtures__/test-soft-delete.entity';
import { TestSoftDeleteRelation } from '../__fixtures__/test-soft-delete.relation';

describe('TypeOrmQueryService', (): void => {
	let moduleRef: TestingModule;

	class TestEntityService extends TypeOrmQueryService<TestEntity> {
		constructor(@InjectRepository(TestEntity) readonly repo: Repository<TestEntity>) {
			super(repo);
		}
	}

	class TestRelationService extends TypeOrmQueryService<TestRelation> {
		constructor(@InjectRepository(TestRelation) readonly repo: Repository<TestRelation>) {
			super(repo);
		}
	}

	class TestSoftDeleteEntityService extends TypeOrmQueryService<TestSoftDeleteEntity> {
		constructor(@InjectRepository(TestSoftDeleteEntity) readonly repo: Repository<TestSoftDeleteEntity>) {
			super(repo, { useSoftDelete: true });
		}
	}

	afterEach(closeTestConnection);

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRootAsync({
					useFactory: () => CONNECTION_OPTIONS,
					dataSourceFactory: async () => getTestConnection(),
				}),
				TypeOrmModule.forFeature([TestEntity, TestRelation, TestEntityRelationEntity, TestSoftDeleteEntity], getTestConnection()),
			],
			providers: [TestEntityService, TestRelationService, TestSoftDeleteEntityService],
		}).compile();

		await refresh();
	});

	it('should create a filterQueryBuilder and assemblerService based on the repo passed in if not provided', () => {
		const queryService = moduleRef.get(TestEntityService);
		expect(queryService.filterQueryBuilder).toBeInstanceOf(FilterQueryBuilder);
		expect(queryService.filterQueryBuilder.repo.target).toBe(TestEntity);
	});

	describe('#query', () => {
		it('call select and return the result', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.query({ filter: { stringType: { eq: 'foo1' } } });
			return expect(queryResult).toEqual([TEST_ENTITIES[0]]);
		});

		describe('filter on relations', () => {
			describe('deeply nested', () => {
				it('oneToOne - oneToMany', async () => {
					const entity = TEST_ENTITIES[0];
					const relationEntity = TEST_RELATIONS.find((r) => r.testEntityId === entity.id);
					expect(relationEntity).toBeDefined();
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							oneTestRelation: {
								relationsOfTestRelation: {
									testRelationId: {
										eq: relationEntity?.id,
									},
								},
							},
						},
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 1, 12, 0, 0, 0)),
							'id': 'test-entity-1',
							'numberType': 1,
							'oneTestRelation': {
								'id': 'test-relations-test-entity-1-1',
								'relationName': 'foo1-test-relation-one',
								'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-one',
								'relationsOfTestRelation': [
									{
										'id': 'relation-of-test-relation-foo1-test-relation-one',
										'relationName': 'test-relation-of-foo1-test-relation-one',
										'testRelationId': 'test-relations-test-entity-1-1',
									},
								],
								'testEntityId': 'test-entity-1',
								'uniDirectionalTestEntityId': 'test-entity-1',
							},
							'stringType': 'foo1',
						},
					]);
				});
				it('oneToOne - manyToOne', async () => {
					const entity = TEST_ENTITIES[0];
					const relationEntity = TEST_RELATIONS.find((r) => r.testEntityId === entity.id);
					expect(relationEntity).toBeDefined();
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							oneTestRelation: {
								relationOfTestRelation: {
									testRelationId: {
										eq: relationEntity?.id,
									},
								},
							},
						},
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 1, 12, 0, 0, 0)),
							'id': 'test-entity-1',
							'numberType': 1,
							'oneTestRelation': {
								'id': 'test-relations-test-entity-1-1',
								'relationName': 'foo1-test-relation-one',
								'relationOfTestRelation': {
									'id': 'relation-of-test-relation-foo1-test-relation-one',
									'relationName': 'test-relation-of-foo1-test-relation-one',
									'testRelationId': 'test-relations-test-entity-1-1',
								},
								'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-one',
								'testEntityId': 'test-entity-1',
								'uniDirectionalTestEntityId': 'test-entity-1',
							},
							'stringType': 'foo1',
						},
					]);
				});
			});

			describe('oneToOne', () => {
				it('should allow filtering on a one to one relation', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							oneTestRelation: {
								id: {
									in: [`test-relations-${entity.id}-1`, `test-relations-${entity.id}-3`],
								},
							},
						},
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 1, 12, 0, 0, 0)),
							'id': 'test-entity-1',
							'numberType': 1,
							'oneTestRelation': {
								'id': 'test-relations-test-entity-1-1',
								'relationName': 'foo1-test-relation-one',
								'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-one',
								'testEntityId': 'test-entity-1',
								'uniDirectionalTestEntityId': 'test-entity-1',
							},
							'stringType': 'foo1',
						},
					]);
				});

				it('should allow filtering on a one to one relation with an OR clause', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							or: [
								{ id: { eq: TEST_ENTITIES[1].id } },
								{
									oneTestRelation: {
										id: {
											in: [`test-relations-${entity.id}-1`, `test-relations-${entity.id}-3`],
										},
									},
								},
							],
						},
						sorting: [{ field: 'id', direction: SortDirection.ASC }],
						paging: { limit: 2 },
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 1, 12, 0, 0, 0)),
							'id': 'test-entity-1',
							'numberType': 1,
							'oneTestRelation': {
								'id': 'test-relations-test-entity-1-1',
								'relationName': 'foo1-test-relation-one',
								'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-one',
								'testEntityId': 'test-entity-1',
								'uniDirectionalTestEntityId': 'test-entity-1',
							},
							'stringType': 'foo1',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 2, 12, 0, 0, 0)),
							'id': 'test-entity-2',
							'numberType': 2,
							'oneTestRelation': {
								'id': 'test-relations-test-entity-2-1',
								'relationName': 'foo2-test-relation-one',
								'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-one',
								'testEntityId': 'test-entity-2',
								'uniDirectionalTestEntityId': 'test-entity-2',
							},
							'stringType': 'foo2',
						},
					]);
				});
			});

			describe('manyToOne', () => {
				it('should allow filtering on a many to one relation', async () => {
					const queryService = moduleRef.get(TestRelationService);
					const queryResults = await queryService.query({
						filter: {
							testEntity: {
								id: {
									in: [TEST_ENTITIES[0].id, TEST_ENTITIES[1].id],
								},
							},
						},
					});
					expect(queryResults).toHaveLength(6);
					queryResults.forEach((e, idx) => {
						expect(e).toMatchObject(TEST_RELATIONS[idx]);
					});
				});

				it('should allow filtering on a uni directional many to one relation', async () => {
					const queryService = moduleRef.get(TestRelationService);
					const queryResults = await queryService.query({
						filter: {
							testEntityUniDirectional: {
								id: {
									in: [TEST_ENTITIES[0].id, TEST_ENTITIES[1].id],
								},
							},
						},
					});
					expect(queryResults).toHaveLength(6);
					queryResults.forEach((e, idx) => {
						expect(e).toMatchObject(TEST_RELATIONS[idx]);
					});
				});

				it('should allow filtering on a many to one relation with paging', async () => {
					const queryService = moduleRef.get(TestRelationService);
					const queryResults = await queryService.query({
						filter: {
							or: [
								{ id: { eq: TEST_RELATIONS[6].id } },
								{
									testEntity: {
										id: {
											in: [TEST_ENTITIES[0].id, TEST_ENTITIES[1].id],
										},
									},
								},
							],
						},
						sorting: [{ field: 'id', direction: SortDirection.ASC }],
						paging: { limit: 3 },
					});
					expect(queryResults).toHaveLength(3);
					queryResults.forEach((e, idx) => {
						expect(e).toMatchObject(TEST_RELATIONS[idx]);
					});
				});
			});

			describe('oneToMany', () => {
				it('should allow filtering on a many to one relation', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							testRelations: {
								relationName: {
									in: [TEST_RELATIONS[0].relationName, TEST_RELATIONS[1].relationName],
								},
							},
						},
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 1, 12, 0, 0, 0)),
							'id': 'test-entity-1',
							'numberType': 1,
							'stringType': 'foo1',
							'testRelations': [
								{
									'id': 'test-relations-test-entity-1-1',
									'relationName': 'foo1-test-relation-one',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-one',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
							],
						},
					]);
				});
				it('should allow filtering on a one to many relation with paging', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							or: [
								{ id: { eq: TEST_ENTITIES[1].id } },
								{
									testRelations: {
										id: {
											in: [`test-relations-${entity.id}-1`, `test-relations-${entity.id}-3`],
										},
									},
								},
							],
						},
						sorting: [{ field: 'id', direction: SortDirection.ASC }],
						paging: { limit: 2 },
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 1, 12, 0, 0, 0)),
							'id': 'test-entity-1',
							'numberType': 1,
							'stringType': 'foo1',
							'testRelations': [
								{
									'id': 'test-relations-test-entity-1-1',
									'relationName': 'foo1-test-relation-one',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-one',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-1-3',
									'relationName': 'foo1-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-three',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
							],
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 2, 12, 0, 0, 0)),
							'id': 'test-entity-2',
							'numberType': 2,
							'stringType': 'foo2',
							'testRelations': [
								{
									'id': 'test-relations-test-entity-2-1',
									'relationName': 'foo2-test-relation-one',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-one',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
								{
									'id': 'test-relations-test-entity-2-3',
									'relationName': 'foo2-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-three',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
						},
					]);
				});
			});

			describe('manyToMany', () => {
				it('should allow filtering on a many to many relation', async () => {
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							manyTestRelations: {
								relationName: {
									in: [TEST_RELATIONS[1].relationName, TEST_RELATIONS[4].relationName],
								},
							},
						},
					});
					expect(queryResult).toEqual([
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 2, 12, 0, 0, 0)),
							'id': 'test-entity-2',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 2,
							'stringType': 'foo2',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 4, 12, 0, 0, 0)),
							'id': 'test-entity-4',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 4,
							'stringType': 'foo4',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 6, 12, 0, 0, 0)),
							'id': 'test-entity-6',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 6,
							'stringType': 'foo6',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 8, 12, 0, 0, 0)),
							'id': 'test-entity-8',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 8,
							'stringType': 'foo8',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 10, 12, 0, 0, 0)),
							'id': 'test-entity-10',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 10,
							'stringType': 'foo10',
						},
					]);
				});

				it('should allow filtering on a many to many uni-directional relation', async () => {
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							manyToManyUniDirectional: {
								relationName: {
									in: [TEST_RELATIONS[2].relationName, TEST_RELATIONS[5].relationName],
								},
							},
						},
					});
					expect(queryResult).toEqual([
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 3, 12, 0, 0, 0)),
							'id': 'test-entity-3',
							'manyToManyUniDirectional': [
								{
									'id': 'test-relations-test-entity-1-3',
									'relationName': 'foo1-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-three',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-3',
									'relationName': 'foo2-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-three',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 3,
							'stringType': 'foo3',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 6, 12, 0, 0, 0)),
							'id': 'test-entity-6',
							'manyToManyUniDirectional': [
								{
									'id': 'test-relations-test-entity-1-3',
									'relationName': 'foo1-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-three',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-3',
									'relationName': 'foo2-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-three',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 6,
							'stringType': 'foo6',
						},
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 9, 12, 0, 0, 0)),
							'id': 'test-entity-9',
							'manyToManyUniDirectional': [
								{
									'id': 'test-relations-test-entity-1-3',
									'relationName': 'foo1-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-three',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-3',
									'relationName': 'foo2-test-relation-three',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-three',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 9,
							'stringType': 'foo9',
						},
					]);
				});

				it('should allow filtering on a many to many relation with paging', async () => {
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.query({
						filter: {
							or: [
								{ id: { eq: TEST_ENTITIES[2].id } },
								{
									manyTestRelations: {
										relationName: {
											in: [TEST_RELATIONS[1].relationName, TEST_RELATIONS[4].relationName],
										},
									},
								},
							],
						},
						sorting: [{ field: 'numberType', direction: SortDirection.ASC }],
						paging: { limit: 6 },
					});
					expect(queryResult).toEqual([
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 2, 12, 0, 0, 0)),
							'id': 'test-entity-2',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 2,
							'stringType': 'foo2',
						},
						{
							'boolType': false,
							'dateType': new Date(Date.UTC(2020, 2, 3, 12, 0, 0, 0)),
							'id': 'test-entity-3',
							'manyTestRelations': [],
							'numberType': 3,
							'stringType': 'foo3',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 4, 12, 0, 0, 0)),
							'id': 'test-entity-4',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 4,
							'stringType': 'foo4',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 6, 12, 0, 0, 0)),
							'id': 'test-entity-6',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 6,
							'stringType': 'foo6',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 8, 12, 0, 0, 0)),
							'id': 'test-entity-8',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 8,
							'stringType': 'foo8',
						},
						{
							'boolType': true,
							'dateType': new Date(Date.UTC(2020, 2, 10, 12, 0, 0, 0)),
							'id': 'test-entity-10',
							'manyTestRelations': [
								{
									'id': 'test-relations-test-entity-1-2',
									'relationName': 'foo1-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo1-test-relation-two',
									'testEntityId': 'test-entity-1',
									'uniDirectionalTestEntityId': 'test-entity-1',
								},
								{
									'id': 'test-relations-test-entity-2-2',
									'relationName': 'foo2-test-relation-two',
									'relationOfTestRelationId': 'relation-of-test-relation-foo2-test-relation-two',
									'testEntityId': 'test-entity-2',
									'uniDirectionalTestEntityId': 'test-entity-2',
								},
							],
							'numberType': 10,
							'stringType': 'foo10',
						},
					]);
				});
			});
		});
	});

	describe('#aggregate', () => {
		it('call select with the aggregate columns and return the result', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.aggregate(
				{},
				{
					count: ['id'],
					avg: ['numberType'],
					sum: ['numberType'],
					max: ['id', 'dateType', 'numberType', 'stringType'],
					min: ['id', 'dateType', 'numberType', 'stringType'],
				},
			);
			return expect(queryResult).toEqual([
				{
					avg: {
						numberType: 5.5,
					},
					count: {
						id: 10,
					},
					max: {
						dateType: expect.stringMatching('2020-03-10'),
						numberType: 10,
						stringType: 'foo9',
						id: 'test-entity-9',
					},
					min: {
						dateType: expect.stringMatching('2020-03-01'),
						numberType: 1,
						stringType: 'foo1',
						id: 'test-entity-1',
					},
					sum: {
						numberType: 55,
					},
				},
			]);
		});

		it('call aggregate with a group by', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.aggregate(
				{},
				{
					groupBy: ['boolType'],
					count: ['id'],
					avg: ['numberType'],
					sum: ['numberType'],
					max: ['id', 'dateType', 'numberType', 'stringType'],
					min: ['id', 'dateType', 'numberType', 'stringType'],
				},
			);
			return expect(queryResult).toEqual([
				{
					groupBy: {
						boolType: 0,
					},
					avg: {
						numberType: 5,
					},
					count: {
						id: 5,
					},
					max: {
						dateType: expect.stringMatching('2020-03-09'),
						numberType: 9,
						stringType: 'foo9',
						id: 'test-entity-9',
					},
					min: {
						dateType: expect.stringMatching('2020-03-01'),
						numberType: 1,
						stringType: 'foo1',
						id: 'test-entity-1',
					},
					sum: {
						numberType: 25,
					},
				},
				{
					groupBy: {
						boolType: 1,
					},
					avg: {
						numberType: 6,
					},
					count: {
						id: 5,
					},
					max: {
						dateType: expect.stringMatching('2020-03-10'),
						numberType: 10,
						stringType: 'foo8',
						id: 'test-entity-8',
					},
					min: {
						dateType: expect.stringMatching('2020-03-02'),
						numberType: 2,
						stringType: 'foo10',
						id: 'test-entity-10',
					},
					sum: {
						numberType: 30,
					},
				},
			]);
		});

		it('call select with the aggregate columns and return the result with a filter', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.aggregate(
				{ stringType: { in: ['foo1', 'foo2', 'foo3'] } },
				{
					count: ['id'],
					avg: ['numberType'],
					sum: ['numberType'],
					max: ['id', 'dateType', 'numberType', 'stringType'],
					min: ['id', 'dateType', 'numberType', 'stringType'],
				},
			);
			return expect(queryResult).toEqual([
				{
					avg: {
						numberType: 2,
					},
					count: {
						id: 3,
					},
					max: {
						dateType: expect.stringMatching('2020-03-03'),
						numberType: 3,
						stringType: 'foo3',
						id: 'test-entity-3',
					},
					min: {
						dateType: expect.stringMatching('2020-03-01'),
						numberType: 1,
						stringType: 'foo1',
						id: 'test-entity-1',
					},
					sum: {
						numberType: 6,
					},
				},
			]);
		});

		it('call aggregate with a group and filter', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.aggregate(
				{ stringType: { in: ['foo1', 'foo2', 'foo3'] } },
				{
					groupBy: ['boolType'],
					count: ['id'],
					avg: ['numberType'],
					sum: ['numberType'],
					max: ['id', 'dateType', 'numberType', 'stringType'],
					min: ['id', 'dateType', 'numberType', 'stringType'],
				},
			);
			return expect(queryResult).toEqual([
				{
					groupBy: {
						boolType: 0,
					},
					avg: {
						numberType: 2,
					},
					count: {
						id: 2,
					},
					max: {
						dateType: expect.stringMatching('2020-03-03'),
						numberType: 3,
						stringType: 'foo3',
						id: 'test-entity-3',
					},
					min: {
						dateType: expect.stringMatching('2020-03-01'),
						numberType: 1,
						stringType: 'foo1',
						id: 'test-entity-1',
					},
					sum: {
						numberType: 4,
					},
				},
				{
					groupBy: {
						boolType: 1,
					},
					avg: {
						numberType: 2,
					},
					count: {
						id: 1,
					},
					max: {
						dateType: expect.stringMatching('2020-03-02'),
						numberType: 2,
						stringType: 'foo2',
						id: 'test-entity-2',
					},
					min: {
						dateType: expect.stringMatching('2020-03-02'),
						numberType: 2,
						stringType: 'foo2',
						id: 'test-entity-2',
					},
					sum: {
						numberType: 2,
					},
				},
			]);
		});
	});

	describe('#count', () => {
		it('call select and return the result', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.count({ stringType: { like: 'foo%' } });
			return expect(queryResult).toBe(10);
		});

		describe('with relations', () => {
			describe('oneToOne', () => {
				it('should properly count the number pf records with the associated relations', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const count = await queryService.count({
						oneTestRelation: {
							id: {
								in: [`test-relations-${entity.id}-1`, `test-relations-${entity.id}-3`],
							},
						},
					});
					expect(count).toBe(1);
				});
			});

			describe('manyToOne', () => {
				it('set the relation to null', async () => {
					const queryService = moduleRef.get(TestRelationService);
					const count = await queryService.count({
						testEntity: {
							id: {
								in: [TEST_ENTITIES[0].id, TEST_ENTITIES[2].id],
							},
						},
					});
					expect(count).toBe(6);
				});
			});

			describe('oneToMany', () => {
				it('set the relation to null', async () => {
					const relation = TEST_RELATIONS[0];
					const queryService = moduleRef.get(TestEntityService);
					const count = await queryService.count({
						testRelations: {
							testEntityId: {
								in: [relation.testEntityId],
							},
						},
					});
					expect(count).toBe(1);
				});
			});
		});
	});

	describe('#queryRelations', () => {
		describe('with one entity', () => {
			it('call select and return the result', async () => {
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', TEST_ENTITIES[0], {});
				return expect(queryResult.map((r) => r.testEntityId)).toEqual([
					TEST_ENTITIES[0].id,
					TEST_ENTITIES[0].id,
					TEST_ENTITIES[0].id,
				]);
			});

			// it('call select and return the result for many to many', async () => {
			//   const queryService = moduleRef.get(TestEntityService);
			//   const queryResult = await queryService.queryRelations(TestEntity, 'manyTestRelations', TEST_ENTITIES[0], {});
			//   expect(queryResult.map((r) => r.manyTestRelations)).toEqual([]);
			//
			//   const queryResult2 = await queryService.queryRelations(TestEntity, 'manyTestRelations', TEST_ENTITIES[1], {});
			//   expect(queryResult2.map((r) => r.manyTestRelations)).toEqual([
			//     TEST_RELATIONS[0],
			//     TEST_RELATIONS[1],
			//     TEST_RELATIONS[2]
			//   ]);
			// });

			it('should apply a filter', async () => {
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', TEST_ENTITIES[0], {
					filter: { id: { notLike: '%-1' } },
				});
				return expect(queryResult.map((r) => r.id)).toEqual([TEST_RELATIONS[1].id, TEST_RELATIONS[2].id]);
			});

			it('should apply a paging', async () => {
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', TEST_ENTITIES[0], {
					paging: { limit: 2, offset: 1 },
				});
				return expect(queryResult.map((r) => r.id)).toEqual([TEST_RELATIONS[1].id, TEST_RELATIONS[2].id]);
			});

			describe('manyToMany', () => {
				it('call select and return the with a uni-directional relation', async () => {
					const entity = TEST_ENTITIES[2];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = (await queryService.queryRelations(TestRelation, 'manyToManyUniDirectional', entity, {})).map(
						(r) => {
							// eslint-disable-next-line no-param-reassign
							delete r.relationOfTestRelationId;
							return r;
						},
					);

					TEST_RELATIONS.filter((tr) => tr.relationName.endsWith('three')).forEach((tr) => {
						expect(queryResult).toContainEqual(tr);
					});
				});
			});
		});

		describe('with multiple entities', () => {
			it('call select and return the result', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', entities, {});

				expect(queryResult.size).toBe(3);
				entities.forEach((e) => expect(queryResult.get(e)).toHaveLength(3));
			});

			it('should apply a filter', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', entities, {
					filter: { id: { notLike: '%-1' } },
				});

				expect(queryResult.size).toBe(3);
				entities.forEach((e) => expect(queryResult.get(e)).toHaveLength(2));
			});

			it('should apply paging', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', entities, {
					paging: { limit: 2, offset: 1 },
				});

				expect(queryResult.size).toBe(3);
				expect(queryResult.get(entities[0])).toHaveLength(2);
				expect(queryResult.get(entities[1])).toHaveLength(2);
				expect(queryResult.get(entities[2])).toHaveLength(2);
			});

			it('should return an empty array if no results are found.', async () => {
				const entities: TestEntity[] = [TEST_ENTITIES[0], { id: 'does-not-exist' } as TestEntity];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.queryRelations(TestRelation, 'testRelations', entities, {
					filter: { relationName: { isNot: null } },
				});

				expect(queryResult.size).toBe(1);
				expect(queryResult.get(entities[0])).toHaveLength(3);
				expect(queryResult.get(entities[1])).toBeUndefined();
			});

			describe('manyToMany', () => {
				it('call select and return the with owning side of the relations', async () => {
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.queryRelations(TestEntity, 'manyTestRelations', [TEST_ENTITIES[1]], {});

					const adaptedQueryResult = new Map();
					queryResult.forEach((relations, key) => {
						adaptedQueryResult.set(
							key,
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							relations.map(({ relationOfTestRelationId, ...relation }) => ({
								...relation,
							})),
						);
					});

					const expectRelations = TEST_RELATIONS.filter((tr) => tr.relationName.endsWith('two'));
					expect(adaptedQueryResult.get(TEST_ENTITIES[1])).toHaveLength(expectRelations.length);
					expect(adaptedQueryResult.get(TEST_ENTITIES[1])).toEqual(expect.arrayContaining(expectRelations));
				});

				it('call select and return the with non owning side of the relations', async () => {
					const entities = TEST_RELATIONS.slice(0, 2);

					const queryService = moduleRef.get(TestRelationService);
					const queryResult = await queryService.queryRelations(TestRelation, 'manyTestEntities', entities, {});

					const expectRelations = TEST_ENTITIES.filter((te) => te.numberType % 2 === 0);

					expect(queryResult.get(entities[0])).toBeUndefined();
					expect(queryResult.get(entities[0])).toBeUndefined();
					expect(queryResult.get(entities[1])).toHaveLength(expectRelations.length);
					expect(queryResult.get(entities[1])).toEqual(expect.arrayContaining(expectRelations));
				});
			});
		});
	});

	describe('#aggregateRelations', () => {
		describe('with one entity', () => {
			it('call select and return the result', async () => {
				const queryService = moduleRef.get(TestEntityService);
				const aggResult = await queryService.aggregateRelations(
					TestRelation,
					'testRelations',
					TEST_ENTITIES[0],
					{},
					{ count: ['id'] },
				);
				return expect(aggResult).toEqual([
					{
						count: {
							id: 3,
						},
					},
				]);
			});

			it('should apply a filter', async () => {
				const queryService = moduleRef.get(TestEntityService);
				const aggResult = await queryService.aggregateRelations(
					TestRelation,
					'testRelations',
					TEST_ENTITIES[0],
					{ id: { notLike: '%-1' } },
					{ count: ['id'] },
				);
				return expect(aggResult).toEqual([
					{
						count: {
							id: 2,
						},
					},
				]);
			});
		});

		describe('with multiple entities', () => {
			it('aggregate for each entities relation', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.aggregateRelations(
					TestRelation,
					'testRelations',
					entities,
					{},
					{
						count: ['id', 'relationName', 'testEntityId'],
						min: ['id', 'relationName', 'testEntityId'],
						max: ['id', 'relationName', 'testEntityId'],
					},
				);

				expect(queryResult.size).toBe(3);
				expect(queryResult).toEqual(
					new Map([
						[
							entities[0],
							[
								{
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo1-test-relation-two',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-3',
									},
									min: {
										relationName: 'foo1-test-relation-one',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-1',
									},
								},
							],
						],
						[
							entities[1],
							[
								{
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo2-test-relation-two',
										testEntityId: 'test-entity-2',
										id: 'test-relations-test-entity-2-3',
									},
									min: {
										relationName: 'foo2-test-relation-one',
										testEntityId: 'test-entity-2',
										id: 'test-relations-test-entity-2-1',
									},
								},
							],
						],
						[
							entities[2],
							[
								{
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo3-test-relation-two',
										testEntityId: 'test-entity-3',
										id: 'test-relations-test-entity-3-3',
									},
									min: {
										relationName: 'foo3-test-relation-one',
										testEntityId: 'test-entity-3',
										id: 'test-relations-test-entity-3-1',
									},
								},
							],
						],
					]),
				);
			});

			it('aggregate and group for each entities relation', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.aggregateRelations(
					TestRelation,
					'testRelations',
					entities,
					{},
					{
						groupBy: ['testEntityId'],
						count: ['id', 'relationName', 'testEntityId'],
						min: ['id', 'relationName', 'testEntityId'],
						max: ['id', 'relationName', 'testEntityId'],
					},
				);

				expect(queryResult.size).toBe(3);
				expect(queryResult).toEqual(
					new Map([
						[
							entities[0],
							[
								{
									groupBy: {
										testEntityId: 'test-entity-1',
									},
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo1-test-relation-two',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-3',
									},
									min: {
										relationName: 'foo1-test-relation-one',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-1',
									},
								},
							],
						],
						[
							entities[1],
							[
								{
									groupBy: {
										testEntityId: 'test-entity-2',
									},
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo2-test-relation-two',
										testEntityId: 'test-entity-2',
										id: 'test-relations-test-entity-2-3',
									},
									min: {
										relationName: 'foo2-test-relation-one',
										testEntityId: 'test-entity-2',
										id: 'test-relations-test-entity-2-1',
									},
								},
							],
						],
						[
							entities[2],
							[
								{
									groupBy: {
										testEntityId: 'test-entity-3',
									},
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo3-test-relation-two',
										testEntityId: 'test-entity-3',
										id: 'test-relations-test-entity-3-3',
									},
									min: {
										relationName: 'foo3-test-relation-one',
										testEntityId: 'test-entity-3',
										id: 'test-relations-test-entity-3-1',
									},
								},
							],
						],
					]),
				);
			});

			it('should apply a filter', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.aggregateRelations(
					TestRelation,
					'testRelations',
					entities,
					{ id: { notLike: '%-1' } },
					{
						count: ['id', 'relationName', 'testEntityId'],
						min: ['id', 'relationName', 'testEntityId'],
						max: ['id', 'relationName', 'testEntityId'],
					},
				);

				expect(queryResult.size).toBe(3);
				expect(queryResult).toEqual(
					new Map([
						[
							entities[0],
							[
								{
									count: {
										relationName: 2,
										testEntityId: 2,
										id: 2,
									},
									max: {
										relationName: 'foo1-test-relation-two',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-3',
									},
									min: {
										relationName: 'foo1-test-relation-three',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-2',
									},
								},
							],
						],
						[
							entities[1],
							[
								{
									count: {
										relationName: 2,
										testEntityId: 2,
										id: 2,
									},
									max: {
										relationName: 'foo2-test-relation-two',
										testEntityId: 'test-entity-2',
										id: 'test-relations-test-entity-2-3',
									},
									min: {
										relationName: 'foo2-test-relation-three',
										testEntityId: 'test-entity-2',
										id: 'test-relations-test-entity-2-2',
									},
								},
							],
						],
						[
							entities[2],
							[
								{
									count: {
										relationName: 2,
										testEntityId: 2,
										id: 2,
									},
									max: {
										relationName: 'foo3-test-relation-two',
										testEntityId: 'test-entity-3',
										id: 'test-relations-test-entity-3-3',
									},
									min: {
										relationName: 'foo3-test-relation-three',
										testEntityId: 'test-entity-3',
										id: 'test-relations-test-entity-3-2',
									},
								},
							],
						],
					]),
				);
			});

			it('should return an empty array if no results are found.', async () => {
				const entities: TestEntity[] = [TEST_ENTITIES[0], { id: 'does-not-exist' } as TestEntity];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.aggregateRelations(
					TestRelation,
					'testRelations',
					entities,
					{ relationName: { isNot: null } },
					{
						count: ['id', 'relationName', 'testEntityId'],
						min: ['id', 'relationName', 'testEntityId'],
						max: ['id', 'relationName', 'testEntityId'],
					},
				);

				expect(queryResult).toEqual(
					new Map([
						[
							entities[0],
							[
								{
									count: {
										relationName: 3,
										testEntityId: 3,
										id: 3,
									},
									max: {
										relationName: 'foo1-test-relation-two',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-3',
									},
									min: {
										relationName: 'foo1-test-relation-one',
										testEntityId: 'test-entity-1',
										id: 'test-relations-test-entity-1-1',
									},
								},
							],
						],
						[
							{ id: 'does-not-exist' } as TestEntity,
							[
								{
									count: {
										relationName: 0,
										testEntityId: 0,
										id: 0,
									},
									max: {
										relationName: null,
										testEntityId: null,
										id: null,
									},
									min: {
										relationName: null,
										testEntityId: null,
										id: null,
									},
								},
							],
						],
					]),
				);
			});
		});
	});

	describe('#countRelations', () => {
		describe('with one entity', () => {
			it('call count and return the result', async () => {
				const queryService = moduleRef.get(TestEntityService);
				const countResult = await queryService.countRelations(TestRelation, 'testRelations', TEST_ENTITIES[0], {
					relationName: { isNot: null },
				});
				return expect(countResult).toBe(3);
			});
		});

		describe('with multiple entities', () => {
			it('call count and return the result', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.countRelations(TestRelation, 'testRelations', entities, {
					relationName: { isNot: null },
				});

				expect(queryResult).toEqual(
					new Map([
						[entities[0], 3],
						[entities[1], 3],
						[entities[2], 3],
					]),
				);
			});
		});
	});

	describe('#findRelation', () => {
		describe('with one entity', () => {
			it('call select and return the result', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.findRelation(TestRelation, 'oneTestRelation', entity);

				expect(queryResult).toMatchObject(TEST_RELATIONS[0]);
			});

			it('apply the filter option', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult1 = await queryService.findRelation(TestRelation, 'oneTestRelation', entity, {
					filter: { relationName: { eq: TEST_RELATIONS[0].relationName } },
				});
				expect(queryResult1).toMatchObject(TEST_RELATIONS[0]);

				const queryResult2 = await queryService.findRelation(TestRelation, 'oneTestRelation', entity, {
					filter: { relationName: { eq: TEST_RELATIONS[1].relationName } },
				});
				expect(queryResult2).toBeNull();
			});

			it('should return undefined select if no results are found.', async () => {
				const entity = { ...TEST_ENTITIES[0], id: 'not-real' };
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.findRelation(TestRelation, 'oneTestRelation', entity);

				expect(queryResult).toBeNull();
			});

			it('throw an error if a relation with that name is not found.', async () => {
				const queryService = moduleRef.get(TestEntityService);
				return expect(queryService.findRelation(TestRelation, 'badRelation', TEST_ENTITIES[0])).rejects.toThrow(
					'Unable to find entity for relation \'badRelation\'',
				);
			});

			describe('manyToOne', () => {
				it('call select and return the with a uni-directional relation', async () => {
					const entity = TEST_RELATIONS[0];
					const queryService = moduleRef.get(TestRelationService);
					const queryResult = await queryService.findRelation(TestEntity, 'testEntityUniDirectional', entity);

					expect(queryResult).toEqual(TEST_ENTITIES[0]);
				});
			});

			describe('soft deleted relation', () => {
				it('call select and return undefined', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.findRelation(TestSoftDeleteRelation, 'oneSoftDeleteTestRelation', entity, {
						withDeleted: false,
					});

					expect(queryResult).toBeNull();
				});

				it('call select and return the deleted relation', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.findRelation(TestSoftDeleteRelation, 'oneSoftDeleteTestRelation', entity, {
						withDeleted: true,
					});

					expect(queryResult).toEqual({
						...TEST_SOFT_DELETE_RELATION_ENTITIES[0],
						deletedAt: expect.any(Date),
					});
				});
			});
		});

		describe('with multiple entities', () => {
			it('call select and return the result', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.findRelation(TestRelation, 'oneTestRelation', entities);

				const adaptedQueryResult = new Map();
				queryResult.forEach((entry, key) => {
					// eslint-disable-next-line no-param-reassign
					delete entry?.relationOfTestRelationId;
					adaptedQueryResult.set(key, entry);
				});

				expect(adaptedQueryResult).toEqual(
					new Map([
						[entities[0], TEST_RELATIONS[0]],
						[entities[1], TEST_RELATIONS[3]],
						[entities[2], TEST_RELATIONS[6]],
					]),
				);
			});

			it('should apply the filter option', async () => {
				const entities = TEST_ENTITIES.slice(0, 3);
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.findRelation(TestRelation, 'oneTestRelation', entities, {
					filter: { id: { in: [TEST_RELATIONS[0].id, TEST_RELATIONS[6].id] } },
				});
				const adaptedQueryResult = new Map();
				queryResult.forEach((entry, key) => {
					// eslint-disable-next-line no-param-reassign
					delete entry?.relationOfTestRelationId;
					adaptedQueryResult.set(key, entry);
				});
				expect(adaptedQueryResult).toEqual(
					new Map([
						[entities[0], TEST_RELATIONS[0]],
						[entities[2], TEST_RELATIONS[6]],
					]),
				);
			});

			it('should return undefined select if no results are found.', async () => {
				const entities: TestEntity[] = [TEST_ENTITIES[0], { id: 'does-not-exist' } as TestEntity];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.findRelation(TestRelation, 'oneTestRelation', entities);
				const adaptedQueryResult = new Map();

				queryResult.forEach((entry, key) => {
					// eslint-disable-next-line no-param-reassign
					delete entry?.relationOfTestRelationId;
					adaptedQueryResult.set(key, entry);
				});

				expect(adaptedQueryResult).toEqual(
					new Map([
						[entities[0], TEST_RELATIONS[0]],
					]),
				);
			});

			describe('soft deleted relation', () => {
				it('call select and return undefined', async () => {
					const entities = [TEST_ENTITIES[0]];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.findRelation(TestSoftDeleteRelation, 'oneSoftDeleteTestRelation', entities, {
						withDeleted: false,
					});

					expect(queryResult).toEqual(new Map([]));
				});

				it('call select and return the deleted relation', async () => {
					const entities = [TEST_ENTITIES[0]];
					const queryService = moduleRef.get(TestEntityService);
					const queryResult = await queryService.findRelation(TestSoftDeleteRelation, 'oneSoftDeleteTestRelation', entities, {
						withDeleted: true,
					});

					expect(queryResult).toEqual(
						new Map([
							[
								entities[0],
								{
									...TEST_SOFT_DELETE_RELATION_ENTITIES[0],
									deletedAt: expect.any(Date),
								},
							],
						]),
					);
				});
			});
		});
	});

	describe('#addRelations', () => {
		it('call select and return the result', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.addRelations(
				'testRelations',
				entity.id,
				TEST_RELATIONS.slice(3, 6).map((r) => r.id),
			);
			expect(queryResult).toEqual(entity);

			const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
			expect(relations).toHaveLength(6);
		});

		it('should not modify if the relationIds is empty', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.addRelations('testRelations', entity.id, []);
			expect(queryResult).toEqual(entity);

			const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
			expect(relations).toHaveLength(3);
		});

		describe('with modify options', () => {
			it('should throw an error if the entity is not found with the id and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.addRelations(
						'testRelations',
						entity.id,
						TEST_RELATIONS.slice(3, 6).map((r) => r.id),
						{
							filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
						},
					),
				).rejects.toThrow('Unable to find TestEntity with id: test-entity-1');
			});

			it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.addRelations<TestRelation>(
						'testRelations',
						entity.id,
						TEST_RELATIONS.slice(3, 6).map((r) => r.id),
						{
							relationFilter: { relationName: { like: '%-one' } },
						},
					),
				).rejects.toThrow('Unable to find all testRelations to add to TestEntity');
			});
		});
	});

	describe('#setRelations', () => {
		it('set all relations on the entity', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const relationIds = TEST_RELATIONS.slice(3, 6).map((r) => r.id);
			const queryResult = await queryService.setRelations('testRelations', entity.id, relationIds);
			expect(queryResult).toEqual(entity);

			const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
			expect(relations.map((r) => r.id)).toEqual(relationIds);
		});

		it('should remove all relations if the relationIds is empty', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.setRelations('testRelations', entity.id, []);
			expect(queryResult).toEqual(entity);

			const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
			expect(relations.map((r) => r.id)).toEqual([]);
		});

		describe('with modify options', () => {
			it('should throw an error if the entity is not found with the id and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.setRelations(
						'testRelations',
						entity.id,
						TEST_RELATIONS.slice(3, 6).map((r) => r.id),
						{
							filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
						},
					),
				).rejects.toThrow('Unable to find TestEntity with id: test-entity-1');
			});

			it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.setRelations<TestRelation>(
						'testRelations',
						entity.id,
						TEST_RELATIONS.slice(3, 6).map((r) => r.id),
						{
							relationFilter: { relationName: { like: '%-one' } },
						},
					),
				).rejects.toThrow('Unable to find all testRelations to set on TestEntity');
			});
		});
	});

	describe('#setRelation', () => {
		it('call select and return the result', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.setRelation('oneTestRelation', entity.id, TEST_RELATIONS[1].id);
			expect(queryResult).toEqual(entity);

			const relation = await queryService.findRelation(TestRelation, 'oneTestRelation', entity);
			expect(relation?.id).toBe(TEST_RELATIONS[1].id);
		});

		describe('with modify options', () => {
			it('should throw an error if the entity is not found with the id and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.setRelation('oneTestRelation', entity.id, TEST_RELATIONS[1].id, {
						filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
					}),
				).rejects.toThrow('Unable to find TestEntity with id: test-entity-1');
			});

			it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.setRelation<TestRelation>('oneTestRelation', entity.id, TEST_RELATIONS[1].id, {
						relationFilter: { relationName: { like: '%-one' } },
					}),
				).rejects.toThrow('Unable to find oneTestRelation to set on TestEntity');
			});
		});
	});

	describe('#removeRelations', () => {
		it('call select and return the result', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.removeRelations(
				'testRelations',
				entity.id,
				TEST_RELATIONS.slice(0, 3).map((r) => r.id),
			);
			expect(queryResult).toEqual(entity);

			const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
			expect(relations).toHaveLength(0);
		});

		it('should not remove any relations if relationIds is empty', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const queryResult = await queryService.removeRelations('testRelations', entity.id, []);
			expect(queryResult).toEqual(entity);

			const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
			expect(relations).toHaveLength(3);
		});

		describe('with modify options', () => {
			it('should throw an error if the entity is not found with the id and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.removeRelations(
						'testRelations',
						entity.id,
						TEST_RELATIONS.slice(3, 6).map((r) => r.id),
						{
							filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
						},
					),
				).rejects.toThrow('Unable to find TestEntity with id: test-entity-1');
			});

			it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.removeRelations<TestRelation>(
						'testRelations',
						entity.id,
						TEST_RELATIONS.slice(3, 6).map((r) => r.id),
						{
							relationFilter: { relationName: { like: '%-one' } },
						},
					),
				).rejects.toThrow('Unable to find all testRelations to remove from TestEntity');
			});
		});
	});

	describe('#removeRelation', () => {
		describe('oneToOne', () => {
			it('set the relation to null', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.removeRelation('oneTestRelation', entity.id, TEST_RELATIONS[0].id);
				expect(queryResult).toEqual(entity);

				const relation = await queryService.findRelation(TestRelation, 'oneTestRelation', entity);
				expect(relation).toBeNull();
			});

			describe('with modify options', () => {
				it('should throw an error if the entity is not found with the id and provided filter', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					return expect(
						queryService.removeRelation('oneTestRelation', entity.id, TEST_RELATIONS[1].id, {
							filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
						}),
					).rejects.toThrow('Unable to find TestEntity with id: test-entity-1');
				});

				it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					return expect(
						queryService.removeRelation<TestRelation>('oneTestRelation', entity.id, TEST_RELATIONS[1].id, {
							relationFilter: { relationName: { like: '%-one' } },
						}),
					).rejects.toThrow('Unable to find oneTestRelation to remove from TestEntity');
				});
			});
		});

		describe('manyToOne', () => {
			it('set the relation to null', async () => {
				const relation = TEST_RELATIONS[0];
				const queryService = moduleRef.get(TestRelationService);
				const queryResult = await queryService.removeRelation('testEntity', relation.id, TEST_ENTITIES[0].id);
				expect(queryResult).toMatchObject(relation);

				const entity = await queryService.findRelation(TestEntity, 'testEntity', relation);
				expect(entity).toBeNull();
			});

			describe('with modify options', () => {
				it('should throw an error if the entity is not found with the id and provided filter', async () => {
					const relation = TEST_RELATIONS[0];
					const queryService = moduleRef.get(TestRelationService);
					return expect(
						queryService.removeRelation('testEntity', relation.id, TEST_ENTITIES[1].id, {
							filter: { relationName: { eq: TEST_RELATIONS[1].relationName } },
						}),
					).rejects.toThrow('Unable to find TestRelation with id: test-relations-test-entity-1-1');
				});

				it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
					const relation = TEST_RELATIONS[0];
					const queryService = moduleRef.get(TestRelationService);
					return expect(
						queryService.removeRelation('testEntity', relation.id, TEST_ENTITIES[0].id, {
							relationFilter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
						}),
					).rejects.toThrow('Unable to find testEntity to remove from TestRelation');
				});
			});
		});

		describe('oneToMany', () => {
			it('set the relation to null', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const queryResult = await queryService.removeRelation('testRelations', entity.id, TEST_RELATIONS[0].id);
				expect(queryResult).toEqual(entity);

				const relations = await queryService.queryRelations(TestRelation, 'testRelations', entity, {});
				expect(relations).toHaveLength(2);
			});

			describe('with modify options', () => {
				it('should throw an error if the entity is not found with the id and provided filter', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					return expect(
						queryService.removeRelation('testRelations', entity.id, TEST_RELATIONS[4].id, {
							filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
						}),
					).rejects.toThrow('Unable to find TestEntity with id: test-entity-1');
				});

				it('should throw an error if the relations are not found with the relationIds and provided filter', async () => {
					const entity = TEST_ENTITIES[0];
					const queryService = moduleRef.get(TestEntityService);
					return expect(
						queryService.removeRelation<TestRelation>('testRelations', entity.id, TEST_RELATIONS[4].id, {
							relationFilter: { relationName: { like: '%-one' } },
						}),
					).rejects.toThrow('Unable to find testRelations to remove from TestEntity');
				});
			});
		});
	});

	describe('#findById', () => {
		it('return the entity if found', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const found = await queryService.findById(entity.id);
			expect(found).toEqual(entity);
		});

		it('return null if not found', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const found = await queryService.findById('bad-id');
			expect(found).toBeUndefined();
		});

		it('return null if deleted', async () => {
			const entity = TEST_SOFT_DELETE_ENTITIES[0];
			const queryService = moduleRef.get(TestSoftDeleteEntityService);
			await queryService.deleteOne(entity.id, { useSoftDelete: true });
			const found = await queryService.findById(entity.id);
			expect(found).toBeUndefined();
		});

		it('return the entity if deleted and "withDeleted" is on', async () => {
			const entity = TEST_SOFT_DELETE_ENTITIES[0];
			const queryService = moduleRef.get(TestSoftDeleteEntityService);
			await queryService.deleteOne(entity.id, { useSoftDelete: true });
			const found = await queryService.findById(entity.id, { withDeleted: true });
			expect(found).toEqual({
				...entity,
				deletedAt: expect.any(Date),
			});
		});

		describe('with filter', () => {
			it('should return an entity if all filters match', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const found = await queryService.findById(entity.id, {
					filter: { stringType: { eq: entity.stringType } },
				});
				expect(found).toEqual(entity);
			});

			it('should return null if an entity with the pk and filter is not found', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const found = await queryService.findById(entity.id, {
					filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
				});
				expect(found).toBeUndefined();
			});
		});
	});

	describe('#getById', () => {
		it('return the entity if found', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const found = await queryService.getById(entity.id);
			expect(found).toEqual(entity);
		});

		it('should throw an error if not found', () => {
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.getById('bad-id')).rejects.toThrow('Unable to find TestEntity with id: bad-id');
		});

		describe('with filter', () => {
			it('should return an entity if all filters match', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const found = await queryService.getById(entity.id, {
					filter: { stringType: { eq: entity.stringType } },
				});
				expect(found).toEqual(entity);
			});

			it('should return an undefined if an entity with the pk and filter is not found', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);

				return expect(
					queryService.getById(entity.id, {
						filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
					}),
				).rejects.toThrow(`Unable to find TestEntity with id: ${entity.id}`);
			});
		});
	});

	describe('#createMany', () => {
		it('call save on the repo with instances of entities when passed plain objects', async () => {
			await truncate(getTestConnection());
			const queryService = moduleRef.get(TestEntityService);
			const created = await queryService.createMany(TEST_ENTITIES);
			expect(created).toEqual(TEST_ENTITIES);
		});

		it('call save on the repo with instances of entities when passed instances', async () => {
			await truncate(getTestConnection());
			const instances = TEST_ENTITIES.map((e) => plainToClass(TestEntity, e));
			const queryService = moduleRef.get(TestEntityService);
			const created = await queryService.createMany(instances);
			expect(created).toEqual(instances);
		});

		it('should reject if the entities already exist', async () => {
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.createMany(TEST_ENTITIES)).rejects.toThrow('Entity already exists');
		});
	});

	describe('#createOne', () => {
		it('call save on the repo with an instance of the entity when passed a plain object', async () => {
			await truncate(getTestConnection());
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			const created = await queryService.createOne(entity);
			expect(created).toEqual(entity);
		});

		it('call save on the repo with an instance of the entity when passed an instance', async () => {
			await truncate(getTestConnection());
			const entity = plainToClass(TestEntity, TEST_ENTITIES[0]);
			const queryService = moduleRef.get(TestEntityService);
			const created = await queryService.createOne(entity);
			expect(created).toEqual(entity);
		});

		it('should reject if the entity contains an id', async () => {
			const entity = TEST_ENTITIES[0];
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.createOne(entity)).rejects.toThrow('Entity already exists');
		});
	});

	describe('#deleteMany', () => {
		it('delete all records that match the query', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const { deletedCount } = await queryService.deleteMany({
				id: { in: TEST_ENTITIES.slice(0, 5).map((e) => e.id) },
			});
			expect(deletedCount).toEqual(expect.any(Number));
			const allCount = await queryService.count({});
			expect(allCount).toBe(5);
		});

		// TODO:: Test Delete many when query contains relations
	});

	describe('#deleteOne', () => {
		it('remove the entity', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const deleted = await queryService.deleteOne(TEST_ENTITIES[0].id);
			expect(deleted).toEqual({ ...TEST_ENTITIES[0], id: undefined });
		});

		it('call fail if the entity is not found', async () => {
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.deleteOne('bad-id')).rejects.toThrow('Unable to find TestEntity with id: bad-id');
		});

		describe('with filter', () => {
			it('should delete the entity if all filters match', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const deleted = await queryService.deleteOne(entity.id, {
					filter: { stringType: { eq: entity.stringType } },
				});
				expect(deleted).toEqual({ ...TEST_ENTITIES[0], id: undefined });
			});

			it('should return throw an error if unable to find', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.deleteOne(entity.id, {
						filter: { stringType: { eq: TEST_ENTITIES[1].stringType } },
					}),
				).rejects.toThrow(`Unable to find TestEntity with id: ${entity.id}`);
			});
		});
	});

	describe('#updateMany', () => {
		it('update all entities in the filter', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const filter = {
				id: { in: TEST_ENTITIES.slice(0, 5).map((e) => e.id) },
			};
			await queryService.updateMany({ stringType: 'updated' }, filter);
			const entities = await queryService.query({ filter });
			expect(entities).toHaveLength(5);
			entities.forEach((e) => expect(e.stringType).toBe('updated'));
		});

		it('should reject if the update contains a primary key', () => {
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.updateMany({ id: 'updated' }, {})).rejects.toThrow('Id cannot be specified when updating');
		});
	});

	describe('#updateOne', () => {
		it('update the entity', async () => {
			const queryService = moduleRef.get(TestEntityService);
			const updated = await queryService.updateOne(TEST_ENTITIES[0].id, { stringType: 'updated' });
			expect(updated).toEqual({ ...TEST_ENTITIES[0], stringType: 'updated' });
		});

		it('should reject if the update contains a primary key', async () => {
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.updateOne(TEST_ENTITIES[0].id, { id: 'bad-id' })).rejects.toThrow(
				'Id cannot be specified when updating',
			);
		});

		it('call fail if the entity is not found', async () => {
			const queryService = moduleRef.get(TestEntityService);
			return expect(queryService.updateOne('bad-id', { stringType: 'updated' })).rejects.toThrow(
				'Unable to find TestEntity with id: bad-id',
			);
		});

		describe('with filter', () => {
			it('should update the entity if all filters match', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				const updated = await queryService.updateOne(
					entity.id,
					{ stringType: 'updated' },
					{ filter: { stringType: { eq: entity.stringType } } },
				);
				expect(updated).toEqual({ ...entity, stringType: 'updated' });
			});

			it('should throw an error if unable to find the entity', async () => {
				const entity = TEST_ENTITIES[0];
				const queryService = moduleRef.get(TestEntityService);
				return expect(
					queryService.updateOne(
						entity.id,
						{ stringType: 'updated' },
						{ filter: { stringType: { eq: TEST_ENTITIES[1].stringType } } },
					),
				).rejects.toThrow(`Unable to find TestEntity with id: ${entity.id}`);
			});
		});
	});

	describe('#isSoftDelete', () => {
		describe('#deleteMany', () => {
			it('should soft delete the entities matching the query', async () => {
				const queryService = moduleRef.get(TestSoftDeleteEntityService);
				const entity = TEST_SOFT_DELETE_ENTITIES[0];
				const deleteMany: Filter<TestSoftDeleteEntity> = { id: { eq: entity.id } };
				await queryService.deleteMany(deleteMany);
				const foundEntity = await queryService.findById(entity.id);
				expect(foundEntity).toBeUndefined();
				const deletedEntity = await queryService.repo.findOne({
					where: { id: entity.id },
					withDeleted: true,
				});
				expect(deletedEntity).toEqual({ ...entity, deletedAt: expect.any(Date) });
			});
		});

		describe('#deleteOne', () => {
			it('should soft delete the entity', async () => {
				const queryService = moduleRef.get(TestSoftDeleteEntityService);
				const entity = TEST_SOFT_DELETE_ENTITIES[0];
				const deleted = await queryService.deleteOne(entity.id);
				expect(deleted).toEqual({ ...entity, deletedAt: expect.any(Date) });

				const foundEntity = await queryService.findById(entity.id);
				expect(foundEntity).toBeUndefined();

				const foundDeletedEntity = await queryService.findById(entity.id, { withDeleted: true });
				expect(foundDeletedEntity).toEqual({ ...entity, deletedAt: expect.any(Date) });

				const deletedEntity = await queryService.repo.findOne({
					where: { id: entity.id },
					withDeleted: true,
				});
				expect(deletedEntity).toEqual({ ...entity, deletedAt: expect.any(Date) });
			});

			it('should fail if the entity is not found', async () => {
				const queryService = moduleRef.get(TestSoftDeleteEntityService);
				return expect(queryService.deleteOne('bad-id')).rejects.toThrow('Unable to find TestSoftDeleteEntity with id: bad-id');
			});
		});

		describe('#restoreOne', () => {
			it('restore the entity', async () => {
				const queryService = moduleRef.get(TestSoftDeleteEntityService);
				const entity = TEST_SOFT_DELETE_ENTITIES[0];
				await queryService.deleteOne(entity.id);
				const restored = await queryService.restoreOne(entity.id);
				expect(restored).toEqual({ ...entity, deletedAt: null });
				const foundEntity = await queryService.findById(entity.id);
				expect(foundEntity).toEqual({ ...entity, deletedAt: null });
			});

			it('should fail if the entity is not found', async () => {
				const queryService = moduleRef.get(TestSoftDeleteEntityService);
				return expect(queryService.restoreOne('bad-id')).rejects.toThrow('Unable to find TestSoftDeleteEntity with id: bad-id');
			});

			it('should fail if the useSoftDelete is not enabled', async () => {
				const queryService = moduleRef.get(TestEntityService);
				return expect(queryService.restoreOne(TEST_ENTITIES[0].id)).rejects.toThrow(
					'Restore not allowed for non soft deleted entity TestEntity.',
				);
			});

			describe('with filter', () => {
				it('should restore the entity if all filters match', async () => {
					const queryService = moduleRef.get(TestSoftDeleteEntityService);
					const entity = TEST_SOFT_DELETE_ENTITIES[0];
					await queryService.deleteOne(entity.id);
					const restored = await queryService.restoreOne(entity.id, {
						filter: { stringType: { eq: entity.stringType } },
					});
					expect(restored).toEqual({ ...entity, deletedAt: null });
					const foundEntity = await queryService.findById(entity.id);
					expect(foundEntity).toEqual({ ...entity, deletedAt: null });
				});

				it('should return throw an error if unable to find', async () => {
					const queryService = moduleRef.get(TestSoftDeleteEntityService);
					const entity = TEST_SOFT_DELETE_ENTITIES[0];
					await queryService.deleteOne(entity.id);
					return expect(
						queryService.restoreOne(entity.id, {
							filter: { stringType: { eq: TEST_SOFT_DELETE_ENTITIES[1].stringType } },
						}),
					).rejects.toThrow(`Unable to find TestSoftDeleteEntity with id: ${entity.id}`);
				});
			});
		});

		describe('#restoreMany', () => {
			it('should restore multiple entities', async () => {
				const queryService = moduleRef.get(TestSoftDeleteEntityService);
				const entity = TEST_SOFT_DELETE_ENTITIES[0];
				const filter: Filter<TestSoftDeleteEntity> = { id: { eq: entity.id } };
				await queryService.deleteMany(filter);
				await queryService.restoreMany(filter);
				const foundEntity = await queryService.findById(entity.id);
				expect(foundEntity).toEqual({ ...entity, deletedAt: null });
			});

			it('should fail if the useSoftDelete is not enabled', async () => {
				const queryService = moduleRef.get(TestEntityService);
				return expect(queryService.restoreMany({ stringType: { eq: 'foo' } })).rejects.toThrow(
					'Restore not allowed for non soft deleted entity TestEntity.',
				);
			});
		});
	});
});
