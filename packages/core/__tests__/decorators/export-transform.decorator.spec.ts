import { instanceToPlain, plainToInstance, Type } from 'class-transformer'

import { EXPORT_TRANSFORM_GROUP, ExportTransform } from '../../src'

describe('@ExportTransform', () => {
  class BaseDTO {
    @ExportTransform(({ value }: { value: string }) => value.toUpperCase())
    title!: string
  }

  class DTO extends BaseDTO {}

  it('does not transform ordinary DTO conversions or serialization', () => {
    const item = plainToInstance(DTO, { title: 'hello' })

    expect(item.title).toBe('hello')
    expect(instanceToPlain(item)).toEqual({ title: 'hello' })
  })

  it('transforms inherited fields for export without mutating the source', () => {
    const item = plainToInstance(DTO, { title: 'hello' })
    const result = plainToInstance(DTO, item, { groups: [EXPORT_TRANSFORM_GROUP] })

    expect(result.title).toBe('HELLO')
    expect(item.title).toBe('hello')
  })

  it('transforms typed nested DTOs and collections only for export', () => {
    class ParentDTO {
      @Type(() => DTO)
      child!: DTO

      @Type(() => DTO)
      children!: DTO[]
    }

    const item = plainToInstance(ParentDTO, { child: { title: 'one' }, children: [{ title: 'two' }] })
    const result = plainToInstance(ParentDTO, item, { groups: [EXPORT_TRANSFORM_GROUP] })

    expect(result.child.title).toBe('ONE')
    expect(result.children[0].title).toBe('TWO')
    expect(item.child.title).toBe('one')
    expect(item.children[0].title).toBe('two')
  })
})
