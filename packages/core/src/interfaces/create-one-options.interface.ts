import { Filter } from './filter.interface'

export interface CreateOneOptions<DTO> {
  /**
   * Additional filter applied to the input dto before creation. This could be used to apply an additional filter to ensure
   * that the entity being created belongs to a particular user.
   */
  filter?: Filter<DTO>
}
