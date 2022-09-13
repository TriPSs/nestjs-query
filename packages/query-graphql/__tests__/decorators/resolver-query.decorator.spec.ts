/* eslint-disable @typescript-eslint/no-unused-vars */
import * as nestGraphql from '@nestjs/graphql';
import { QueryOptions, ReturnTypeFunc, Query } from '@nestjs/graphql';
import { Class } from '@rezonapp/nestjs-query-core';
import * as resolverDecorator from '../../src/decorators/resolver-method.decorator';
import { ResolverQuery } from '../../src/decorators';

jest.mock('@nestjs/graphql', () => ({
  ResolverQuery: jest.fn(() => () => null),
  Query: jest.fn(() => () => null)
}));
const mockedQuery = jest.mocked(Query);

describe('ResolverQuery decorator', (): void => {
  const resolverMethodSpy = jest.spyOn(resolverDecorator, 'ResolverMethod');

  beforeEach(() => jest.clearAllMocks());

  function createTestResolver(
    typeFunc: ReturnTypeFunc,
    options?: QueryOptions,
    ...opts: resolverDecorator.ResolverMethodOpts[]
  ): Class<unknown> {
    class TestResolver {
      @ResolverQuery(typeFunc, options, ...opts)
      method(): boolean {
        return true;
      }
    }
    return TestResolver;
  }

  it('should call Query with the correct mutation arguments', () => {
    const opts: resolverDecorator.ResolverMethodOpts[] = [{}];
    createTestResolver(() => Boolean, { name: 'test' }, ...opts);

    const [rt, ao] = mockedQuery.mock.calls[0]!;
    expect(rt()).toEqual(Boolean);
    expect(ao).toEqual({ name: 'test' });
  });

  it('should call ResolverMethod with the correct options', () => {
    const opts: resolverDecorator.ResolverMethodOpts[] = [{}];
    createTestResolver(() => Boolean, { name: 'test' }, ...opts);
    expect(resolverMethodSpy).toHaveBeenNthCalledWith(1, ...opts);
  });

  it('should not call ResolverMethod if disabled is true', () => {
    const opts: resolverDecorator.ResolverMethodOpts[] = [{ disabled: true }];
    createTestResolver(() => Boolean, { name: 'test' }, ...opts);
    expect(mockedQuery).toHaveBeenCalledTimes(0);
    expect(resolverMethodSpy).toHaveBeenCalledTimes(0);
  });
});
