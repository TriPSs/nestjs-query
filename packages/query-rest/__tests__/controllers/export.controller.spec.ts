import { Expose } from 'class-transformer'

import { stringifyExportCsv } from '../../src/controllers/export.controller'

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
