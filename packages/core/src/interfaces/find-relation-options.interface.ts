import { Filterable } from './filterable.interface'

export interface FindRelationOptions<Relation> extends Filterable<Relation> {
  /**
   * Allow also deleted records to be retrieved
   */
  withDeleted?: boolean
  /**
   * Relation is looked ahead
   */
  lookedAhead?: boolean
}
