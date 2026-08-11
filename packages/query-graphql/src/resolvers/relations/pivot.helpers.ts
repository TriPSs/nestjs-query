import {
  AssemblerFactory,
  AssemblerQueryService,
  Class,
  Filter,
  getAssemblers,
  QueryService,
  SelectRelation
} from '@ptc-org/nestjs-query-core'

import { DTONames } from '../../common'
import { findPivotPair, getIDField, getPivotMapping, PivotEnd } from '../../decorators'
import { PivotRelationOption, PivotRelationOpts, PivotTypeFunc } from './relations.interface'

export { DEFAULT_PIVOT_FIELD_NAME } from '../../types'

/**
 * How one end of the relationship is found on the pivot.
 */
export interface PivotEndKey {
  /** The field of the pivot entity identifying this end. */
  key: string
  /** Set when {@link key} points at a relation, naming the field of it holding the id. */
  reference?: string
  /** The field of the DTO at this end holding the id the key points at. */
  idField: string
}

/**
 * A pivot with everything resolved: no inference is left for the runtime to do.
 */
export interface ResolvedPivot<Pivot> {
  DTO: Class<Pivot>
  /** The class the `QueryService` of the pivot is registered under. */
  ServiceClass: Class<unknown>
  /** Set when the service speaks the entity's shape, so results need assembling. */
  EntityClass?: Class<unknown>
  parent: PivotEndKey
  node: PivotEndKey
  fieldName?: string
  description?: string
  enableFilter?: boolean
  enableUpdate?: boolean
  omitFields?: string[]
}

/**
 * Whether the relation declared its pivot as the bare type function shorthand, rather than as options.
 */
const isPivotTypeFunc = <Pivot>(pivot: PivotRelationOption<Pivot>): pivot is PivotTypeFunc<Pivot> => typeof pivot === 'function'

/**
 * Whether the pivot type is the class itself rather than a function returning it, which is how
 * circular imports between the pivot and the types it ties are broken.
 */
const isClass = <Pivot>(DTO: Class<Pivot> | PivotTypeFunc<Pivot>): DTO is Class<Pivot> => 'prototype' in DTO

/**
 * The entity a pivot DTO is assembled from, when an `@Assembler` was declared for it.
 */
const getAssembledEntity = <Pivot>(PivotDTO: Class<Pivot>): Class<unknown> | undefined => {
  const assemblers = getAssemblers(PivotDTO)
  const entities = assemblers ? [...assemblers.keys()] : []

  // Only unambiguous when the DTO is assembled from exactly one entity.
  return entities.length === 1 ? entities[0] : undefined
}

/**
 * Pairs a declared pivot end with the id field of the DTO sitting at that end.
 */
const toEndKey = (end: PivotEnd, DTOClass: Class<unknown>): PivotEndKey => ({
  key: end.key,
  reference: end.reference,
  idField: getIDField(DTOClass)?.propertyName ?? 'id'
})

/**
 * What the pivot declares it ties, in words, so a mapping that does not cover the relation can say
 * what it does cover.
 */
const describeMapping = <Pivot>(PivotDTO: Class<Pivot>): string => {
  const pairs = getPivotMapping(PivotDTO)

  if (!pairs?.length) {
    return `${PivotDTO.name} declares no @PivotMapping`
  }

  return `${PivotDTO.name} maps ${pairs.map(([a, b]) => `${a.DTO().name} <-> ${b.DTO().name}`).join(', ')}`
}

/**
 * Fills in everything the relation did not spell out, from the pivot's own `@PivotMapping`.
 */
export const resolvePivot = <DTO, Relation, Pivot>(
  pivot: PivotRelationOption<Pivot>,
  DTOClass: Class<DTO>,
  RelationDTO: Class<Relation>,
  relationName: string
): ResolvedPivot<Pivot> => {
  const opts: PivotRelationOpts<Pivot> = isPivotTypeFunc(pivot) ? { DTO: pivot } : pivot
  const PivotDTO = isClass(opts.DTO) ? opts.DTO : opts.DTO()
  const EntityClass = opts.EntityClass ?? getAssembledEntity(PivotDTO)

  const pair = findPivotPair(PivotDTO, DTOClass, RelationDTO)

  if (!pair) {
    throw new Error(
      `Unable to resolve the pivot '${PivotDTO.name}' on the '${relationName}' relation of ${DTOClass.name}. ` +
        `${describeMapping(PivotDTO)}, which does not tie ${DTOClass.name} to ${RelationDTO.name}. ` +
        `Add the pair to @PivotMapping on ${PivotDTO.name}.`
    )
  }

  return {
    ...opts,
    DTO: PivotDTO,
    EntityClass,
    ServiceClass: EntityClass ?? PivotDTO,
    parent: toEndKey(pair.parent, DTOClass),
    node: toEndKey(pair.node, RelationDTO)
  }
}

