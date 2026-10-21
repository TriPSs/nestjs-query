import { SortDirection } from '@ptc-org/nestjs-query-core'
import {
  Column,
  DataSource,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  ValueTransformer
} from 'typeorm'

import { TypeOrmQueryService } from '../../src'

const bigIntTransformer: ValueTransformer = {
  to: (value?: bigint) => (value === undefined || value === null ? value : value.toString()),
  from: (value?: string) => (value === undefined || value === null ? value : BigInt(value))
}

const numberAsTextTransformer: ValueTransformer = {
  to: (value?: number) => (value === undefined || value === null ? value : String(value)),
  from: (value?: string) => (value === undefined || value === null ? value : Number(value))
}

const prefixedKeyTransformer: ValueTransformer = {
  to: (value?: number) => (value === undefined || value === null ? value : `key-${value}`),
  from: (value?: string) => (value === undefined || value === null ? value : Number(value.replace('key-', '')))
}

class ShelfKey {
  @PrimaryColumn()
  code!: string
}

@Entity('key_shelf')
class Shelf {
  @Column(() => ShelfKey)
  key!: ShelfKey

  @OneToMany('Book', 'shelf')
  books?: object[]
}

@Entity('key_book')
class Book {
  @PrimaryColumn()
  id!: string

  @ManyToOne(() => Shelf, (shelf) => shelf.books)
  @JoinColumn({ name: 'shelf_code' })
  shelf?: Shelf
}

@Entity('key_account')
class Account {
  @PrimaryColumn({ type: 'bigint', transformer: bigIntTransformer })
  id!: bigint

  @OneToMany('Ledger', 'account')
  ledgers?: object[]
}

@Entity('key_ledger')
class Ledger {
  @PrimaryColumn({ type: 'varchar', transformer: numberAsTextTransformer })
  id!: number

  @ManyToOne(() => Account, (account) => account.ledgers)
  account?: Account
}

@Entity('key_bin')
class Bin {
  @PrimaryColumn()
  id!: number

  @PrimaryColumn()
  active!: boolean

  @OneToMany('Item', 'bin')
  items?: object[]
}

@Entity('key_item')
class Item {
  @PrimaryColumn()
  id!: string

  @ManyToOne(() => Bin, (bin) => bin.items)
  @JoinColumn([
    { name: 'bin_id', referencedColumnName: 'id' },
    { name: 'bin_active', referencedColumnName: 'active' }
  ])
  bin?: Bin
}

@Entity('key_team')
class Team {
  @PrimaryColumn()
  id!: string

  @OneToMany('Player', 'team')
  players?: object[]
}

@Entity('key_player')
class Player {
  @PrimaryColumn()
  id!: string

  @Column({ select: false })
  teamId!: string

  @ManyToOne(() => Team, (team) => team.players)
  @JoinColumn({ name: 'teamId' })
  team?: Team
}

