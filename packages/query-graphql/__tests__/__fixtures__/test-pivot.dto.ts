import { ObjectType } from '@nestjs/graphql'

import { FilterableField, PivotMapping } from '../../src/decorators'
import { TestRelationDTO } from './test-relation.dto'
import { TestResolverDTO } from './test-resolver.dto'

/**
 * The keys live on the entity, so the DTO only carries the properties of the relationship.
 */
@ObjectType()
@PivotMapping([
  [
    { DTO: () => TestResolverDTO, key: 'testResolverId' },
    { DTO: () => TestRelationDTO, key: 'testRelationId' }
  ]
])
export class TestPivotDTO {
  @FilterableField()
  since!: string
}

/**
 * The same pivot, but with its ends pointing at the relations instead of at the keys.
 */
@ObjectType()
@PivotMapping([
  [
    { DTO: () => TestResolverDTO, key: 'testResolver', reference: 'id' },
    { DTO: () => TestRelationDTO, key: 'testRelation', reference: 'id' }
  ]
])
export class TestRelationKeyedPivotDTO {
  @FilterableField()
  since!: string
}
