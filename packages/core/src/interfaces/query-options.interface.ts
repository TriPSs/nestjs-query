import { WithDeleted } from './with-deleted.interface'
import { WithResolveInfo } from './with-resolve-info.interface'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface QueryOptions<DTO> extends WithDeleted, WithResolveInfo<DTO> {}