describe('TypeOrmQueryService batch relations keyed by values the driver does not return as hydrated', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Shelf, Book, Account, Ledger, Bin, Item, Team, Player],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(Shelf).save([{ key: { code: 'shelf-1' } }, { key: { code: 'shelf-2' } }])
    await dataSource.getRepository(Book).save([
      { id: 'book-1', shelf: { key: { code: 'shelf-1' } } },
      { id: 'book-2', shelf: { key: { code: 'shelf-2' } } }
    ] as Book[])
    await dataSource.getRepository(Account).save([{ id: BigInt(1) }, { id: BigInt(2) }])
    await dataSource.getRepository(Ledger).save([
      { id: 10, account: { id: BigInt(1) } },
      { id: 20, account: { id: BigInt(2) } }
    ] as Ledger[])
    await dataSource.getRepository(Bin).save([
      { id: 1, active: true },
      { id: 1, active: false }
    ])
    await dataSource.getRepository(Item).save([
      { id: 'item-1', bin: { id: 1, active: true } },
      { id: 'item-2', bin: { id: 1, active: false } }
    ] as Item[])
    await dataSource.getRepository(Team).save([{ id: 'team-1' }, { id: 'team-2' }])
    await dataSource.getRepository(Player).save([
      { id: 'player-1', teamId: 'team-1' },
      { id: 'player-2', teamId: 'team-2' }
    ])
  })

  afterAll(() => dataSource.destroy())

  it('should not give an owner the relation of another owner when the relation key is embedded', async () => {
    const books = await dataSource.getRepository(Book).find({ order: { id: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Book))

    const shelves = await queryService.findRelation(Shelf, 'shelf', books)

    expect(books.map((book) => shelves.get(book)?.key.code)).toEqual(['shelf-1', 'shelf-2'])
  })

  it('should match owners whose key a transformer hydrates to a bigint', async () => {
    const accounts = await dataSource.getRepository(Account).find({ order: { id: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Account))

    const ledgers = await queryService.queryRelations(Ledger, 'ledgers', accounts, {})

    expect(accounts.map((account) => ledgers.get(account).map(({ id }) => id))).toEqual([[10], [20]])
  })

  it('should match relations whose key a transformer hydrates to another type', async () => {
    const ledgers = await dataSource.getRepository(Ledger).find({ order: { id: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Ledger))

    const accounts = await queryService.findRelation(Account, 'account', ledgers)

    expect(ledgers.map((ledger) => accounts.get(ledger)?.id)).toEqual([BigInt(1), BigInt(2)])
  })

  it('should match owners whose composite key has a boolean the driver returns as a number', async () => {
    const bins = await dataSource.getRepository(Bin).find({ order: { active: 'DESC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Bin))

    const items = await queryService.queryRelations(Item, 'items', bins, {})

    expect(bins.map((bin) => items.get(bin).map(({ id }) => id))).toEqual([['item-1'], ['item-2']])
  })

  it('should match owners through a foreign key that is not selected by default, without selecting it', async () => {
    const teams = await dataSource.getRepository(Team).find({ order: { id: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Team))

    const players = await queryService.queryRelations(Player, 'players', teams, {})

    expect(teams.map((team) => players.get(team).map(({ id }) => id))).toEqual([['player-1'], ['player-2']])
    expect(players.get(teams[0])[0].teamId).toBeUndefined()
  })
})

@Entity('key_crate')
class Crate {
  @PrimaryColumn()
  id!: string

  @ManyToOne(() => Bin)
  @JoinColumn([
    { name: 'bin_id', referencedColumnName: 'id' },
    { name: 'bin_active', referencedColumnName: 'active' }
  ])
  bin?: Bin
}

describe('TypeOrmQueryService many-to-one relations with a composite foreign key', () => {
  let dataSource: DataSource
  let crates: Crate[]

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Bin, Item, Crate],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(Bin).save([
      { id: 1, active: true },
      { id: 1, active: false },
      { id: 2, active: true }
    ])
    crates = await dataSource.getRepository(Crate).save([
      { id: 'crate-1', bin: { id: 1, active: false } },
      { id: 'crate-2', bin: { id: 2, active: true } }
    ] as Crate[])
  })

  afterAll(() => dataSource.destroy())

  const binKey = (bin?: Bin) => (bin ? `${bin.id}-${String(bin.active)}` : undefined)

  it('should find the relation of a single entity by every foreign key column', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Crate))

    const bins = await Promise.all(crates.map((crate) => queryService.findRelation(Bin, 'bin', crate)))

    expect(bins.map(binKey)).toEqual(['1-false', '2-true'])
  })

  it('should find the relations of many entities by every foreign key column', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Crate))

    const bins = await queryService.findRelation(Bin, 'bin', crates)

    expect(crates.map((crate) => binKey(bins.get(crate)))).toEqual(['1-false', '2-true'])
  })
})

class SeatPart {
  @PrimaryColumn()
  id!: string
}

@Entity('key_venue')
class Venue {
  @PrimaryColumn()
  id!: string
}

@Entity('key_seat')
class Seat {
  @Column(() => SeatPart)
  row!: SeatPart

  @Column(() => SeatPart)
  column!: SeatPart

  @ManyToOne(() => Venue)
  @JoinColumn({ name: 'venue_id' })
  venue?: Venue
}

describe('TypeOrmQueryService batch relations of owners keyed by embedded columns sharing a property name', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Venue, Seat],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(Venue).save([{ id: 'venue-1' }, { id: 'venue-2' }])
    await dataSource.getRepository(Seat).save([
      { row: { id: 'a' }, column: { id: 'b' }, venue: { id: 'venue-1' } },
      { row: { id: 'b' }, column: { id: 'a' }, venue: { id: 'venue-2' } }
    ] as Seat[])
  })

  afterAll(() => dataSource.destroy())

  it('should match each owner by every column of its key', async () => {
    const seats = await dataSource.getRepository(Seat).find({ order: { row: { id: 'ASC' } } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Seat))

    const venues = await queryService.findRelation(Venue, 'venue', seats)

    expect(seats.map((seat) => venues.get(seat)?.id)).toEqual(['venue-1', 'venue-2'])
  })
})

