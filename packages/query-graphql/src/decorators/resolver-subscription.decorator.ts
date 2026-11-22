import { applyDecorators } from '@nestjs/common'
import { ReturnTypeFunc, Subscription, SubscriptionOptions } from '@nestjs/graphql'

import { ResolverMethod, ResolverMethodOpts } from './resolver-method.decorator'

export interface SubscriptionResolverMethodOpts extends ResolverMethodOpts {
  enableSubscriptions?: boolean
}

export function areSubscriptionsEnabled(opts: SubscriptionResolverMethodOpts[]): boolean {
  // last defined option wins, matching the `??`-based per-method overrides in the resolvers
  const lastDefined = [...opts].reverse().find((o) => o.enableSubscriptions !== undefined)
  return !!lastDefined?.enableSubscriptions
}

export function ResolverSubscription(
  typeFunc: ReturnTypeFunc,
  options?: SubscriptionOptions,
  ...opts: SubscriptionResolverMethodOpts[]
): MethodDecorator {
  if (!areSubscriptionsEnabled(opts)) {
    return (): void => {}
  }
  return applyDecorators(Subscription(typeFunc, options), ResolverMethod(...opts))
}
