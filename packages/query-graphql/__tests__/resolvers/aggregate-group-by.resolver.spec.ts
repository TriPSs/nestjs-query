import { ObjectType, Resolver } from '@nestjs/graphql'
import { describe, expect, it } from 'vitest'

import { createGroupByResolver, CRUDResolver, FilterableField, PagingStrategies } from '../../src'
import { createResolvers } from '../../src/providers/resolver.provider'
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
    const sdl = await generateSchema(
      createResolvers([
        {
          DTOClass: ScratchDateDTO,
          ServiceClass: TestService,
          enableAggregate: true,
          pagingStrategy: PagingStrategies.NONE
        }
      ])
    )

    expect(section(sdl, 'ScratchDateDTOAggregateGroupBy')).toContain('fakeDate(by:')
    expect(section(sdl, 'ScratchDateDTO')).not.toContain('(by:')
  })

  it('exposes the by argument for manually composed resolvers', async () => {
    @Resolver(() => ScratchDateDTO)
    class ScratchResolver extends CRUDResolver(ScratchDateDTO, { enableAggregate: true }) {}

    const sdl = await generateSchema([ScratchResolver, createGroupByResolver(ScratchDateDTO) as never])

    expect(section(sdl, 'ScratchDateDTOAggregateGroupBy')).toContain('fakeDate(by:')
    expect(section(sdl, 'ScratchDateDTO')).not.toContain('(by:')
  })

  it('registers the group-by field resolvers once per DTO across registrations', async () => {
    const first = {
      DTOClass: ScratchDateDTO,
      ServiceClass: TestService,
      enableAggregate: true,
      pagingStrategy: PagingStrategies.NONE
    } as never
    const second = {
      DTOClass: ScratchDateDTO,
      ServiceClass: TestService,
      create: { disabled: true },
      update: { disabled: true },
      delete: { disabled: true },
      read: { one: { disabled: true }, many: { name: 'scratchDatesOffset' } },
      pagingStrategy: PagingStrategies.NONE
    } as never

    const sdl = await generateSchema(createResolvers([first, second]))

    expect(section(sdl, 'ScratchDateDTOAggregateGroupBy')).toContain('fakeDate(by:')
    expect(section(sdl, 'ScratchDateDTO')).not.toContain('(by:')
  })

  it('registers the group-by field resolvers when only aggregate opts enable it', async () => {
    const sdl = await generateSchema(
      createResolvers([
        {
          DTOClass: ScratchDateDTO,
          ServiceClass: TestService,
          aggregate: { enabled: true },
          pagingStrategy: PagingStrategies.NONE
        }
      ])
    )

    expect(section(sdl, 'ScratchDateDTOAggregateGroupBy')).toContain('fakeDate(by:')
  })

  it('does not add the by argument when aggregate is disabled', async () => {
    const sdl = await generateSchema(
      createResolvers([
        {
          DTOClass: ScratchDateDTO,
          ServiceClass: TestService,
          pagingStrategy: PagingStrategies.NONE
        }
      ])
    )

    expect(sdl).not.toContain('(by:')
  })
})
