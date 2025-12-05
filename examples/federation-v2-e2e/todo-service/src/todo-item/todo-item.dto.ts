import { Directive, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField, Reference } from '@ptc-org/nestjs-query-graphql'

import { UserReferenceDTO } from './user-reference.dto'

@ObjectType('TodoItem')
@Directive('@key(fields: "id")')
@Reference('assignee', () => UserReferenceDTO, { id: 'assigneeId' }, { nullable: true })
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

  @FilterableField()
  created!: Date

  @FilterableField()
  updated!: Date
}
