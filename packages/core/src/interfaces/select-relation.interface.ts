import { Query } from './query.inteface'

export interface SelectRelation<DTO> {
  name: string
  query: Query<DTO>
}
