import { ObjectType } from '@nestjs/graphql'
import { QueryService } from '@ptc-org/nestjs-query-core'
import { anything, instance, mock, when } from 'ts-mockito'

import { ExportResolver, FilterableField } from '../../src'

jest.mock('csv-stringify/sync', () => {
  throw new Error('Cannot find module csv-stringify/sync')
})

describe('CSV export optional dependency', () => {
  it('loads the package and reports how to install csv-stringify when export is called', async () => {
    @ObjectType()
    class ExportDTO {
      @FilterableField()
      value!: string
    }

    const service = mock<QueryService<ExportDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ value: 'test' }])
    const resolver = new (ExportResolver(ExportDTO, { enabled: true }))(instance(service))

    await expect(resolver.exportMany({}, { fields: [{ field: 'value' }] })).rejects.toThrow(
      'csv-stringify is required for CSV export; install it with `npm install csv-stringify`'
    )
  })
})
