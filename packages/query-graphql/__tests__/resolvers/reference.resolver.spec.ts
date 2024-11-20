import { Query, Resolver } from '@nestjs/graphql';
import { ReferenceResolver, ReferenceResolverOpts } from '@rezonate/nestjs-query-graphql';
import { when } from 'ts-mockito';

import { createResolverFromNest, generateSchema, TestResolverDTO } from '../__fixtures__';

@Resolver(() => TestResolverDTO)
class TestResolver extends ReferenceResolver(TestResolverDTO, { key: 'id' }) {
}


describe('ReferenceResolver', () => {
  const expectResolverSDL = async (opts?: ReferenceResolverOpts) => {
    @Resolver(() => TestResolverDTO)
    class TestSDLResolver extends ReferenceResolver(TestResolverDTO, opts) {
      @Query(() => TestResolverDTO)
      test(): TestResolverDTO {
        return { id: '1', stringField: 'foo' };
      }
    }

    const schema = await generateSchema([TestSDLResolver]);
    expect(schema).toMatchSnapshot();
  };

  it('should create a new resolver with a resolveReference method', () => expectResolverSDL());

  it('should return the original resolver if key is not provided', () => {
    const TestReferenceResolver = ReferenceResolver(TestResolverDTO);
    return expect(TestReferenceResolver.prototype.resolveReference).toBeUndefined();
  });

  describe('#resolveReference', () => {
    it('should call the service getById with the provided input', async () => {
      const { resolver, mockService } = await createResolverFromNest(TestResolver);
      const id = 'id-1';
      const output: TestResolverDTO = {
        id,
        stringField: 'foo',
      };
      when(mockService.getById(id)).thenResolve(output);
	    // todo
      // const result = await resolver.resolveReference({ __type: 'TestReference', id });
      // return expect(result).toEqual(output);
    });

    it('should reject if the id is not found', async () => {
      const { resolver, mockService } = await createResolverFromNest(TestResolver);
      const id = 'id-1';
      const output: TestResolverDTO = {
        id,
        stringField: 'foo',
      };
      when(mockService.getById(id)).thenResolve(output);
	    // todo
      // return expect(resolver.resolveReference({ __type: 'TestReference' })).rejects.toThrow(
      //   'Unable to resolve reference, missing required key id for TestResolverDTO',
      // );
    });
  });
});