/**
 * Reads the pivot `QueryService` that was injected into the resolver under a generated key.
 *
 * When the pivot is backed by an entity the service speaks the entity's shape, so it is wrapped in
 * an assembler to keep the resolver working with the DTO.
 */
export const getPivotService = <Pivot>(
  resolver: object,
  key: string,
  pivot: ResolvedPivot<Pivot>
): QueryService<Pivot, unknown, unknown> => {
  const service = (resolver as Record<string, QueryService<unknown, unknown, unknown>>)[key]

  if (!pivot.EntityClass) {
    return service as QueryService<Pivot, unknown, unknown>
  }

  return new AssemblerQueryService(
    AssemblerFactory.getAssembler<Pivot, unknown, unknown, unknown, unknown, unknown>(pivot.DTO, pivot.EntityClass),
    service
  )
}

/**
 * Name of the graphql input holding the writable properties of a pivot record.
 *
 * e.g. `UserGroupProperties` for the `groups` relation of `User`.
 */
export const pivotPropertiesTypeName = (dtoNames: DTONames, relationNames: DTONames): string =>
  `${dtoNames.baseName}${relationNames.baseName}Properties`

/**
 * Fields of the pivot record that are not writable: the keys identifying the relationship, the id of
 * the pivot record itself, and anything the user asked to omit.
 *
 * The keys usually are not fields of the DTO at all, in which case omitting them is a no-op.
 */
export const pivotKeyFields = <Pivot>(pivot: ResolvedPivot<Pivot>): (keyof Pivot & string)[] => {
  const idField = getIDField(pivot.DTO)?.propertyName ?? 'id'
  const fields = [pivot.parent.key, pivot.node.key, idField, ...(pivot.omitFields ?? [])]

  return [...new Set(fields.filter((field): field is keyof Pivot & string => Boolean(field)))]
}

/**
 * `{ userId: { in: [...] } }`, or `{ user: { id: { in: [...] } } }` when the key is a relation.
 */
export const pivotEndFilter = <Pivot>(end: PivotEndKey, ids: unknown[]): Filter<Pivot> =>
  (end.reference ? { [end.key]: { [end.reference]: { in: ids } } } : { [end.key]: { in: ids } }) as Filter<Pivot>

/**
 * Filter matching the pivot records tying `parentIds` to `nodeIds`.
 */
export const getPivotFilter = <Pivot>(pivot: ResolvedPivot<Pivot>, parentIds: unknown[], nodeIds: unknown[]): Filter<Pivot> =>
  ({
    and: [pivotEndFilter(pivot.parent, parentIds), pivotEndFilter(pivot.node, nodeIds)]
  }) as Filter<Pivot>

/**
 * The relations a pivot query has to select for {@link pivotEndId} to find the ids.
 *
 * A relation referenced only by a filter is joined without being selected, so an end pointing at one
 * would come back missing unless it is asked for explicitly.
 */
export const pivotSelectRelations = <Pivot>(pivot: ResolvedPivot<Pivot>): SelectRelation<Pivot>[] | undefined => {
  const relations = [pivot.parent, pivot.node]
    .filter((end) => Boolean(end.reference))
    .map((end) => ({ name: end.key, query: {} }) as SelectRelation<Pivot>)

  // Left out entirely when the ends are plain keys, so the query stays as it was.
  return relations.length ? relations : undefined
}

/**
 * The id a pivot record carries for one end, whether the key holds it directly or through a relation.
 */
export const pivotEndId = <Pivot>(pivot: Pivot, end: PivotEndKey): unknown => {
  const value = (pivot as Record<string, unknown>)[end.key]

  if (end.reference && value && typeof value === 'object') {
    return (value as Record<string, unknown>)[end.reference]
  }

  return value
}
