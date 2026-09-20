import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getQueryServiceToken, QueryService } from '@ptc-org/nestjs-query-core'
import { DataSource } from 'typeorm'

import { AppModule } from '../src/app.module'
import { MembershipDTO } from '../src/membership/dto/membership.dto'
import { refresh } from './fixtures'

/**
 * When a `@PivotMapping` end points at a relation (`key: 'user', reference: 'id'`) instead of at the
 * foreign key, the loaders have to select that relation - otherwise the id cannot be read back.
 */
describe('pivot ends pointing at relations (pivot-relations - e2e)', () => {
  let app: INestApplication
  let service: QueryService<MembershipDTO, unknown, unknown>

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    await refresh(app.get(DataSource))
    service = app.get(getQueryServiceToken(MembershipDTO))
  })

  afterAll(async () => {
    await refresh(app.get(DataSource))
    await app.close()
  })

  it('should hydrate the referenced relations so the ids can be read back', async () => {
    // Exactly what PivotRelationsLoader issues for a relation-keyed mapping.
    const rows = await service.query({
      filter: { and: [{ user: { id: { in: [1] } } }, { group: { id: { in: [1, 2] } } }] } as never,
      relations: [
        { name: 'user', query: {} },
        { name: 'group', query: {} }
      ] as never
    })

    expect(rows).toHaveLength(2)
    // Without selecting the relations these come back undefined, and every edge misses its pivot.
    rows.forEach((row) => {
      expect((row as unknown as { user?: { id: number } }).user?.id).toBe(1)
      expect((row as unknown as { group?: { id: number } }).group?.id).toBeDefined()
    })
  })

  it('should come back without the relations when they are not selected', async () => {
    const rows = await service.query({
      filter: { and: [{ user: { id: { in: [1] } } }] } as never
    })

    expect(rows.length).toBeGreaterThan(0)
    // This is the regression the loaders guard against by passing `relations`.
    expect((rows[0] as unknown as { user?: { id: number } }).user).toBeUndefined()
  })
})
