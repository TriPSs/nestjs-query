import { areSubscriptionsEnabled } from '../../src/decorators/resolver-subscription.decorator'

describe('areSubscriptionsEnabled', (): void => {
  it('should return false with no options', (): void => {
    expect(areSubscriptionsEnabled([])).toBe(false)
  })

  it('should return true when the top level option enables subscriptions', (): void => {
    expect(areSubscriptionsEnabled([{ enableSubscriptions: true }])).toBe(true)
  })

  it('should let the last defined option win', (): void => {
    expect(areSubscriptionsEnabled([{ enableSubscriptions: true }, { enableSubscriptions: false }])).toBe(false)
    expect(areSubscriptionsEnabled([{ enableSubscriptions: false }, { enableSubscriptions: true }])).toBe(true)
  })

  it('should fall back to the common option when the method option does not define one', (): void => {
    expect(areSubscriptionsEnabled([{ enableSubscriptions: true }, {}])).toBe(true)
    expect(areSubscriptionsEnabled([{ enableSubscriptions: false }, { interceptors: [] }])).toBe(false)
  })
})
