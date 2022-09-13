// this is needed to create a query builder in typeorm :(
import { DataSource} from 'typeorm';
import { TestEntityRelationEntity } from './test-entity-relation.entity';
import { TestRelation } from './test-relation.entity';
import { TestSoftDeleteEntity } from './test-soft-delete.entity';
import { TestEntity } from './test.entity';
import { seed } from './seeds';
import { RelationOfTestRelationEntity } from './relation-of-test-relation.entity';
import { TestSoftDeleteRelation } from './test-soft-delete.relation';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';

export const CONNECTION_OPTIONS: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: [
    TestEntity,
    TestSoftDeleteEntity,
    TestRelation,
    TestEntityRelationEntity,
    RelationOfTestRelationEntity,
    TestSoftDeleteRelation
  ],
  synchronize: true,
  logging: false
};

const defaultConnection = new DataSource(CONNECTION_OPTIONS);

export async function createTestConnection() {
  if (!defaultConnection.isInitialized) {
    await defaultConnection.initialize();
  }
  return defaultConnection;
}

export async function closeTestConnection(): Promise<void> {
  await createTestConnection();
  return defaultConnection.destroy();
}

export function getTestConnection() {
  return defaultConnection;
}

const tables = [
  'test_entity',
  'relation_of_test_relation_entity',
  'test_relation',
  'test_entity_relation_entity',
  'test_soft_delete_entity',
  'test_soft_delete_relation',
  'test_entity_many_test_relations_test_relation'
];
export const truncate = async (connection: DataSource): Promise<void> => {
  await tables.reduce(async (prev, table) => {
    await prev;
    await connection.query(`DELETE
                            FROM ${table}`);
  }, Promise.resolve());
};

export const refresh = async (connection: DataSource = getTestConnection()): Promise<void> => {
  await createTestConnection();
  await truncate(connection);
  return seed(connection);
};
