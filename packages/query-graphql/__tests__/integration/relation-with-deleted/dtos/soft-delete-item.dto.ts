import { ObjectType } from '@nestjs/graphql'

import { FilterableField } from '../../../../src'

@ObjectType('SoftDeleteItem')
export class SoftDeleteItemDto {
  @FilterableField()
  id: number

  @FilterableField()
  parentId: number

  @FilterableField()
  content: string
}
