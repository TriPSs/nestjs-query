import { ObjectType } from '@nestjs/graphql'
import { describe, expect, it } from 'vitest'

import { FilterableField, PagingStrategies } from '../../src'
import { createResolvers } from '../../src/providers/resolver.provider'
import { createGroupByResolver } from '../../src/resolvers/aggregate/group-by-aggregate.resolver'
import { generateSchema, TestService } from '../__fixtures__'

@ObjectType('ScratchDateDTO')
class ScratchDateDTO {
  @FilterableField()
  id!: number

  @FilterableField()
  fakeDate!: Date
}

const section = (sdl: string, typeName: string): string =>
  sdl.split('\n\n').find((block) => block.startsWith(`type ${typeName} {`)) ?? ''

describe('aggregate group by resolver', () => {
  it('exposes the by argument on the group-by type fields only', async () => {
    const providers = createResolvers([
      {
        DTOClass: ScratchDateDTO,
        ServiceClass: TestService,
        enableAggregate: true,
        pagingStrategy: PagingStrategies.NONE
      }
    ])
    const sdl = await generateSchema(providers)

    expect(section(sdl, 'ScratchDateDTOAggregateGroupBy')).toContain('fakeDate(by:')
    expect(section(sdl, 'ScratchDateDTO')).not.toContain('(by:')
  })

  it('does not register a group-by resolver when aggregate is disabled', () => {
    const providers = createResolvers([
      {
        DTOClass: ScratchDateDTO,
        ServiceClass: TestService,
        pagingStrategy: PagingStrategies.NONE
      }
    ])

    expect(providers).toHaveLength(1)
  })

  it('memoizes the group-by resolver per DTO', () => {
    expect(createGroupByResolver(ScratchDateDTO)).toBe(createGroupByResolver(ScratchDateDTO))
  })
})
