import { BetterSqliteDriver } from '@mikro-orm/better-sqlite'
import { Entity, EntityRepository, MikroORM, Options, PrimaryKey, Property } from '@mikro-orm/core'
import { Filter } from '@ptc-org/nestjs-query-core'

import { MikroOrmQueryService } from '../../src'

/**
 * A pivot: two keys tying a relationship together, plus the data it carries.
 */
@Entity()
class Membership {
  @PrimaryKey()
  id!: string

  @Property()
  userId!: string

  @Property()
  groupId!: string

  @Property({ nullable: true })
  role?: string
}

const ROWS = [
  { id: 'm-1', userId: 'u-1', groupId: 'g-1', role: 'owner' },
  { id: 'm-2', userId: 'u-1', groupId: 'g-2', role: 'member' },
  { id: 'm-3', userId: 'u-2', groupId: 'g-2', role: 'member' },
  { id: 'm-4', userId: 'u-3', groupId: 'g-3', role: 'owner' }
]

/**
 * The pivot feature in `query-graphql` only ever calls the public `QueryService` API, so what it
 * needs from a provider is exactly this: resolve the composite filter its loaders build.
 *
 * These are the shapes produced by `getPivotFilter` and `pivotEndFilter`.
 */
describe('MikroOrmQueryService - pivot contract', () => {
  let orm: MikroORM<BetterSqliteDriver>
  let service: MikroOrmQueryService<Membership>

  const options: Options<BetterSqliteDriver> = {
    driver: BetterSqliteDriver,
    dbName: ':memory:',
    entities: [Membership],
    allowGlobalContext: true
  }

  beforeAll(async () => {
    orm = await MikroORM.init(options)
    await orm.getSchemaGenerator().createSchema()
  })

  afterAll(() => orm.close())

  beforeEach(async () => {
    const em = orm.em.fork()
    await em.nativeDelete(Membership, {})
    ROWS.forEach((row) => em.persist(em.create(Membership, row)))
    await em.flush()

    const repo: EntityRepository<Membership> = orm.em.fork().getRepository(Membership)
    service = new MikroOrmQueryService(repo)
  })

  describe('reading the properties', () => {
    it('should resolve the filter keyed by both ends of the relationship', async () => {
      const filter = {
        and: [{ userId: { in: ['u-1', 'u-2'] } }, { groupId: { in: ['g-1', 'g-2'] } }]
      } as Filter<Membership>

      const rows = await service.query({ filter })

      expect(rows.map((r) => r.id).sort()).toEqual(['m-1', 'm-2', 'm-3'])
    })

    it('should not leak rows of other parents', async () => {
      const filter = {
        and: [{ userId: { in: ['u-1'] } }, { groupId: { in: ['g-1', 'g-2', 'g-3'] } }]
      } as Filter<Membership>

      const rows = await service.query({ filter })

      expect(rows.map((r) => r.id).sort()).toEqual(['m-1', 'm-2'])
    })
  })

  describe('filtering by the properties', () => {
    it('should resolve the parent filter merged with a filter on the properties', async () => {
      const filter = { and: [{ userId: { in: ['u-1', 'u-2'] } }, { role: { eq: 'owner' } }] } as Filter<Membership>

      const rows = await service.query({ filter })

      expect(rows.map((r) => r.id)).toEqual(['m-1'])
    })
  })

  describe('writing the properties', () => {
    it('should not support updateMany yet', async () => {
      const filter = { and: [{ userId: { in: ['u-1'] } }, { groupId: { in: ['g-1'] } }] } as Filter<Membership>

      // `enableUpdate` writes through `updateMany`, which this provider does not implement.
      await expect(service.updateMany({ role: 'admin' }, filter)).rejects.toThrow('updateMany is not implemented')
    })
  })
})
