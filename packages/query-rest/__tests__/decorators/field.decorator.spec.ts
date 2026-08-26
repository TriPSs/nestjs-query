import { plainToInstance } from 'class-transformer'

import { Field } from '../../src/decorators'

describe('Field', () => {
  class TestDTO {
    @Field(() => [String], { forceArray: true })
    values?: string[] | null
  }

  it.each([
    ['an array', ['one', 'two'], ['one', 'two']],
    ['a single value', 'one', ['one']],
    ['null', null, null],
    ['undefined', undefined, undefined]
  ])('preserves %s when forceArray is enabled', (_description, value, expected) => {
    expect(plainToInstance(TestDTO, { values: value }).values).toEqual(expected)
  })
})
