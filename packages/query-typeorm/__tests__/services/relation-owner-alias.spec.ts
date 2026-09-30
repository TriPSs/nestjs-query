import {
  Column,
  DataSource,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from 'typeorm'

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

@Entity('alias_label')
class Label {
  @PrimaryColumn()
  id!: string

  @Column({ name: 'post_labels_postId' })
  note!: string

  @ManyToMany('Article', 'labels')
  articles?: object[]
}

@Entity('alias_article')
class Article {
  @PrimaryColumn()
  id!: string

  @ManyToMany(() => Label, (label) => label.articles)
  @JoinTable({ name: 'post_labels', joinColumn: { name: 'postId' }, inverseJoinColumn: { name: 'labelId' } })
  labels?: Label[]

  @OneToMany('Reply', 'article')
  replies?: object[]
}

@Entity('alias_reply')
class Reply {
  @PrimaryColumn()
  id!: string

  @Column({ select: false })
  postId!: string

  @Column({ name: 'replies_postId' })
  note!: string

  @ManyToOne(() => Article, (article) => article.replies)
  @JoinColumn({ name: 'postId' })
  article?: Article
}

describe('TypeOrmQueryService batch relations with a column named like the alias of an owner key', () => {
  let dataSource: DataSource
  let articles: Article[]

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      dropSchema: true,
      entities: [Label, Article, Reply],
      synchronize: true,
      logging: false
    })
    await dataSource.initialize()
    await dataSource.getRepository(Label).save([
      { id: 'label-1', note: 'first' },
      { id: 'label-2', note: 'second' }
    ])
    articles = await dataSource.getRepository(Article).save([
      { id: 'article-1', labels: [{ id: 'label-1' }] },
      { id: 'article-2', labels: [{ id: 'label-2' }] }
    ] as Article[])
    await dataSource.getRepository(Reply).save([
      { id: 'reply-1', postId: 'article-1', note: 'first' },
      { id: 'reply-2', postId: 'article-2', note: 'second' }
    ])
  })

  afterAll(() => dataSource.destroy())

  it('should keep the value of the column when the owner key comes from a junction table', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Article))

    const labels = await queryService.queryRelations(Label, 'labels', articles, {})

    expect(articles.map((article) => labels.get(article).map(({ id, note }) => `${id}:${note}`))).toEqual([
      ['label-1:first'],
      ['label-2:second']
    ])
  })

  it('should keep the value of the column when the owner key is not selected by default', async () => {
    const queryService = new TypeOrmQueryService(dataSource.getRepository(Article))

    const replies = await queryService.queryRelations(Reply, 'replies', articles, {})

    expect(articles.map((article) => replies.get(article).map(({ id, note }) => `${id}:${note}`))).toEqual([
      ['reply-1:first'],
      ['reply-2:second']
    ])
  })
})
