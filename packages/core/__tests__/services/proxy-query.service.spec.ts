import { AggregateQuery, QueryService } from '@ptc-org/nestjs-query-core'
import { instance, mock, reset, when } from 'ts-mockito'

import { ProxyQueryService } from '../../src/services/proxy-query.service'

describe('ProxyQueryService', () => {
  class TestType {
    foo!: string
  }

  const mockQueryService: QueryService<TestType> = mock<QueryService<TestType>>()

  afterEach(() => reset(mockQueryService))

  const proxyQueryService = new ProxyQueryService(instance(mockQueryService))
  const queryService: QueryService<TestType> = proxyQueryService
  it('should proxy to the underlying service when calling addRelations', () => {
    const relationName = 'test'
    const id = 1
    const relationIds = [1, 2, 3]
    const result = { foo: 'bar' }
    when(mockQueryService.addRelations(relationName, id, relationIds, undefined)).thenResolve(result)
    return expect(queryService.addRelations(relationName, id, relationIds)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling createMany', () => {
    const entities = [{ foo: 'bar' }]
    when(mockQueryService.createMany(entities, undefined)).thenResolve(entities)
    return expect(queryService.createMany(entities)).resolves.toBe(entities)
  })
  it('should proxy to the underlying service when calling createMany with opts', () => {
    const entities = [{ foo: 'bar' }]
    const createManyOpts = { filter: { foo: { eq: 'bar' } } }
    when(mockQueryService.createMany(entities, createManyOpts)).thenResolve(entities)
    return expect(queryService.createMany(entities, createManyOpts)).resolves.toBe(entities)
  })
  it('should proxy to the underlying service when calling createOne', () => {
    const entity = { foo: 'bar' }
    when(mockQueryService.createOne(entity, undefined)).thenResolve(entity)
    return expect(queryService.createOne(entity)).resolves.toBe(entity)
  })
  it('should proxy to the underlying service when calling createOne with opts', () => {
    const entity = { foo: 'bar' }
    const createOneOpts = { filter: { foo: { eq: 'bar' } } }
    when(mockQueryService.createOne(entity, createOneOpts)).thenResolve(entity)
    return expect(queryService.createOne(entity, createOneOpts)).resolves.toBe(entity)
  })
  it('should proxy to the underlying service when calling deleteMany', () => {
    const filter = {}
    const result = { deletedCount: 2 }
    when(mockQueryService.deleteMany(filter, undefined)).thenResolve(result)
    return expect(queryService.deleteMany(filter)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling deleteOne', () => {
    const result = { foo: 'bar' }
    when(mockQueryService.deleteOne(1, undefined)).thenResolve(result)
    return expect(queryService.deleteOne(1)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling findById', () => {
    const result = { foo: 'bar' }
    when(mockQueryService.findById(1, undefined)).thenResolve(result)
    return expect(queryService.findById(1)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling exportMany', () => {
    const query = { filter: { foo: { eq: 'bar' } } }
    const result = [{ foo: 'bar' }]
    when(mockQueryService.exportMany(query, undefined)).thenResolve(result)
    return expect(queryService.exportMany(query)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling findRelation with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const result = { foo: 'bar' }
    when(mockQueryService.findRelation(TestType, relationName, dto, undefined)).thenResolve(result)
    return expect(queryService.findRelation(TestType, relationName, dto)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling findRelation with multiple dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const result = new Map([[{ foo: 'bar' }, undefined]])
    when(mockQueryService.findRelation(TestType, relationName, dtos, undefined)).thenResolve(result)
    return expect(queryService.findRelation(TestType, relationName, dtos)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling getById', () => {
    const result = { foo: 'bar' }
    when(mockQueryService.getById(1, undefined)).thenResolve(result)
    return expect(queryService.getById(1)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling query', () => {
    const query = {}
    const result = [{ foo: 'bar' }]
    when(mockQueryService.query(query, undefined)).thenResolve(result)
    return expect(queryService.query(query)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling aggregate', () => {
    const filter = {}
    const aggregate: AggregateQuery<TestType> = { count: [{ field: 'foo', args: {} }] }
    const result = [{ count: { foo: 1 } }]
    when(mockQueryService.aggregate(filter, aggregate, undefined)).thenResolve(result)
    return expect(queryService.aggregate(filter, aggregate)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling count', () => {
    const query = {}
    const result = 1
    when(mockQueryService.count(query, undefined)).thenResolve(result)
    return expect(queryService.count(query)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling queryRelations with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const query = {}
    const result = [{ foo: 'bar' }]
    when(mockQueryService.queryRelations(TestType, relationName, dto, query, undefined)).thenResolve(result)
    return expect(queryService.queryRelations(TestType, relationName, dto, query)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling queryRelations with many dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const query = {}
    const result = new Map([[{ foo: 'bar' }, []]])
    when(mockQueryService.queryRelations(TestType, relationName, dtos, query, undefined)).thenResolve(result)
    return expect(queryService.queryRelations(TestType, relationName, dtos, query)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling queryRelations with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const query = {}
    const opts = { withDeleted: true }
    const result = [{ foo: 'bar' }]
    when(mockQueryService.queryRelations(TestType, relationName, dto, query, opts)).thenResolve(result)
    return expect(proxyQueryService.queryRelations(TestType, relationName, dto, query, opts)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling queryRelations with many dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const query = {}
    const opts = { withDeleted: true }
    const result = new Map([[{ foo: 'bar' }, []]])
    when(mockQueryService.queryRelations(TestType, relationName, dtos, query, opts)).thenResolve(result)
    return expect(proxyQueryService.queryRelations(TestType, relationName, dtos, query, opts)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling aggregateRelations with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const filter = {}
    const aggQuery: AggregateQuery<TestType> = { count: [{ field: 'foo', args: {} }] }
    const result = [{ count: { foo: 1 } }]
    when(mockQueryService.aggregateRelations(TestType, relationName, dto, filter, aggQuery)).thenResolve(result)
    return expect(queryService.aggregateRelations(TestType, relationName, dto, filter, aggQuery)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling aggregateRelations with many dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const filter = {}
    const aggQuery: AggregateQuery<TestType> = { count: [{ field: 'foo', args: {} }] }
    const result = new Map([[{ foo: 'bar' }, [{ count: { foo: 1 } }]]])
    when(mockQueryService.aggregateRelations(TestType, relationName, dtos, filter, aggQuery)).thenResolve(result)
    return expect(queryService.aggregateRelations(TestType, relationName, dtos, filter, aggQuery)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling countRelations with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const query = {}
    const result = 1
    when(mockQueryService.countRelations(TestType, relationName, dto, query, undefined)).thenResolve(result)
    return expect(queryService.countRelations(TestType, relationName, dto, query)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling countRelations with many dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const query = {}
    const result = new Map([[{ foo: 'bar' }, 1]])
    when(mockQueryService.countRelations(TestType, relationName, dtos, query, undefined)).thenResolve(result)
    return expect(queryService.countRelations(TestType, relationName, dtos, query)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling countRelations with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const query = {}
    const opts = { withDeleted: true }
    const result = 1
    when(mockQueryService.countRelations(TestType, relationName, dto, query, opts)).thenResolve(result)
    return expect(proxyQueryService.countRelations(TestType, relationName, dto, query, opts)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling countRelations with many dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const query = {}
    const opts = { withDeleted: true }
    const result = new Map([[{ foo: 'bar' }, 1]])
    when(mockQueryService.countRelations(TestType, relationName, dtos, query, opts)).thenResolve(result)
    return expect(proxyQueryService.countRelations(TestType, relationName, dtos, query, opts)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling findRelation with one dto', () => {
    const relationName = 'test'
    const dto = new TestType()
    const opts = { withDeleted: true }
    const result = { foo: 'bar' }
    when(mockQueryService.findRelation(TestType, relationName, dto, opts)).thenResolve(result)
    return expect(proxyQueryService.findRelation(TestType, relationName, dto, opts)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling findRelation with many dtos', () => {
    const relationName = 'test'
    const dtos = [new TestType()]
    const opts = { withDeleted: true }
    const result = new Map([[dtos[0], { foo: 'bar' }]])
    when(mockQueryService.findRelation(TestType, relationName, dtos, opts)).thenResolve(result)
    return expect(proxyQueryService.findRelation(TestType, relationName, dtos, opts)).resolves.toBe(result)
  })

  it('should proxy the opts to the underlying service when calling deleteMany', () => {
    const filter = {}
    const opts = { useSoftDelete: true }
    const result = { deletedCount: 2 }
    when(mockQueryService.deleteMany(filter, opts)).thenResolve(result)
    return expect(proxyQueryService.deleteMany(filter, opts)).resolves.toBe(result)
  })

  it('should proxy to the underlying service when calling removeRelation', () => {
    const relationName = 'test'
    const id = 1
    const relationId = 2
    const result = { foo: 'bar' }
    when(mockQueryService.removeRelation(relationName, id, relationId, undefined)).thenResolve(result)
    return expect(queryService.removeRelation(relationName, id, relationId)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling removeRelations', () => {
    const relationName = 'test'
    const id = 1
    const relationIds = [2]
    const result = { foo: 'bar' }
    when(mockQueryService.removeRelations(relationName, id, relationIds, undefined)).thenResolve(result)
    return expect(queryService.removeRelations(relationName, id, relationIds)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling setRelation', () => {
    const relationName = 'test'
    const id = 1
    const relationId = 2
    const result = { foo: 'bar' }
    when(mockQueryService.setRelation(relationName, id, relationId, undefined)).thenResolve(result)
    return expect(queryService.setRelation(relationName, id, relationId)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling setRelations', () => {
    const relationName = 'test'
    const id = 1
    const relationIds = [2]
    const result = { foo: 'bar' }
    when(mockQueryService.setRelations(relationName, id, relationIds, undefined)).thenResolve(result)
    return expect(queryService.setRelations(relationName, id, relationIds)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling updateMany', () => {
    const update = { foo: 'bar' }
    const filter = {}
    const result = { updatedCount: 1 }
    when(mockQueryService.updateMany(update, filter)).thenResolve(result)
    return expect(queryService.updateMany(update, filter)).resolves.toBe(result)
  })
  it('should proxy to the underlying service when calling updateOne', () => {
    const id = 1
    const update = { foo: 'bar' }
    const result = { foo: 'bar' }
    when(mockQueryService.updateOne(id, update, undefined)).thenResolve(result)
    return expect(queryService.updateOne(id, update)).resolves.toBe(result)
  })
})
