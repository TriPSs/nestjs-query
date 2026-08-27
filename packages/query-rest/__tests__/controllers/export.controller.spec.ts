import { QueryService } from '@ptc-org/nestjs-query-core'
import { Expose } from 'class-transformer'
import { anything, instance, mock, verify, when } from 'ts-mockito'

import { CRUDControllerOpts } from '../../src/controllers/crud.controller'
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

  it('projects items through a distinct export DTO', () => {
    class ItemDTO {
      id!: number

      title!: string

      completed!: boolean
    }

    class ItemExportDTO {
      @Expose()
      title!: string
    }

    const opts: CRUDControllerOpts<ItemDTO> = { export: { ExportDTOClass: ItemExportDTO } }

    expect(opts.export?.ExportDTOClass).toBe(ItemExportDTO)
    expect(stringifyExportCsv(ItemExportDTO, [{ id: 1, title: 'Write REST documentation', completed: false }])).toBe(
      '"title"\n"Write REST documentation"\n'
    )
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

  it('serializes with the ExportDTOClass when one is provided', async () => {
    class ItemDTO {
      @Expose()
      id!: number

      @Expose()
      title!: string

      @Expose()
      completed!: boolean
    }

    class ItemExportDTO {
      @Expose()
      title!: string
    }

    const service = mock<QueryService<ItemDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ id: 1, title: 'Write REST documentation', completed: false }])
    const controller = new (ExportController(ItemDTO, { ExportDTOClass: ItemExportDTO }))(instance(service))

    // only `title` is emitted -- `id` and `completed` come from ItemDTO and must be projected away
    await expect(controller.exportMany({})).resolves.toBe('"title"\n"Write REST documentation"\n')
  })

  it('serializes with every DTO field when no ExportDTOClass is provided', async () => {
    class ItemDTO {
      @Expose()
      id!: number

      @Expose()
      title!: string
    }

    const service = mock<QueryService<ItemDTO>>()
    when(service.exportMany(anything(), anything())).thenResolve([{ id: 1, title: 'Write REST documentation' }])
    const controller = new (ExportController(ItemDTO))(instance(service))

    await expect(controller.exportMany({})).resolves.toBe('"id","title"\n1,"Write REST documentation"\n')
  })
})
