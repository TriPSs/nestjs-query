import { Complexity, FieldOptions } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'

import { AuthorizerOptions } from '../../auth'
import { DTONamesOpts } from '../../common'
import { ResolverMethodOpts } from '../../decorators'
import { ResolverRelationMethodOpts } from '../../decorators/resolver-method.decorator'
import { ConnectionOptions, EdgePivotOptions, QueryArgsTypeOpts } from '../../types'

export type ReferencesKeys<DTO, Reference> = {
  [F in keyof Reference]?: keyof DTO
}

export type PivotTypeFunc<Pivot> = () => Class<Pivot>

/**
 * Options to expose the properties of the pivot (a.k.a. join/through) record of a many relation.
 *
 * Given `User -\> Membership -\> Group`, the pivot is `Membership` and its properties are exposed on
 * the edges of the `groups` connection.
 *
 * Only the pivot type is required: how it ties the two ends together comes from the `@PivotMapping`
 * declared on the pivot itself.
 */
export interface PivotRelationOpts<Pivot> extends Omit<EdgePivotOptions<Pivot>, 'DTO'> {
  /**
   * The class type of the pivot record.
   */
  DTO: Class<Pivot> | PivotTypeFunc<Pivot>
  /**
   * Additional fields of the pivot record that must not be writable.
   *
   * The keys of the relationship and the id of the pivot record are always omitted.
   */
  omitFields?: (keyof Pivot & string)[]
  /**
   * The entity backing the pivot DTO.
   *
   * Only needed as an escape hatch: the `QueryService` is looked up by the entity of the registered
   * assembler, falling back to the pivot DTO itself.
   */
  EntityClass?: Class<unknown>
  /**
   * Enable mutations to write the pivot properties.
   */
  enableUpdate?: boolean
}

/**
 * The pivot type on its own, or the full options.
 */
export type PivotRelationOption<Pivot> = PivotRelationOpts<Pivot> | PivotTypeFunc<Pivot>

export interface ResolverRelationReference<DTO, Reference> extends DTONamesOpts, ResolverMethodOpts {
  /**
   * The class type of the relation.
   */
  DTO: Class<Reference>

  /**
   * Keys
   */
  keys: ReferencesKeys<DTO, Reference>

  /**
   * Set to true if the relation is nullable
   */
  nullable?: boolean

  complexity?: Complexity
}

export type ResolverRelation<Relation> = {
  /**
   * The class type of the relation.
   */
  DTO: Class<Relation>

  /**
   * The name of the relation to use when fetching from the QueryService
   */
  relationName?: string
  /**
   * Set to true if the relation is nullable
   */
  nullable?: boolean
  /**
   * Disable read relation graphql endpoints
   */
  disableRead?: boolean
  /**
   * Enable look ahead mode, will join and select the relation when queried.
   */
  enableLookAhead?: boolean
  /**
   * Indicates if soft-deleted rows should be included in relation result.
   */
  withDeleted?: boolean
  /**
   * Set to true if you should be able to filter on this relation.
   *
   * This will only work with relations defined through an ORM (typeorm or sequelize).
   */
  allowFiltering?: boolean

  /**
   * Description of the relation.
   */
  description?: string

  update?: Pick<ResolverRelation<Relation>, 'description'> & ResolverRelationMethodOpts
  remove?: Pick<ResolverRelation<Relation>, 'description'> & ResolverRelationMethodOpts
  /**
   * Enable aggregation queries.
   */
  enableAggregate?: boolean
  aggregate?: Pick<ResolverRelation<Relation>, 'description'> & ResolverRelationMethodOpts

  /**
   * Expose the properties of the pivot record on the edges of the relation.
   *
   * Accepts the pivot type on its own - `pivot: () =\> MembershipDTO` - or the full options.
   *
   * Only supported by the cursor paging strategy, since it is the only one that creates edges.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pivot?: PivotRelationOption<any>

  auth?: AuthorizerOptions<Relation>
} & DTONamesOpts &
  ResolverMethodOpts &
  QueryArgsTypeOpts<Relation> &
  Pick<ConnectionOptions, 'enableTotalCount'> &
  Omit<FieldOptions, 'name' | 'description' | 'middleware'>

export type RelationTypeMap<RT> = Record<string, RT>

export type ResolverOneRelation<Relation> = Omit<
  ResolverRelation<Relation>,
  'disableFilter' | 'disableSort' | 'enableAggregate' | 'aggregate' | 'pivot'
>
export type ResolverManyRelation<Relation> = Omit<ResolverRelation<Relation>, 'enableLookAhead'>

export type RelationsOpts<Relation = unknown> = {
  /**
   * All relations that are a single record
   */
  one?: RelationTypeMap<ResolverOneRelation<Relation>>
  /**
   * All relations that have multiple records
   */
  many?: RelationTypeMap<ResolverManyRelation<Relation>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReferencesOpts<DTO> = RelationTypeMap<ResolverRelationReference<DTO, any>>
