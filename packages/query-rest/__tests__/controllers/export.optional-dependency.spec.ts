import { QueryService } from '@ptc-org/nestjs-query-core'
import { Expose } from 'class-transformer'
import { anything, instance, mock, when } from 'ts-mockito'

import { ExportController } from '../../src'

jest.mock('csv-stringify/sync', () => {
  throw new Error('Cannot find module csv-stringify/sync')
})

describe('CSV export optional dependency', () => {
  it('loads the package and reports how to install csv-stringify when export is called', async () => {
    class ExportDTO {
      @Expose()
      value!: string
    }

    const service = mock<QueryService<ExportDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ value: 'test' }])
    const controller = new (ExportController(ExportDTO))(instance(service))

    await expect(controller.exportMany({})).rejects.toThrow(
      'csv-stringify is required for CSV export; install it with `npm install csv-stringify`'
    )
  })
})
