import { QueryService } from '@ptc-org/nestjs-query-core'
import { vi } from 'vitest'

import { CRUDController } from '../../src/controllers/crud.controller'
import { ReadController, ReadControllerOpts } from '../../src/controllers/read.controller'
import { IDField } from '../../src/decorators'

describe.each(['standalone', 'CRUD'] as const)('%s read controller', (kind) => {
  class TestDTO {
    @IDField(() => Number)
    id!: number
  }

  it.each([
    { label: 'omitted', relations: undefined },
    { label: 'empty', relations: [] },
    {
      label: 'nested',
      relations: [{ name: 'assignee', query: { relations: [{ name: 'team', query: {} }] } }]
    }
  ])('loads $label default relations alongside authorization and withDeleted', async ({ relations }) => {
    const read: ReadControllerOpts<TestDTO> = { one: { relations, withDeleted: true } }
    const ControllerClass = kind === 'standalone' ? ReadController(TestDTO, read) : CRUDController(TestDTO, { read })
    const result = { id: 7, assignee: { team: { name: 'Support' } } }
    const service = { getById: vi.fn().mockResolvedValue(result) }
    const controller = new ControllerClass(service as unknown as QueryService<TestDTO>)
    const filter = { id: { eq: 7 } }

    await expect(controller.findById({ id: 7, getId: () => 7 }, filter)).resolves.toBe(result)
    expect(service.getById).toHaveBeenCalledWith(7, { filter, relations, withDeleted: true })
  })
})
