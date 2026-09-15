// eslint-disable-next-line max-classes-per-file
import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { NullOrdering, SortDirection, SortNulls } from '@ptc-org/nestjs-query-core'
import { CursorConnectionType, CursorPagingType, PagingStrategies, StaticConnectionType } from '@ptc-org/nestjs-query-graphql'
import { plainToClass } from 'class-transformer'

import { FilterableField, KeySet } from '../../../src/decorators'
import { getOrCreateCursorConnectionType } from '../../../src/types/connection'
import { getOrCreateCursorPagingType } from '../../../src/types/query/paging'
import { generateSchema } from '../../__fixtures__'

describe('CursorConnectionType', (): void => {
  @ObjectType('Test')
  class TestDto {
    @Field()
    stringField!: string

    @Field()
    numberField!: number

    @Field()
    boolField!: boolean
  }

  @ObjectType('TestTotalCount')
  class TestTotalCountDto {
    @Field()
    stringField!: string
  }

  const createPage = (paging: CursorPagingType): CursorPagingType => plainToClass(getOrCreateCursorPagingType({}), paging)

  const createTestDTO = (index: number): TestDto => ({
    stringField: `foo${index}`,
    numberField: index,
    boolField: index % 2 === 0
  })

  it('should create the connection SDL', async () => {
    const TestConnection = getOrCreateCursorConnectionType(TestDto, { pagingStrategy: PagingStrategies.CURSOR })

    @Resolver()
    class TestConnectionTypeResolver {
      @Query(() => TestConnection)
      test(): CursorConnectionType<TestDto> | undefined {
        return undefined
      }
    }

    const schema = await generateSchema([TestConnectionTypeResolver])
    expect(schema).toMatchSnapshot()
  })

  it('should create the connection SDL with totalCount if enabled', async () => {
    const TestConnectionWithTotalCount = getOrCreateCursorConnectionType(TestTotalCountDto, {
      pagingStrategy: PagingStrategies.CURSOR,
      enableTotalCount: true
    })

    @Resolver()
    class TestConnectionTypeResolver {
      @Query(() => TestConnectionWithTotalCount)
      test(): CursorConnectionType<TestTotalCountDto> | undefined {
        return undefined
      }
    }

    const schema = await generateSchema([TestConnectionTypeResolver])
    expect(schema).toMatchSnapshot()
  })

  it('should throw an error if the object is not registered with @nestjs/graphql', () => {
    class TestBadDto {
      @Field()
      stringField!: string
    }

    expect(() => getOrCreateCursorConnectionType(TestBadDto, { pagingStrategy: PagingStrategies.CURSOR })).toThrow(
      'Unable to make ConnectionType. Ensure TestBadDto is annotated with @nestjs/graphql @ObjectType'
    )
  })

  describe('limit offset offset cursor connection', () => {
    const TestConnection = getOrCreateCursorConnectionType(TestDto, { pagingStrategy: PagingStrategies.CURSOR })

    it('should create an empty connection when created with new', () => {
      expect(new TestConnection()).toEqual({
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [],
        totalCountFn: expect.any(Function)
      })
    })

    describe('.createFromPromise', () => {
      it('should create a connections response with an empty query', async () => {
        const queryMany = jest.fn()
        const response = await TestConnection.createFromPromise(queryMany, {})
        expect(queryMany).toHaveBeenCalledTimes(0)
        expect(response).toEqual({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCountFn: expect.any(Function)
        })
      })

      it('should pass additional query params to queryMany', async () => {
        const queryMany = jest.fn()
        const dtos = [createTestDTO(1), createTestDTO(2)]
        queryMany.mockResolvedValueOnce([...dtos])
        await TestConnection.createFromPromise(queryMany, { search: 'searchString', paging: createPage({ first: 2 }) })
        expect(queryMany).toHaveBeenCalledTimes(1)
        expect(queryMany).toHaveBeenCalledWith({ search: 'searchString', paging: { limit: 3, offset: 0 } })
      })

      it('should create a connections response with an empty paging', async () => {
        const queryMany = jest.fn()
        const response = await TestConnection.createFromPromise(queryMany, { paging: {} })
        expect(queryMany).toHaveBeenCalledTimes(0)
        expect(response).toEqual({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCountFn: expect.any(Function)
        })
      })

      describe('with first', () => {
        it('should return hasNextPage and hasPreviousPage false when there are the exact number of records', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1), createTestDTO(2)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await TestConnection.createFromPromise(queryMany, { paging: createPage({ first: 2 }) })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({ paging: { limit: 3, offset: 0 } })
          expect(response).toEqual({
            edges: [
              { cursor: 'YXJyYXljb25uZWN0aW9uOjA=', node: dtos[0] },
              { cursor: 'YXJyYXljb25uZWN0aW9uOjE=', node: dtos[1] }
            ],
            pageInfo: {
              endCursor: 'YXJyYXljb25uZWN0aW9uOjE=',
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
            },
            totalCountFn: expect.any(Function)
          })
        })

        it('should return hasNextPage true and hasPreviousPage false when the number of records more than the first', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await TestConnection.createFromPromise(queryMany, { paging: createPage({ first: 2 }) })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({ paging: { limit: 3, offset: 0 } })
          expect(response).toEqual({
            edges: [
              { cursor: 'YXJyYXljb25uZWN0aW9uOjA=', node: dtos[0] },
              { cursor: 'YXJyYXljb25uZWN0aW9uOjE=', node: dtos[1] }
            ],
            pageInfo: {
              endCursor: 'YXJyYXljb25uZWN0aW9uOjE=',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
            },
            totalCountFn: expect.any(Function)
          })
        })
      })

      describe('with last', () => {
        it("should return hasPreviousPage false if paging backwards and we're on the first page", async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await TestConnection.createFromPromise(queryMany, {
            paging: createPage({ last: 2, before: 'YXJyYXljb25uZWN0aW9uOjE=' })
          })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({ paging: { limit: 1, offset: 0 } })
          expect(response).toEqual({
            edges: [{ cursor: 'YXJyYXljb25uZWN0aW9uOjA=', node: dtos[0] }],
            pageInfo: {
              endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA='
            },
            totalCountFn: expect.any(Function)
          })
        })

        it('should return hasPreviousPage true if paging backwards and there is an additional node', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await TestConnection.createFromPromise(queryMany, {
            paging: createPage({ last: 2, before: 'YXJyYXljb25uZWN0aW9uOjM=' })
          })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({ paging: { limit: 3, offset: 0 } })
          expect(response).toEqual({
            edges: [
              { cursor: 'YXJyYXljb25uZWN0aW9uOjE=', node: dtos[1] },
              { cursor: 'YXJyYXljb25uZWN0aW9uOjI=', node: dtos[2] }
            ],
            pageInfo: {
              endCursor: 'YXJyYXljb25uZWN0aW9uOjI=',
              hasNextPage: true,
              hasPreviousPage: true,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjE='
            },
            totalCountFn: expect.any(Function)
          })
        })
      })

      it('should create an empty connection', async () => {
        const queryMany = jest.fn()
        queryMany.mockResolvedValueOnce([])
        const response = await TestConnection.createFromPromise(queryMany, {
          paging: createPage({ first: 2 })
        })
        expect(queryMany).toHaveBeenCalledTimes(1)
        expect(queryMany).toHaveBeenCalledWith({ paging: { limit: 3, offset: 0 } })
        expect(response).toEqual({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCountFn: expect.any(Function)
        })
      })
    })
  })

  describe('keyset connection', () => {
    @ObjectType()
    @KeySet(['stringField'])
    class TestKeySetDTO extends TestDto {}

    function getConnectionType(): StaticConnectionType<TestKeySetDTO, PagingStrategies.CURSOR> {
      return getOrCreateCursorConnectionType(TestKeySetDTO, { pagingStrategy: PagingStrategies.CURSOR })
    }

    it('should create an empty connection when created with new', () => {
      const CT = getConnectionType()
      expect(new CT()).toEqual({
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        edges: [],
        totalCountFn: expect.any(Function)
      })
    })

    describe('.createFromPromise', () => {
      it('should create a connections response with an empty query', async () => {
        const queryMany = jest.fn()
        const response = await getConnectionType().createFromPromise(queryMany, {})
        expect(queryMany).toHaveBeenCalledTimes(0)
        expect(response).toEqual({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCountFn: expect.any(Function)
        })
      })

      it('should create a connections response with an empty paging', async () => {
        const queryMany = jest.fn()
        const response = await getConnectionType().createFromPromise(queryMany, { paging: {} })
        expect(queryMany).toHaveBeenCalledTimes(0)
        expect(response).toEqual({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCountFn: expect.any(Function)
        })
      })

      describe('with first', () => {
        it('should return hasNextPage and hasPreviousPage false when there are the exact number of records', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1), createTestDTO(2)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await getConnectionType().createFromPromise(queryMany, { paging: createPage({ first: 2 }) })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({
            filter: {},
            paging: { limit: 3 },
            sorting: [{ field: 'stringField', direction: SortDirection.ASC }]
          })
          expect(response).toEqual({
            edges: [
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ==',
                node: dtos[0]
              },
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                node: dtos[1]
              }
            ],
            pageInfo: {
              startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ==',
              endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
              hasNextPage: false,
              hasPreviousPage: false
            },
            totalCountFn: expect.any(Function)
          })
        })

        it('should return hasNextPage true and hasPreviousPage false when the number of records more than the first', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await getConnectionType().createFromPromise(queryMany, { paging: createPage({ first: 2 }) })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({
            filter: {},
            paging: { limit: 3 },
            sorting: [{ field: 'stringField', direction: SortDirection.ASC }]
          })
          expect(response).toEqual({
            edges: [
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ==',
                node: dtos[0]
              },
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                node: dtos[1]
              }
            ],
            pageInfo: {
              startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ==',
              endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
              hasNextPage: true,
              hasPreviousPage: false
            },
            totalCountFn: expect.any(Function)
          })
        })

        it('should fetch nodes after the cursor', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(2), createTestDTO(3), createTestDTO(4)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await getConnectionType().createFromPromise(queryMany, {
            paging: createPage({
              first: 2,
              after: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ=='
            })
          })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({
            filter: { or: [{ and: [{ or: [{ stringField: { gt: 'foo1' } }, { stringField: { is: null } }] }] }] },
            paging: { limit: 3 },
            sorting: [{ field: 'stringField', direction: SortDirection.ASC }]
          })
          expect(response).toEqual({
            edges: [
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                node: dtos[0]
              },
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                node: dtos[1]
              }
            ],
            pageInfo: {
              startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
              endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
              hasNextPage: true,
              hasPreviousPage: true
            },
            totalCountFn: expect.any(Function)
          })
        })

        describe('with additional filter', () => {
          it('should merge the cursor filter and query filter', async () => {
            const queryMany = jest.fn()
            const dtos = [createTestDTO(2), createTestDTO(3), createTestDTO(4)]
            queryMany.mockResolvedValueOnce([...dtos])
            const response = await getConnectionType().createFromPromise(queryMany, {
              filter: { boolField: { is: true } },
              paging: createPage({
                first: 2,
                after: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ=='
              })
            })
            expect(queryMany).toHaveBeenCalledTimes(1)
            expect(queryMany).toHaveBeenCalledWith({
              filter: {
                and: [
                  { or: [{ and: [{ or: [{ stringField: { gt: 'foo1' } }, { stringField: { is: null } }] }] }] },
                  { boolField: { is: true } }
                ]
              },
              paging: { limit: 3 },
              sorting: [{ field: 'stringField', direction: SortDirection.ASC }]
            })
            expect(response).toEqual({
              edges: [
                {
                  cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                  node: dtos[0]
                },
                {
                  cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                  node: dtos[1]
                }
              ],
              pageInfo: {
                startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                hasNextPage: true,
                hasPreviousPage: true
              },
              totalCountFn: expect.any(Function)
            })
          })
        })

        describe('with additional sorting', () => {
          it('should merge the cursor filter and query filter', async () => {
            const queryMany = jest.fn()
            const dtos = [createTestDTO(2), createTestDTO(3), createTestDTO(4)]
            queryMany.mockResolvedValueOnce([...dtos])
            const response = await getConnectionType().createFromPromise(queryMany, {
              filter: { boolField: { is: true } },
              sorting: [{ field: 'boolField', direction: SortDirection.DESC }],
              paging: createPage({
                first: 2,
                after:
                  'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjpmYWxzZX0seyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ=='
              })
            })
            expect(queryMany).toHaveBeenCalledTimes(1)
            expect(queryMany).toHaveBeenCalledWith({
              filter: {
                and: [
                  {
                    or: [
                      { and: [{ boolField: { lt: false } }] },
                      {
                        and: [
                          { boolField: { eq: false } },
                          { or: [{ stringField: { gt: 'foo1' } }, { stringField: { is: null } }] }
                        ]
                      }
                    ]
                  },
                  { boolField: { is: true } }
                ]
              },
              paging: { limit: 3 },
              sorting: [
                { field: 'boolField', direction: SortDirection.DESC },
                { field: 'stringField', direction: SortDirection.ASC }
              ]
            })
            expect(response).toEqual({
              edges: [
                {
                  cursor:
                    'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjp0cnVlfSx7ImZpZWxkIjoic3RyaW5nRmllbGQiLCJ2YWx1ZSI6ImZvbzIifV19',
                  node: dtos[0]
                },
                {
                  cursor:
                    'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjpmYWxzZX0seyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                  node: dtos[1]
                }
              ],
              pageInfo: {
                startCursor:
                  'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjp0cnVlfSx7ImZpZWxkIjoic3RyaW5nRmllbGQiLCJ2YWx1ZSI6ImZvbzIifV19',
                endCursor:
                  'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjpmYWxzZX0seyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                hasNextPage: true,
                hasPreviousPage: true
              },
              totalCountFn: expect.any(Function)
            })
          })
        })
      })

      describe('with last', () => {
        it("should return hasPreviousPage false if paging backwards and we're on the first page", async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1)]
          queryMany.mockResolvedValueOnce([...dtos])
          const response = await getConnectionType().createFromPromise(queryMany, {
            paging: createPage({
              last: 2,
              before: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ=='
            })
          })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({
            filter: { or: [{ and: [{ stringField: { lt: 'foo2' } }] }] },
            paging: { limit: 3 },
            sorting: [{ field: 'stringField', direction: SortDirection.DESC, nulls: undefined }]
          })
          expect(response).toEqual({
            edges: [
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ==',
                node: dtos[0]
              }
            ],
            pageInfo: {
              endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ==',
              hasNextPage: true,
              hasPreviousPage: false,
              startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28xIn1dfQ=='
            },
            totalCountFn: expect.any(Function)
          })
        })

        it('should return hasPreviousPage true if paging backwards and there is an additional node', async () => {
          const queryMany = jest.fn()
          const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
          queryMany.mockResolvedValueOnce([...dtos].reverse())
          const response = await getConnectionType().createFromPromise(queryMany, {
            paging: createPage({
              last: 2,
              before: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb280In1dfQ=='
            })
          })
          expect(queryMany).toHaveBeenCalledTimes(1)
          expect(queryMany).toHaveBeenCalledWith({
            filter: { or: [{ and: [{ stringField: { lt: 'foo4' } }] }] },
            paging: { limit: 3 },
            sorting: [{ field: 'stringField', direction: SortDirection.DESC, nulls: undefined }]
          })
          expect(response).toEqual({
            edges: [
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                node: dtos[1]
              },
              {
                cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                node: dtos[2]
              }
            ],
            pageInfo: {
              startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
              endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
              hasNextPage: true,
              hasPreviousPage: true
            },
            totalCountFn: expect.any(Function)
          })
        })

        describe('with additional filter', () => {
          it('should merge the cursor filter and query filter', async () => {
            const queryMany = jest.fn()
            const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
            queryMany.mockResolvedValueOnce([...dtos].reverse())
            const response = await getConnectionType().createFromPromise(queryMany, {
              filter: { boolField: { is: true } },
              paging: createPage({
                last: 2,
                before: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb280In1dfQ=='
              })
            })
            expect(queryMany).toHaveBeenCalledTimes(1)
            expect(queryMany).toHaveBeenCalledWith({
              filter: { and: [{ or: [{ and: [{ stringField: { lt: 'foo4' } }] }] }, { boolField: { is: true } }] },
              paging: { limit: 3 },
              sorting: [{ field: 'stringField', direction: SortDirection.DESC }]
            })
            expect(response).toEqual({
              edges: [
                {
                  cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                  node: dtos[1]
                },
                {
                  cursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                  node: dtos[2]
                }
              ],
              pageInfo: {
                startCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28yIn1dfQ==',
                endCursor: 'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                hasNextPage: true,
                hasPreviousPage: true
              },
              totalCountFn: expect.any(Function)
            })
          })
        })

        describe('with additional sort', () => {
          it('should merge the cursor sort', async () => {
            const queryMany = jest.fn()
            const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
            queryMany.mockResolvedValueOnce([...dtos].reverse())
            const response = await getConnectionType().createFromPromise(queryMany, {
              filter: { boolField: { is: true } },
              sorting: [{ field: 'boolField', direction: SortDirection.DESC }],
              paging: createPage({
                last: 2,
                before:
                  'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjp0cnVlfSx7ImZpZWxkIjoic3RyaW5nRmllbGQiLCJ2YWx1ZSI6ImZvbzQifV19'
              })
            })
            expect(queryMany).toHaveBeenCalledTimes(1)
            expect(queryMany).toHaveBeenCalledWith({
              filter: {
                and: [
                  {
                    or: [
                      { and: [{ or: [{ boolField: { gt: true } }, { boolField: { is: null } }] }] },
                      { and: [{ boolField: { eq: true } }, { stringField: { lt: 'foo4' } }] }
                    ]
                  },
                  { boolField: { is: true } }
                ]
              },
              paging: { limit: 3 },
              sorting: [
                { field: 'boolField', direction: SortDirection.ASC },
                { field: 'stringField', direction: SortDirection.DESC }
              ]
            })
            expect(response).toEqual({
              edges: [
                {
                  cursor:
                    'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjp0cnVlfSx7ImZpZWxkIjoic3RyaW5nRmllbGQiLCJ2YWx1ZSI6ImZvbzIifV19',
                  node: dtos[1]
                },
                {
                  cursor:
                    'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjpmYWxzZX0seyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                  node: dtos[2]
                }
              ],
              pageInfo: {
                startCursor:
                  'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjp0cnVlfSx7ImZpZWxkIjoic3RyaW5nRmllbGQiLCJ2YWx1ZSI6ImZvbzIifV19',
                endCursor:
                  'eyJ0eXBlIjoia2V5c2V0IiwiZmllbGRzIjpbeyJmaWVsZCI6ImJvb2xGaWVsZCIsInZhbHVlIjpmYWxzZX0seyJmaWVsZCI6InN0cmluZ0ZpZWxkIiwidmFsdWUiOiJmb28zIn1dfQ==',
                hasNextPage: true,
                hasPreviousPage: true
              },
              totalCountFn: expect.any(Function)
            })
          })
        })
      })

      it('should ignore a duplicate sort field so the cursor round-trips', async () => {
        const duplicatedSorting = [
          { field: 'stringField' as const, direction: SortDirection.ASC },
          { field: 'stringField' as const, direction: SortDirection.DESC }
        ]
        const queryMany = jest.fn()
        const dtos = [createTestDTO(1), createTestDTO(2), createTestDTO(3)]
        queryMany.mockResolvedValueOnce([...dtos])
        const response = await getConnectionType().createFromPromise(queryMany, {
          sorting: duplicatedSorting,
          paging: createPage({ first: 2 })
        })
        expect(queryMany).toHaveBeenCalledWith({
          filter: {},
          paging: { limit: 3 },
          sorting: [{ field: 'stringField', direction: SortDirection.ASC }]
        })

        const queryManyNextPage = jest.fn()
        queryManyNextPage.mockResolvedValueOnce([])
        await getConnectionType().createFromPromise(queryManyNextPage, {
          sorting: duplicatedSorting,
          paging: createPage({ first: 2, after: response.pageInfo.endCursor })
        })
        expect(queryManyNextPage).toHaveBeenCalledWith({
          filter: { or: [{ and: [{ or: [{ stringField: { gt: 'foo2' } }, { stringField: { is: null } }] }] }] },
          paging: { limit: 3 },
          sorting: [{ field: 'stringField', direction: SortDirection.ASC }]
        })
      })

      it('should create an empty connection', async () => {
        const queryMany = jest.fn()
        queryMany.mockResolvedValueOnce([])
        const response = await getConnectionType().createFromPromise(queryMany, {
          paging: createPage({ first: 2 })
        })
        expect(queryMany).toHaveBeenCalledTimes(1)
        expect(queryMany).toHaveBeenCalledWith({
          filter: {},
          paging: { limit: 3 },
          sorting: [{ field: 'stringField', direction: SortDirection.ASC, nulls: undefined }]
        })
        expect(response).toEqual({
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false
          },
          totalCountFn: expect.any(Function)
        })
      })
    })
  })

  describe('keyset connection with nullable sort fields', () => {
    @ObjectType('TestNullable')
    @KeySet(['id'])
    class TestNullableDTO {
      @FilterableField()
      id!: number

      @FilterableField({ nullable: true })
      nullableField!: string
    }

    function getNullableConnectionType(): StaticConnectionType<TestNullableDTO, PagingStrategies.CURSOR> {
      return getOrCreateCursorConnectionType(TestNullableDTO, { pagingStrategy: PagingStrategies.CURSOR })
    }

    const keysetCursor = (fields: { field: string; value: unknown }[]): string =>
      Buffer.from(JSON.stringify({ type: 'keyset', fields })).toString('base64')

    it('should include the null block when paging past a non-null value on a nullable ascending sort', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullableConnectionType().createFromPromise(queryMany, {
        sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
        paging: createPage({
          first: 2,
          after: keysetCursor([
            { field: 'nullableField', value: 'foo1' },
            { field: 'id', value: 2 }
          ])
        })
      })
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [
            { and: [{ or: [{ nullableField: { gt: 'foo1' } }, { nullableField: { is: null } }] }] },
            { and: [{ nullableField: { eq: 'foo1' } }, { id: { gt: 2 } }] }
          ]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })

    it('should continue inside the null block when the cursor value is null', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullableConnectionType().createFromPromise(queryMany, {
        sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
        paging: createPage({
          first: 2,
          after: keysetCursor([
            { field: 'nullableField', value: null },
            { field: 'id', value: 5 }
          ])
        })
      })
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })

    it('should honour an explicit nulls placement over the direction default', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullableConnectionType().createFromPromise(queryMany, {
        sorting: [{ field: 'nullableField', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST }],
        paging: createPage({
          first: 2,
          after: keysetCursor([
            { field: 'nullableField', value: null },
            { field: 'id', value: 5 }
          ])
        })
      })
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { isNot: null } }] }, { and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC, nulls: SortNulls.NULLS_FIRST },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })

    it('should follow the nulls to the other end of the sort when paging backwards', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullableConnectionType().createFromPromise(queryMany, {
        sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
        paging: createPage({
          last: 2,
          before: keysetCursor([
            { field: 'nullableField', value: null },
            { field: 'id', value: 5 }
          ])
        })
      })
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { isNot: null } }] }, { and: [{ nullableField: { is: null } }, { id: { lt: 5 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.DESC },
          { field: 'id', direction: SortDirection.DESC }
        ]
      })
    })

    it('should not add a null arm for a field declared non-nullable', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullableConnectionType().createFromPromise(queryMany, {
        paging: createPage({
          first: 2,
          after: keysetCursor([{ field: 'id', value: 2 }])
        })
      })
      expect(queryMany).toHaveBeenCalledWith({
        filter: { or: [{ and: [{ id: { gt: 2 } }] }] },
        paging: { limit: 3 },
        sorting: [{ field: 'id', direction: SortDirection.ASC }]
      })
    })

    it('should reject a cursor carrying fewer fields than the sort', async () => {
      const queryMany = jest.fn()
      await expect(
        getNullableConnectionType().createFromPromise(queryMany, {
          sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
          paging: createPage({
            first: 2,
            after: keysetCursor([{ field: 'nullableField', value: 'foo1' }])
          })
        })
      ).rejects.toThrow('Invalid cursor')
      expect(queryMany).not.toHaveBeenCalled()
    })

    it('should reject a cursor created for a different sort', async () => {
      const queryMany = jest.fn()
      await expect(
        getNullableConnectionType().createFromPromise(queryMany, {
          sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
          paging: createPage({
            first: 2,
            after: keysetCursor([
              { field: 'id', value: 1 },
              { field: 'nullableField', value: 'foo1' }
            ])
          })
        })
      ).rejects.toThrow('Cursor Payload does not match query sort expected id found nullableField')
      expect(queryMany).not.toHaveBeenCalled()
    })

    it('should terminate paging with a no-match filter when every boundary arm is dropped', async () => {
      @ObjectType('TestNullableKeySet')
      @KeySet(['nullableField'])
      class TestNullableKeySetDTO {
        @FilterableField({ nullable: true })
        nullableField!: string
      }
      const ConnectionType = getOrCreateCursorConnectionType(TestNullableKeySetDTO, {
        pagingStrategy: PagingStrategies.CURSOR
      })

      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      const response = await ConnectionType.createFromPromise(queryMany, {
        paging: createPage({
          first: 2,
          after: keysetCursor([{ field: 'nullableField', value: null }])
        })
      })
      expect(queryMany).toHaveBeenCalledWith({
        filter: { and: [{ nullableField: { is: null } }, { nullableField: { isNot: null } }] },
        paging: { limit: 3 },
        sorting: [{ field: 'nullableField', direction: SortDirection.ASC }]
      })
      expect(response.edges).toEqual([])
      expect(response.pageInfo.hasNextPage).toBe(false)
    })
  })
  describe('keyset connection over a store that sorts nulls smallest', () => {
    @ObjectType('TestNullsSmallest')
    @KeySet(['id'])
    class TestNullsSmallestDTO {
      @FilterableField()
      id!: number

      @FilterableField({ nullable: true })
      nullableField!: string
    }

    const nullsSmallest = { nullOrdering: NullOrdering.NULLS_SMALLEST }

    function getNullsSmallestConnectionType(): StaticConnectionType<TestNullsSmallestDTO, PagingStrategies.CURSOR> {
      return getOrCreateCursorConnectionType(TestNullsSmallestDTO, { pagingStrategy: PagingStrategies.CURSOR })
    }

    const keysetCursor = (fields: { field: string; value: unknown }[]): string =>
      Buffer.from(JSON.stringify({ type: 'keyset', fields })).toString('base64')

    it('should leave the null block behind when paging past a non-null value on an ascending sort', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullsSmallestConnectionType().createFromPromise(
        queryMany,
        {
          sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
          paging: createPage({
            first: 2,
            after: keysetCursor([
              { field: 'nullableField', value: 'foo1' },
              { field: 'id', value: 2 }
            ])
          })
        },
        undefined,
        nullsSmallest
      )
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { gt: 'foo1' } }] }, { and: [{ nullableField: { eq: 'foo1' } }, { id: { gt: 2 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })

    it('should reach the non-null values when paging past a null on an ascending sort', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullsSmallestConnectionType().createFromPromise(
        queryMany,
        {
          sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
          paging: createPage({
            first: 2,
            after: keysetCursor([
              { field: 'nullableField', value: null },
              { field: 'id', value: 5 }
            ])
          })
        },
        undefined,
        nullsSmallest
      )
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { isNot: null } }] }, { and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })

    it('should honour an explicit nulls placement over what the store reports', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullsSmallestConnectionType().createFromPromise(
        queryMany,
        {
          sorting: [{ field: 'nullableField', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST }],
          paging: createPage({
            first: 2,
            after: keysetCursor([
              { field: 'nullableField', value: null },
              { field: 'id', value: 5 }
            ])
          })
        },
        undefined,
        nullsSmallest
      )
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC, nulls: SortNulls.NULLS_LAST },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })

    it('should keep the nulls-largest boundary when the store reports nothing', async () => {
      const queryMany = jest.fn()
      queryMany.mockResolvedValueOnce([])
      await getNullsSmallestConnectionType().createFromPromise(
        queryMany,
        {
          sorting: [{ field: 'nullableField', direction: SortDirection.ASC }],
          paging: createPage({
            first: 2,
            after: keysetCursor([
              { field: 'nullableField', value: null },
              { field: 'id', value: 5 }
            ])
          })
        },
        undefined,
        {}
      )
      expect(queryMany).toHaveBeenCalledWith({
        filter: {
          or: [{ and: [{ nullableField: { is: null } }, { id: { gt: 5 } }] }]
        },
        paging: { limit: 3 },
        sorting: [
          { field: 'nullableField', direction: SortDirection.ASC },
          { field: 'id', direction: SortDirection.ASC }
        ]
      })
    })
  })
})
