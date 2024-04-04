import { Filterable } from './filterable.interface'
import { SelectRelations } from './select-relation.interface'
import { WithDeleted } from './with-deleted.interface'
import { WithResolveInfo } from './with-resolve-info.interface'

export interface FindByIdOptions<DTO> extends Filterable<DTO>, SelectRelations<DTO>, WithDeleted, WithResolveInfo<DTO> {}
