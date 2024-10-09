import { Query } from './query.interface'

export interface SelectRelation<DTO> {
  name: string
  query: Query<DTO>
}

export interface SelectRelations<DTO> {
  /**
   * Select relations when doing the database query
   */
  relations?: SelectRelation<DTO>[]
}
