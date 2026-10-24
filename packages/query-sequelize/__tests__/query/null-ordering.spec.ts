import { NullOrdering } from '@ptc-org/nestjs-query-core'

import { dialectNullOrdering } from '../../src/query/null-ordering'

describe('dialectNullOrdering', (): void => {
  it.each(['mysql', 'mariadb', 'sqlite', 'mssql'])('should report nulls as the smallest value on %s', (dialect) => {
    expect(dialectNullOrdering(dialect)).toBe(NullOrdering.NULLS_SMALLEST)
  })

  it.each(['postgres', 'oracle'])('should report nulls as the largest value on %s', (dialect) => {
    expect(dialectNullOrdering(dialect)).toBe(NullOrdering.NULLS_LARGEST)
  })

  it.each(['db2', 'snowflake', undefined])('should not guess for %s', (dialect) => {
    expect(dialectNullOrdering(dialect)).toBeUndefined()
  })
})
