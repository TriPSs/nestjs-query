import { Complexity, FieldOptions } from '@nestjs/graphql'
import { Class } from '@souagrosolucoes/nestjs-query-core'

import { AuthorizerOptions } from '../../auth'
import { DTONamesOpts } from '../../common'
import { ResolverMethodOpts } from '../../decorators'
import { ResolverRelationMethodOpts } from '../../decorators/resolver-method.decorator'
import { ConnectionOptions, QueryArgsTypeOpts } from '../../types'

export type ReferencesKeys<DTO, Reference> = {
  [F in keyof Reference]?: keyof DTO
}

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

  auth?: AuthorizerOptions<Relation>
} & DTONamesOpts &
  ResolverMethodOpts &
  QueryArgsTypeOpts<Relation> &
  Pick<ConnectionOptions, 'enableTotalCount'> &
  Omit<FieldOptions, 'name' | 'description' | 'middleware'>

export type RelationTypeMap<RT> = Record<string, RT>

export type ResolverOneRelation<Relation> = Omit<
  ResolverRelation<Relation>,
  'disableFilter' | 'disableSort' | 'enableAggregate' | 'aggregate'
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
