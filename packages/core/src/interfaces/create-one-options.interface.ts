import { Filterable } from './filterable.interface'

/**
 * Options for create one operations.
 *
 * The filter is an additional filter applied to the input dto before creation. This could be used to apply an
 * additional filter to ensure that the entity being created belongs to a particular user.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CreateOneOptions<DTO> extends Filterable<DTO> {}
