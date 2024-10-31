import { ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, FilterableUnPagedRelation, PagingStrategies, QueryOptions } from '@souagrosolucoes/nestjs-query-graphql'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

import { CategoryEntity } from '../category/category.entity'
import { UserEntity } from '../user/user.entity'

@Entity({ name: 'post' })
@ObjectType('Post')
@QueryOptions({ filterDepth: 2, pagingStrategy: PagingStrategies.NONE })
@FilterableUnPagedRelation('categories', () => CategoryEntity)
@FilterableUnPagedRelation('authors', () => UserEntity)
export class PostEntity {
  @PrimaryGeneratedColumn()
  @FilterableField(() => ID)
  id!: number

  @Column()
  @FilterableField()
  title!: string

  @Column({ nullable: true })
  @FilterableField({ nullable: true })
  description?: string

  @ManyToMany(() => UserEntity, (user) => user.posts)
  authors!: UserEntity[]

  @ManyToMany(() => CategoryEntity, (category) => category.posts)
  @JoinTable()
  categories!: CategoryEntity[]
}
