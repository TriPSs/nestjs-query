import { Class, getPrototypeChain, MetaValue, ValueReflector } from '@ptc-org/nestjs-query-core'

import { PIVOT_MAPPING_KEY } from './constants'

const reflector = new ValueReflector(PIVOT_MAPPING_KEY)

export type PivotEndTypeFunc = () => Class<unknown>

/**
 * One end of a relationship a pivot record ties together.
 */
export interface PivotEnd {
  /**
   * The type at this end of the relationship.
   */
  DTO: PivotEndTypeFunc
  /**
   * The field of the pivot **entity** identifying this end.
   *
   * Usually the foreign key (`userId`), but it can be the relation itself (`user`) - set
   * {@link reference} to say which of its fields carries the id.
   *
   * The field belongs to the entity, not to the DTO: keys are how the relationship is stored, not
   * something the pivot has to expose.
   */
  key: string
  /**
   * Set when {@link key} points at a relation rather than at the key itself, naming the field of
   * that relation holding the id.
   * [Default=undefined, i.e. `key` holds the id]
   */
  reference?: string
}

/**
 * A relationship the pivot can tie: the two ends it sits between.
 */
export type PivotPair = [PivotEnd, PivotEnd]

/**
 * Declares which relationships a pivot record ties together.
 *
 * The pivot is the one that knows what it joins, so it is declared here rather than repeated on
 * every relation pointing at it. It takes a list, because the same pivot may tie more than one pair
 * of types - a relationship table in a graph database being the usual case.
 *
 * @example
 *
 * ```ts
 * @ObjectType('Membership')
 * @PivotMapping([
 *   [{ DTO: () => UserDTO, key: 'userId' }, { DTO: () => GroupDTO, key: 'groupId' }]
 * ])
 * export class MembershipDTO {
 *   @FilterableField({ nullable: true })
 *   role?: string
 * }
 * ```
 */
export function PivotMapping(pairs: PivotPair[]) {
  return <Cls extends Class<unknown>>(PivotClass: Cls): Cls | void => {
    reflector.set(PivotClass, pairs)
    return PivotClass
  }
}

export function getPivotMapping<Pivot>(PivotClass: Class<Pivot>): MetaValue<PivotPair[]> {
  return getPrototypeChain(PivotClass).reduce<MetaValue<PivotPair[]>>(
    (mapping, Cls) => mapping ?? reflector.get<unknown, PivotPair[]>(Cls),
    undefined
  )
}

/**
 * The pair tying `Parent` to `Node`, in whichever order it was declared.
 */
export function findPivotPair<Pivot>(
  PivotClass: Class<Pivot>,
  ParentClass: Class<unknown>,
  NodeClass: Class<unknown>
): { parent: PivotEnd; node: PivotEnd } | undefined {
  const pairs = getPivotMapping(PivotClass) ?? []

  for (const [left, right] of pairs) {
    if (left.DTO() === ParentClass && right.DTO() === NodeClass) {
      return { parent: left, node: right }
    }
    if (right.DTO() === ParentClass && left.DTO() === NodeClass) {
      return { parent: right, node: left }
    }
  }

  return undefined
}
