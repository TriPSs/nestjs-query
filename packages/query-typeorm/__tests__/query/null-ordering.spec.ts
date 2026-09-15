import { NullOrdering } from '@ptc-org/nestjs-query-core'

import { driverNullOrdering } from '../../src/query/null-ordering'

describe('driverNullOrdering', (): void => {
  it.each([
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
  ])('should report nulls as the smallest value on %s', (driver) => {
    expect(driverNullOrdering(driver)).toBe(NullOrdering.NULLS_SMALLEST)
  })

  it.each(['postgres', 'aurora-postgres', 'oracle'])('should report nulls as the largest value on %s', (driver) => {
    expect(driverNullOrdering(driver)).toBe(NullOrdering.NULLS_LARGEST)
  })

  it.each(['cockroachdb', 'mongodb', undefined])('should not guess for %s', (driver) => {
    expect(driverNullOrdering(driver)).toBeUndefined()
  })
})
