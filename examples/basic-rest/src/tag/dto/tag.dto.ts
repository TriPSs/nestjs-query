import { FilterableField } from '@ptc-org/nestjs-query-rest'

export class TagDTO {
  @FilterableField()
  id!: number

  @FilterableField()
  name!: string

  @FilterableField()
  created!: Date

  @FilterableField()
  updated!: Date
}
