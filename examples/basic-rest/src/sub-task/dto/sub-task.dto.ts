import { FilterableField } from '@ptc-org/nestjs-query-rest'

export class SubTaskDTO {
  @FilterableField()
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField()
  completed!: boolean

  @FilterableField()
  created!: Date

  @FilterableField()
  updated!: Date

  @FilterableField()
  todoItemId!: string
}
