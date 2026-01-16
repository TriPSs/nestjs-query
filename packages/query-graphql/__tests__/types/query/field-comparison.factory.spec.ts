import { ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@souagrosolucoes/nestjs-query-graphql'

import { createFilterComparisonType } from '../../../src/types/query/field-comparison/field-comparison.factory'
import { getOrCreateStringFieldComparison } from '../../../src/types/query/field-comparison/string-field-comparison.type'

describe('createFilterComparisonType', () => {
  @ObjectType()
  class TestDto {
    @FilterableField(() => [String])
    tags!: string[]

    @FilterableField()
    name!: string
  }

  it('should return the same comparison type for a string array and a string', () => {
    const StringComparison = getOrCreateStringFieldComparison()
    const ArrayComparison = createFilterComparisonType({ FieldType: TestDto, fieldName: 'tags', returnTypeFunc: () => [String] })
    const PlainStringComparison = createFilterComparisonType({
      FieldType: TestDto,
      fieldName: 'name',
      returnTypeFunc: () => String
    })

    expect(ArrayComparison).toBe(StringComparison)
    expect(PlainStringComparison).toBe(StringComparison)
  })
})
