import { NullOrdering } from '@ptc-org/nestjs-query-core'

/**
 * @internal
 *
 * Dialects that place NULL below every other value.
 */
const DIALECTS_SORTING_NULLS_SMALLEST = ['mysql', 'mariadb', 'sqlite', 'mssql']

/**
 * @internal
 *
 * Dialects that place NULL above every other value.
 */
const DIALECTS_SORTING_NULLS_LARGEST = ['postgres', 'oracle']

/** @description Where the dialect places NULL when the order by does not ask for a placement, if we know. */
export function dialectNullOrdering(dialect?: string): NullOrdering | undefined {
  if (DIALECTS_SORTING_NULLS_SMALLEST.includes(dialect)) {
    return NullOrdering.NULLS_SMALLEST
  }
  if (DIALECTS_SORTING_NULLS_LARGEST.includes(dialect)) {
    return NullOrdering.NULLS_LARGEST
  }
  return undefined
}
