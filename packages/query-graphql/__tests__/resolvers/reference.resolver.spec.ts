import { ExecutionContext } from '@nestjs/common'
import { Query, Resolver } from '@nestjs/graphql'
import { ReferenceResolver, ReferenceResolverOpts } from '@ptc-org/nestjs-query-graphql'
import { anything, when } from 'ts-mockito'

import { createResolverFromNest, generateSchema, TestResolverDTO, TestService } from '../__fixtures__'

@Resolver(() => TestResolverDTO)
class TestResolver extends ReferenceResolver(TestResolverDTO, { key: 'id' }) {
  constructor(service: TestService) {
    super(service)
  }
}

describe('ReferenceResolver', () => {
  const expectResolverSDL = async (opts?: ReferenceResolverOpts) => {
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends ReferenceResolver(TestResolverDTO, opts) {
      @Query(() => TestResolverDTO)
      test(): TestResolverDTO {
        return { id: '1', stringField: 'foo' }
      }
    }

    const schema = await generateSchema([TestSDLResolver])
    expect(schema).toMatchSnapshot()
  }

  it('should create a new resolver with a resolveReference method', () => expectResolverSDL())

  it('should return the original resolver if key is not provided', () => {
    const TestReferenceResolver = ReferenceResolver(TestResolverDTO)
    return expect(TestReferenceResolver.prototype.resolveReference).toBeUndefined()
  })

  describe('#resolveReference', () => {
    const createContext = (): ExecutionContext => ({}) as unknown as ExecutionContext

    it('should call the service getById with the provided input (without context)', async () => {
      const { resolver, mockService } = await createResolverFromNest(TestResolver)
      const id = 'id-1'
      const output: TestResolverDTO = {
        id,
        stringField: 'foo'
      }
      when(mockService.getById(id)).thenResolve(output)
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/naming-convention
      const result = await resolver.resolveReference({ __type: 'TestReference', id })
      return expect(result).toEqual(output)
    })

    it('should use DataLoader when context is provided', async () => {
      const { resolver, mockService } = await createResolverFromNest(TestResolver)
      const context = createContext()
      const id = 'id-1'
      const output: TestResolverDTO = {
        id,
        stringField: 'foo'
      }
      
      // Mock the query method for DataLoader with proper ts-mockito syntax
      when(mockService.query(anything())).thenResolve([output])
      
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/naming-convention
      const result = await resolver.resolveReference({ __type: 'TestReference', id }, context)
      return expect(result).toEqual(output)
    })

    it('should reject if the id is not found', async () => {
      const { resolver, mockService } = await createResolverFromNest(TestResolver)
      const id = 'id-1'
      const output: TestResolverDTO = {
        id,
        stringField: 'foo'
      }
      when(mockService.getById(id)).thenResolve(output)
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/naming-convention
      return expect(resolver.resolveReference({ __type: 'TestReference' })).rejects.toThrow(
        'Unable to resolve reference, missing required key id for TestResolverDTO'
      )
    })

    it('should reject if entity is not found when using DataLoader', async () => {
      const { resolver, mockService } = await createResolverFromNest(TestResolver)
      const context = createContext()
      const id = 'id-not-found'
      
      // Mock the query method to return empty array
      when(mockService.query(anything())).thenResolve([])
      
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/naming-convention
      return expect(resolver.resolveReference({ __type: 'TestReference', id }, context)).rejects.toThrow(
        'Unable to find TestResolverDTO with id: id-not-found'
      )
    })
  })
})