@Entity('key_drawer')
class Drawer {
  @PrimaryColumn({ type: 'varchar', transformer: prefixedKeyTransformer })
  id!: number

  @OneToMany('Sock', 'drawer')
  socks?: object[]
}

@Entity('key_sock')
class Sock {
  @PrimaryColumn()
  id!: string

  @ManyToOne(() => Drawer, (drawer) => drawer.socks)
  @JoinColumn({ name: 'drawer_id' })
  drawer?: Drawer
}

describe('TypeOrmQueryService relations of an owner whose key a transformer stores in another form', () => {
  let dataSource: DataSource
  let drawer: Drawer

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Drawer, Sock],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.query(`INSERT INTO key_drawer (id) VALUES ('key-1'), ('key-2')`)
    await dataSource.query(
      `INSERT INTO key_sock (id, drawer_id) VALUES ('sock-1', 'key-1'), ('sock-2', 'key-1'), ('sock-3', 'key-2')`
    )
    drawer = await dataSource.getRepository(Drawer).findOneByOrFail({ id: 1 })
  })

  afterAll(() => dataSource.destroy())

  it('should query the relations of a single entity by its stored key', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Drawer))

    const socks = await queryService.queryRelations(Sock, 'socks', drawer, {
      sorting: [{ field: 'id', direction: SortDirection.ASC }]
    })

    expect(socks.map(({ id }) => id)).toEqual(['sock-1', 'sock-2'])
  })

  it('should aggregate the relations of a single entity by its stored key', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Drawer))

    const aggregates = await queryService.aggregateRelations(Sock, 'socks', drawer, {}, { count: [{ field: 'id', args: {} }] })

    expect(aggregates).toEqual([{ count: { id: 2 } }])
  })
})

@Entity('key_pew')
class Pew {
  @Column(() => SeatPart)
  row!: SeatPart

  @Column(() => SeatPart)
  column!: SeatPart

  @ManyToMany('Usher', 'pews')
  ushers?: object[]

  @ManyToMany('Choir', 'pews')
  @JoinTable({ name: 'key_pew_choir' })
  choirs?: object[]
}

@Entity('key_usher')
class Usher {
  @PrimaryColumn()
  id!: string

  @ManyToMany(() => Pew, (pew) => pew.ushers)
  @JoinTable({ name: 'key_usher_pew' })
  pews?: Pew[]
}

@Entity('key_choir')
class Choir {
  @PrimaryColumn()
  id!: string

  @ManyToMany(() => Pew, (pew) => pew.choirs)
  pews?: Pew[]
}

describe('TypeOrmQueryService many-to-many relations keyed by embedded columns sharing a property name', () => {
  let dataSource: DataSource
  let ushers: Usher[]
  let choirs: Choir[]

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Pew, Usher, Choir],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    choirs = await dataSource.getRepository(Choir).save([{ id: 'choir-1' }, { id: 'choir-2' }])
    await dataSource.getRepository(Pew).save([
      { row: { id: 'a' }, column: { id: 'b' }, choirs: [{ id: 'choir-1' }] },
      { row: { id: 'b' }, column: { id: 'a' }, choirs: [{ id: 'choir-2' }] }
    ] as Pew[])
    ushers = await dataSource.getRepository(Usher).save([
      { id: 'usher-1', pews: [{ row: { id: 'a' }, column: { id: 'b' } }] },
      { id: 'usher-2', pews: [{ row: { id: 'b' }, column: { id: 'a' } }] }
    ] as Usher[])
  })

  afterAll(() => dataSource.destroy())

  const pewKeys = (pews: Pew[]) => pews.map((pew) => `${pew.row.id}-${pew.column.id}`)

  it('should join the owning side by every column of the related key', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Usher))

    const single = await Promise.all(ushers.map((usher) => queryService.queryRelations(Pew, 'pews', usher, {})))
    const batch = await queryService.queryRelations(Pew, 'pews', ushers, {})

    expect(single.map(pewKeys)).toEqual([['a-b'], ['b-a']])
    expect(ushers.map((usher) => pewKeys(batch.get(usher)))).toEqual([['a-b'], ['b-a']])
  })

  it('should join the inverse side by every column of the related key', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Choir))

    const single = await Promise.all(choirs.map((choir) => queryService.queryRelations(Pew, 'pews', choir, {})))
    const batch = await queryService.queryRelations(Pew, 'pews', choirs, {})

    expect(single.map(pewKeys)).toEqual([['a-b'], ['b-a']])
    expect(choirs.map((choir) => pewKeys(batch.get(choir)))).toEqual([['a-b'], ['b-a']])
  })
})

