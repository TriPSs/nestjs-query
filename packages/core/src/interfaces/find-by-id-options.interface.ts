import { Filterable } from './filterable.interface'
import { WithDeleted } from './with-deleted.interface'

export interface FindByIdOptions<DTO> extends Filterable<DTO>, WithDeleted {}
