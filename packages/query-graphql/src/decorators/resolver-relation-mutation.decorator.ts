import { applyDecorators } from '@nestjs/common'
import { Mutation, MutationOptions, ReturnTypeFunc } from '@nestjs/graphql'

import { isEnabled, ResolverMethod, ResolverRelationMethodOpts } from './resolver-method.decorator'

/**
 * @internal
 * Decorator for a graphql `mutation` endpoint.
 * @param typeFunc - A function that returns the return type for the mutation.
 * @param options - `@nestjs/graphql` options to apply to the mutation.
 * @param opts -  [[ResolverRelationMethodOpts]] to apply to the mutation
 */
export function ResolverRelationMutation(
  typeFunc: ReturnTypeFunc,
  options?: MutationOptions,
  ...opts: ResolverRelationMethodOpts[]
): MethodDecorator {
  if (!isEnabled(opts)) {
    return (): void => {}
  }
  return applyDecorators(Mutation(typeFunc, options), ResolverMethod(...opts))
}