@Entity('key_shift')
class Shift {
  @PrimaryColumn({ type: 'datetime' })
  startsAt!: Date

  @OneToMany('Task', 'shift')
  tasks?: object[]
}

@Entity('key_task')
class Task {
  @PrimaryColumn()
  id!: string

  @ManyToOne(() => Shift, (shift) => shift.tasks)
  shift?: Shift
}

describe('TypeOrmQueryService batch relations of owners keyed by a value the driver cannot bind as it is', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Shift, Task],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource
      .getRepository(Shift)
      .save([{ startsAt: new Date('2020-01-01T09:00:00.000Z') }, { startsAt: new Date('2020-01-02T09:00:00.000Z') }])
    await dataSource.getRepository(Task).save([
      { id: 'task-1', shift: { startsAt: new Date('2020-01-01T09:00:00.000Z') } },
      { id: 'task-2', shift: { startsAt: new Date('2020-01-02T09:00:00.000Z') } }
    ] as Task[])
  })

  afterAll(() => dataSource.destroy())

  it('should bind each owner key in the form the database stores it', async () => {
    const shifts = await dataSource.getRepository(Shift).find({ order: { startsAt: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Shift))

    const tasks = await queryService.queryRelations(Task, 'tasks', shifts, {})

    expect(shifts.map((shift) => tasks.get(shift).map(({ id }) => id))).toEqual([['task-1'], ['task-2']])
  })
})

@Entity('key_desk')
class Desk {
  @PrimaryColumn()
  id!: string

  @OneToMany('Clerk', 'desk')
  сотрудники?: Clerk[]
}

@Entity('key_clerk')
class Clerk {
  @PrimaryColumn()
  номер!: string

  @ManyToOne(() => Desk, (desk) => desk.сотрудники)
  @JoinColumn({ name: 'desk_id' })
  desk?: Desk
}

describe('TypeOrmQueryService relations of owners whose key property is not named in latin letters', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Desk, Clerk],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(Desk).save([{ id: 'desk-1' }, { id: 'desk-2' }])
    await dataSource.getRepository(Clerk).save([
      { номер: 'clerk-1', desk: { id: 'desk-2' } },
      { номер: 'clerk-2', desk: { id: 'desk-1' } }
    ] as Clerk[])
  })

  afterAll(() => dataSource.destroy())

  it('should find the relation of a single entity', async () => {
    const clerk = await dataSource.getRepository(Clerk).findOneByOrFail({ номер: 'clerk-1' })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Clerk))

    const desk = await queryService.findRelation(Desk, 'desk', clerk)

    expect(desk?.id).toBe('desk-2')
  })

  it('should find the relations of many entities', async () => {
    const clerks = await dataSource.getRepository(Clerk).find({ order: { номер: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Clerk))

    const desks = await queryService.findRelation(Desk, 'desk', clerks)

    expect(clerks.map((clerk) => desks.get(clerk)?.id)).toEqual(['desk-2', 'desk-1'])
  })
})

describe('TypeOrmQueryService relations not named in latin letters', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Desk, Clerk],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(Desk).save([{ id: 'desk-1' }, { id: 'desk-2' }])
    await dataSource.getRepository(Clerk).save([
      { номер: 'clerk-1', desk: { id: 'desk-2' } },
      { номер: 'clerk-2', desk: { id: 'desk-1' } },
      { номер: 'clerk-3', desk: { id: 'desk-2' } }
    ] as Clerk[])
  })

  afterAll(() => dataSource.destroy())

  it('should query the relations of a single entity', async () => {
    const desk = await dataSource.getRepository(Desk).findOneByOrFail({ id: 'desk-2' })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Desk))

    const clerks = await queryService.queryRelations(Clerk, 'сотрудники', desk, {})

    expect(clerks.map((clerk) => clerk.номер).sort()).toEqual(['clerk-1', 'clerk-3'])
  })

  it('should query the relations of many entities', async () => {
    const desks = await dataSource.getRepository(Desk).find({ order: { id: 'ASC' } })
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Desk))

    const clerks = await queryService.queryRelations(Clerk, 'сотрудники', desks, {})

    expect(
      desks.map((desk) =>
        clerks
          .get(desk)
          ?.map((clerk) => clerk.номер)
          .sort()
      )
    ).toEqual([['clerk-2'], ['clerk-1', 'clerk-3']])
  })
})
