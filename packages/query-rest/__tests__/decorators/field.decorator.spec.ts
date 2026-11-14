import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { Field } from '../../src/decorators'

describe('Field', () => {
  describe.each([
    { format: 'uuid', valid: '550e8400-e29b-41d4-a716-446655440000', invalid: 'not-a-uuid', constraint: 'isUuid' },
    { format: 'email', valid: 'user@example.com', invalid: 'not-an-email', constraint: 'isEmail' },
    { format: 'ipv4', valid: '192.0.2.1', invalid: '2001:db8::1', constraint: 'isIp' },
    { format: 'ipv6', valid: '2001:db8::1', invalid: '192.0.2.1', constraint: 'isIp' },
    { format: 'byte', valid: 'aGVsbG8=', invalid: 'not-base64!', constraint: 'isBase64' }
  ])('$format format', ({ format, valid, invalid, constraint }) => {
    class FormatDTO {
      @Field({ format })
      value!: string
    }

    class FormatArrayDTO {
      @Field(() => [String], { format })
      values!: string[]
    }

    class OptionalFormatDTO {
      @Field({ format, nullable: true })
      value?: string | null
    }

    it('accepts valid input and preserves the OpenAPI format', () => {
      expect(validateSync(plainToInstance(FormatDTO, { value: valid }))).toHaveLength(0)
      expect(Reflect.getMetadata('swagger/apiModelProperties', FormatDTO.prototype, 'value').format).toBe(format)
    })

    it.each([invalid, '', null, undefined])('rejects invalid or missing required input: %s', (value) => {
      const errors = validateSync(plainToInstance(FormatDTO, { value }))

      expect(errors).toHaveLength(1)
      expect(errors[0].constraints).toHaveProperty(value === invalid ? constraint : 'isNotEmpty')
    })

    it('validates every array element', () => {
      expect(validateSync(plainToInstance(FormatArrayDTO, { values: [valid] }))).toHaveLength(0)
      const errors = validateSync(plainToInstance(FormatArrayDTO, { values: [valid, invalid] }))

      expect(errors).toHaveLength(1)
      expect(errors[0].constraints).toHaveProperty(constraint)
    })

    it.each([null, undefined, valid])('accepts optional input: %s', (value) => {
      expect(validateSync(plainToInstance(OptionalFormatDTO, { value }))).toHaveLength(0)
    })

    it('rejects invalid input on optional fields', () => {
      const errors = validateSync(plainToInstance(OptionalFormatDTO, { value: invalid }))

      expect(errors).toHaveLength(1)
      expect(errors[0].constraints).toHaveProperty(constraint)
    })
  })

  it('does not add format validation to strings with no format or an unknown format', () => {
    class StringDTO {
      @Field()
      value!: string

      @Field({ format: 'custom' })
      custom!: string
    }

    expect(validateSync(plainToInstance(StringDTO, { value: 'text', custom: 'text' }))).toHaveLength(0)
  })

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

  it('rejects blank values for numeric enums', () => {
    enum Status {
      None,
      Active
    }

    class NumericEnumDTO {
      @Field({ enum: Status })
      status!: Status
    }

    class NumericEnumArrayDTO {
      @Field(() => [Status], { enum: Status })
      statuses!: Status[]
    }

    const scalar = plainToInstance(NumericEnumDTO, { status: '' })
    const array = plainToInstance(NumericEnumArrayDTO, { statuses: [''] })

    expect(scalar.status).toBe('')
    expect(array.statuses).toEqual([''])
    expect(validateSync(scalar)).toHaveLength(1)
    expect(validateSync(array)).toHaveLength(1)
  })

  it('preserves blank values for numeric enums with a custom name', () => {
    enum Status {
      None,
      Active
    }

    class NamedNumericEnumDTO {
      @Field({ enum: Status, name: 'state' })
      status!: Status
    }

    const dto = plainToInstance(NamedNumericEnumDTO, { state: '' })

    expect(dto.status).toBe('')
    expect(validateSync(dto)).toHaveLength(1)
  })

  it('resolves boolean enum types', () => {
    const BooleanEnum = { No: false, Yes: true }

    class BooleanEnumDTO {
      @Field({ enum: BooleanEnum })
      value!: boolean
    }

    const dto = plainToInstance(BooleanEnumDTO, { value: 'false' })
    const apiProperty = Reflect.getMetadata('swagger/apiModelProperties', BooleanEnumDTO.prototype, 'value')

    expect(dto.value).toBe(false)
    expect(validateSync(dto)).toHaveLength(0)
    expect(apiProperty.type).toBe(Boolean)
  })

  it('does not coerce heterogeneous enum values to a single primitive type', () => {
    enum Mixed {
      Zero,
      Text = 'text'
    }

    class MixedEnumDTO {
      @Field({ enum: Mixed })
      value!: Mixed
    }

    const dto = plainToInstance(MixedEnumDTO, { value: 'text' })

    expect(dto.value).toBe('text')
    expect(validateSync(dto)).toHaveLength(0)
  })

  it('resolves primitive types from enum value arrays', () => {
    class EnumArrayDTO {
      @Field({ enum: ['draft', 'open'] })
      value!: object
    }

    const dto = plainToInstance(EnumArrayDTO, { value: 123 })
    const apiProperty = Reflect.getMetadata('swagger/apiModelProperties', EnumArrayDTO.prototype, 'value')

    expect(dto.value).toBe('123')
    expect(validateSync(dto)).toHaveLength(1)
    expect(apiProperty.type).toBe(String)
  })
})
