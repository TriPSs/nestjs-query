import { Column, DataSource, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm'

import { TypeOrmQueryService } from '../../src'

@Entity('member_profile')
class MemberProfile {
  @PrimaryColumn()
  id!: string

  @Column()
  bio!: string

  @OneToOne('Member', 'profile')
  member?: object
}

@Entity('member')
class Member {
  @PrimaryColumn()
  id!: string

  @Column()
  name!: string

  @OneToOne('MemberProfile', 'member')
  @JoinColumn()
  profile?: MemberProfile
}

describe('TypeOrmQueryService relations whose filter alias matches the owner table name', () => {
  let dataSource: DataSource
  let members: Member[]

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Member, MemberProfile],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(MemberProfile).save([
      { id: 'profile-1', bio: 'first' },
      { id: 'profile-2', bio: 'second' }
    ])
    members = await dataSource.getRepository(Member).save([
      { id: 'member-1', name: 'alice', profile: { id: 'profile-1' } as MemberProfile },
      { id: 'member-2', name: 'bob', profile: { id: 'profile-2' } as MemberProfile }
    ])
  })

  afterAll(() => dataSource.destroy())

  const filter = { member: { name: { eq: 'alice' } } }

  it('should query the relation of a single entity', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Member))

    const profiles = await queryService.queryRelations(MemberProfile, 'profile', members[0], { filter })

    expect(profiles.map(({ id }) => id)).toEqual(['profile-1'])
  })

  it('should query the relations of many entities', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Member))

    const profiles = await queryService.queryRelations(MemberProfile, 'profile', members, { filter })

    expect(members.map((member) => profiles.get(member).map(({ id }) => id))).toEqual([['profile-1'], []])
  })

  it('should find the relation of many entities', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Member))

    const profiles = await queryService.findRelation(MemberProfile, 'profile', members, { filter })

    expect(members.map((member) => profiles.get(member)?.id)).toEqual(['profile-1', undefined])
  })
})
