import { Filterable } from './filterable.interface'
import { SelectRelation } from './select-relation.interface'

export interface FindByIdOptions<DTO> extends Filterable<DTO> {
  /**
   * Allow also deleted records to be retrieved
   */
  withDeleted?: boolean
  selectRelations?: SelectRelation<DTO>[]
}
