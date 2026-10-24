import { NullOrdering } from '@ptc-org/nestjs-query-core'

/**
 * @internal
 *
 * Drivers that place NULL below every other value, listed under each of the names typeorm gives them.
 */
const DRIVERS_SORTING_NULLS_SMALLEST = [
  'mysql',
  'mariadb',
  'aurora-mysql',
  'mssql',
  'sqlite',
  'better-sqlite3',
  'sqljs',
  'capacitor',
  'expo',
  'nativescript'
]

/**
 * @internal
 *
 * Drivers that place NULL above every other value.
 */
const DRIVERS_SORTING_NULLS_LARGEST = ['postgres', 'aurora-postgres', 'oracle']

/** @description Where the driver places NULL when the order by does not ask for a placement, if we know. */
export function driverNullOrdering(driver?: string): NullOrdering | undefined {
  if (DRIVERS_SORTING_NULLS_SMALLEST.includes(driver)) {
    return NullOrdering.NULLS_SMALLEST
  }
  if (DRIVERS_SORTING_NULLS_LARGEST.includes(driver)) {
    return NullOrdering.NULLS_LARGEST
  }
  return undefined
}
