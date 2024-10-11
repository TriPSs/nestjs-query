import { Query } from './query.interface'

export type QueryResolveFields<DTO> = {
  [key in keyof DTO]: QueryResolveTree<
    // If the key is a array get the type of the array
    DTO[key] extends ArrayLike<unknown> ? DTO[key][number] : DTO[key]
  >
}

export interface QueryResolveTree<DTO> {
  name: string
  alias: string
  args?: Query<DTO>
  fields: QueryResolveFields<DTO>
}
