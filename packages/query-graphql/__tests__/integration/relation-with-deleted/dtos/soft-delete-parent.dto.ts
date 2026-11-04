import { ObjectType } from '@nestjs/graphql'

import { FilterableField, OffsetConnection, Relation, UnPagedRelation } from '../../../../src'
import { SoftDeleteItemDto } from './soft-delete-item.dto'

@UnPagedRelation('items', () => SoftDeleteItemDto, { withDeleted: true })
@OffsetConnection('pagedItems', () => SoftDeleteItemDto, {
  relationName: 'items',
  withDeleted: true,
  enableTotalCount: true
})
@Relation('featuredItem', () => SoftDeleteItemDto, { nullable: true, withDeleted: true })
@ObjectType('SoftDeleteParent')
export class SoftDeleteParentDto {
  @FilterableField()
  id: number

  @FilterableField()
  name: string
}
