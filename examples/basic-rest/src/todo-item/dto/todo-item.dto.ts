import { FilterableField } from '@ptc-org/nestjs-query-rest'

export class TodoItemDTO {
  @FilterableField()
  id!: number

  @FilterableField()
  title!: string

  @FilterableField({ nullable: true })
  description?: string

  @FilterableField({
    name: 'isCompleted'
  })
  completed!: boolean

  @FilterableField({ filterOnly: true })
  created!: Date

  @FilterableField({ filterOnly: true })
  updated!: Date
}
