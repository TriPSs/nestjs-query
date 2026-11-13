import { AssemblerQueryService } from '../../src/services/assembler-query.service'
import { NoOpQueryService } from '../../src/services/noop-query.service'
import { ProxyQueryService } from '../../src/services/proxy-query.service'
import { QueryService } from '../../src/services/query.service'
import { RelationQueryService } from '../../src/services/relation-query.service'

/**
 * TypeScript lets an implementing method declare fewer parameters than the interface it satisfies, so a wrapper that
 * forgets to forward its trailing `opts` still type checks while silently dropping the caller's options. Assignability
 * will never catch that, so these types compare the parameter lists themselves: any method that declares fewer
 * parameters than `QueryService` surfaces as its own name, and naming it below fails the build.
 *
 * Two limits are worth knowing. TypeScript only exposes the last signature of an overload set, so a parameter dropped
 * from an earlier overload is invisible here, as is one dropped from an implementation signature while the overloads
 * keep it — the per-method forwarding tests cover that second case. And the wrappers are imported by path rather than
 * through the package barrel so that ts-jest busts its cache when one of them changes; imported through the barrel
 * this file keeps reporting a stale pass after a wrapper loses a parameter.
 */
type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never
}[keyof T]

type ArityOf<T, K extends keyof T> = T[K] extends (...args: infer Args) => unknown ? Args['length'] : never

type MethodsDroppingParameters<Impl, Iface> = {
  [K in MethodNames<Iface>]: K extends keyof Impl ? ([ArityOf<Iface, K>] extends [ArityOf<Impl, K & keyof Impl>] ? never : K) : K
}[MethodNames<Iface>]

type NoMethodDropsParameters<DroppingMethods extends never> = DroppingMethods

describe('QueryService implementations declare every interface parameter', () => {
  it('AssemblerQueryService', () => {
    const droppingMethods: NoMethodDropsParameters<
      MethodsDroppingParameters<AssemblerQueryService<unknown, unknown>, QueryService<unknown>>
    >[] = []

    expect(droppingMethods).toEqual([])
  })

  it('ProxyQueryService', () => {
    const droppingMethods: NoMethodDropsParameters<
      MethodsDroppingParameters<ProxyQueryService<unknown>, QueryService<unknown>>
    >[] = []

    expect(droppingMethods).toEqual([])
  })

  it('RelationQueryService', () => {
    const droppingMethods: NoMethodDropsParameters<
      MethodsDroppingParameters<RelationQueryService<unknown>, QueryService<unknown>>
    >[] = []

    expect(droppingMethods).toEqual([])
  })

  it('NoOpQueryService', () => {
    const droppingMethods: NoMethodDropsParameters<
      MethodsDroppingParameters<NoOpQueryService<unknown>, QueryService<unknown>>
    >[] = []

    expect(droppingMethods).toEqual([])
  })
})
