import { QueryService } from '@ptc-org/nestjs-query-core'
import { Expose } from 'class-transformer'
import { anything, instance, mock, verify, when } from 'ts-mockito'

import { ExportController, stringifyExportCsv } from '../../src/controllers/export.controller'

jest.mock('@nestjs/swagger/dist/plugin/plugin-constants', () => ({
  METADATA_FACTORY_NAME: 'OPENAPI_METADATA_FACTORY'
}))

describe('stringifyExportCsv', () => {
  class ExportDTO {
    @Expose()
    value!: string
  }

  it.each(['=', '+', '-', '@', '\t', '\r', '\uFF1D', '\uFF0B'])('escapes values beginning with %j', (prefix) => {
    const value = `${prefix}formula()`

    expect(stringifyExportCsv(ExportDTO, [{ value }])).toContain(`"'${value}"`)
  })
})

describe('ExportController', () => {
  class ExportDTO {
    @Expose()
    value!: string
  }

  it('uses the query service exportMany method', async () => {
    const service = mock<QueryService<ExportDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ value: 'test' }])
    const controller = new (ExportController(ExportDTO))(instance(service))

    await expect(controller.exportMany({})).resolves.toBe('"value"\n"test"\n')

    verify(service.exportMany(anything(), anything())).once()
  })
})
