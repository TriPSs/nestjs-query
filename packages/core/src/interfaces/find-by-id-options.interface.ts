import { Filterable } from './filterable.interface'
import { SelectRelations } from './select-relation.interface'

export interface FindByIdOptions<DTO> extends Filterable<DTO>, SelectRelations<DTO> {
  /**
   * Allow also deleted records to be retrieved
   */
  withDeleted?: boolean
}
