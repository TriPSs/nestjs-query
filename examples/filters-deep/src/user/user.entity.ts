import { ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, FilterableUnPagedRelation, PagingStrategies, QueryOptions } from '@ptc-org/nestjs-query-graphql'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

import { PostEntity } from '../post/post.entity'

@Entity({ name: 'user' })
@ObjectType('User')
@QueryOptions({ filterDepth: Number.POSITIVE_INFINITY, pagingStrategy: PagingStrategies.NONE })
@FilterableUnPagedRelation('posts', () => PostEntity)
export class UserEntity {
  @PrimaryGeneratedColumn()
  @FilterableField(() => ID)
  id!: number

  @Column()
  @FilterableField()
  firstName!: string

  @Column()
  @FilterableField()
  lastName!: string

  @ManyToMany(() => PostEntity, (post) => post.authors)
  @JoinTable()
  posts!: PostEntity[]
}
