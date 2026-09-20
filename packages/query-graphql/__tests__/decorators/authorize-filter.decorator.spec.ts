import { ExecutionContext } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { instance, mock, when } from 'ts-mockito'

import { OperationGroup } from '../../src/auth'
import { AuthorizerFilter } from '../../src/decorators'

describe('AuthorizerFilter', () => {
  it.each([undefined, false, true])('infers readonly for EXPORT and respects override %s', async (readonly) => {
    class Resolver {
      exportMany(
        @AuthorizerFilter({ operationGroup: OperationGroup.EXPORT, many: true, ...(readonly === undefined ? {} : { readonly }) })
        filter: unknown
      ): unknown {
        return filter
      }
    }

    const authorize = jest.fn().mockResolvedValue({ id: { eq: 'allowed' } })
    const context = { authorizer: { authorize } }
    const executionContext = mock<ExecutionContext>()
    when(executionContext.getArgs()).thenReturn([undefined, {}, context, undefined])
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Resolver, 'exportMany') as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => unknown }
    >

    await expect(Object.values(metadata)[0].factory(undefined, instance(executionContext))).resolves.toEqual({
      id: { eq: 'allowed' }
    })
    expect(authorize).toHaveBeenCalledWith(context, {
      operationName: 'exportMany',
      operationGroup: OperationGroup.EXPORT,
      many: true,
      readonly: readonly ?? true
    })
  })
})
