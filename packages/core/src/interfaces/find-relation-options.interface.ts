import { Filterable } from './filterable.interface'
import { WithDeleted } from './with-deleted.interface'
import { WithResolveInfo } from './with-resolve-info.interface'

export interface FindRelationOptions<Relation> extends Filterable<Relation>, WithResolveInfo<Relation>, WithDeleted {
  /**
   * Relation is looked ahead
   */
  lookedAhead?: boolean
}
