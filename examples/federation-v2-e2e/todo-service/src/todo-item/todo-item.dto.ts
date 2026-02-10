import { Directive, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, Reference } from '@ptc-org/nestjs-query-graphql'

import { TagReferenceDTO } from './tag-reference.dto'
import { UserReferenceDTO } from './user-reference.dto'

@ObjectType('TodoItem')
@Directive('@key(fields: "id")')
// Test numeric ID type in Federation (assigneeId -> User)
@Reference('assignee', () => UserReferenceDTO, { id: 'assigneeId' }, { nullable: true })
// Test UUID/string ID type in Federation (tagId -> Tag)
@Reference('tag', () => TagReferenceDTO, { id: 'tagId' }, { nullable: true })
export class TodoItemDTO {
  @FilterableField(() => ID)
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField()
  completed!: boolean

  @FilterableField({ nullable: true })
  assigneeId?: number

  // UUID reference to Tag
  @FilterableField({ nullable: true })
  tagId?: string

  @FilterableField()
  created!: Date

  @FilterableField()
  updated!: Date
}
