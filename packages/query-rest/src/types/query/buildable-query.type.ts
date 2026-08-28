import { RestQuery } from '../rest-query.type'

export interface BuildableQueryType<DTO> {
  buildQuery(): RestQuery<DTO>
}
