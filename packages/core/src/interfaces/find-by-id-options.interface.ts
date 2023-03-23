import { Filterable } from './filterable.interface'
import { WithDeleted } from './with-deleted.interface'
import { SelectRelations } from './select-relation.interface'

export interface FindByIdOptions<DTO> extends Filterable<DTO>, SelectRelations<DTO>, WithDeleted {
}
