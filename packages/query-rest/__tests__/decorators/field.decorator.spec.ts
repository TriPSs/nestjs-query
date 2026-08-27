import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { Field } from '../../src/decorators'

describe('Field', () => {
  class TestDTO {
    @Field(() => [String], { forceArray: true })
    values?: string[] | null
  }

  class StrictArrayDTO {
    @Field(() => [String])
    values!: string[]
  }

  it.each([
    ['an array', ['one', 'two'], ['one', 'two']],
    ['a single value', 'one', ['one']],
    ['null', null, null],
    ['undefined', undefined, undefined]
  ])('preserves %s when forceArray is enabled', (_description, value, expected) => {
    expect(plainToInstance(TestDTO, { values: value }).values).toEqual(expected)
  })

  it('rejects scalar values for array fields', () => {
    const dto = plainToInstance(StrictArrayDTO, { values: 'one' })

    expect(validateSync(dto)).toHaveLength(1)
  })

  it('accepts scalar values normalized by forceArray', () => {
    const dto = plainToInstance(TestDTO, { values: 'one' })

    expect(validateSync(dto)).toHaveLength(0)
  })

  it('resolves Swagger metadata factory types for transformation and validation', () => {
    const metadataType = () => Number

    class SwaggerMetadataDTO {
      @Field()
      value!: number

      static _OPENAPI_METADATA_FACTORY() {
        return { value: { type: metadataType } }
      }
    }

    const dto = plainToInstance(SwaggerMetadataDTO, { value: 'not-a-number' })
    const apiProperty = Reflect.getMetadata('swagger/apiModelProperties', SwaggerMetadataDTO.prototype, 'value')

    expect(dto.value).toBeNaN()
    expect(validateSync(dto)).toHaveLength(1)
    expect(apiProperty.type).toBe(metadataType)
  })
})
