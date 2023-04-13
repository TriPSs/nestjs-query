import { Filterable } from './filterable.interface'
import { SelectRelations } from './select-relation.interface'
import { WithDeleted } from './with-deleted.interface'

export interface FindByIdOptions<DTO> extends Filterable<DTO>, SelectRelations<DTO>, WithDeleted {}
