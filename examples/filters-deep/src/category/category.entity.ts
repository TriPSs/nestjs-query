import { ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, FilterableUnPagedRelation } from '@souagrosolucoes/nestjs-query-graphql'
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

import { PostEntity } from '../post/post.entity'

@Entity({ name: 'category' })
@ObjectType('Category')
@FilterableUnPagedRelation('posts', () => PostEntity)
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  @FilterableField(() => ID)
  id!: number

  @Column()
  @FilterableField()
  name!: string

  @ManyToMany(() => PostEntity, (post) => post.categories)
  posts!: PostEntity[]
}
