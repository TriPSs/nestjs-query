import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { Field } from '../../src/decorators'

describe('Field', () => {
  it('omits hidden fields from the generated schema while still exposing, transforming and validating them', async () => {
    class ExampleDTO {
      @Field({ hideFromSwagger: true, minimum: 1 })
      count!: number

      @Field(() => String, { hideFromSwagger: false })
      label!: string
    }

    const module = await Test.createTestingModule({}).compile()
    const app = module.createNestApplication()
    try {
      const document = SwaggerModule.createDocument(app, new DocumentBuilder().build(), { extraModels: [ExampleDTO] })
      expect(document.components?.schemas?.ExampleDTO).toEqual({
        type: 'object',
        properties: { label: { type: 'string' } },
        required: ['label']
      })
    } finally {
      await app.close()
    }

    const dto = plainToInstance(ExampleDTO, { count: '0', label: 'test' }, { excludeExtraneousValues: true })
    expect(dto.count).toBe(0)
    expect(validateSync(dto)[0].constraints).toHaveProperty('min')
  })

  describe('integer type', () => {
    class IntegerDTO {
      @Field({ type: 'integer' })
      value!: number
    }

    class OptionalIntegerDTO {
      @Field({ type: 'integer', nullable: true })
      value?: number | null
    }

    class IntegerArrayDTO {
      @Field(() => [Number], { type: 'integer', minimum: 0, maximum: 100 })
      values!: number[]
    }

    class SwaggerIntegerArrayDTO {
      @Field({ type: 'integer', isArray: true, forceArray: true })
      values!: number[]
    }

    it.each([0, -1, 12, '12'])('accepts integer input: %s', (value) => {
      const dto = plainToInstance(IntegerDTO, { value })

      expect(dto.value).toBe(Number(value))
      expect(validateSync(dto)).toHaveLength(0)
    })

    it.each([1.5, '12.5', 'not-a-number', NaN, Infinity, -Infinity, null, undefined])(
      'rejects invalid integer input without truncating: %s',
      (value) => {
        const dto = plainToInstance(IntegerDTO, { value })
        const errors = validateSync(dto)

        expect(errors).toHaveLength(1)
        expect(errors[0].constraints).toHaveProperty('isInt')
      }
    )

    it('does not truncate fractional strings', () => {
      const dto = plainToInstance(IntegerDTO, { value: '12.5' })

      expect(dto.value).toBe(12.5)
      expect(validateSync(dto)[0].constraints).toHaveProperty('isInt')
    })

    it.each([null, undefined, '12'])('preserves optional integer behavior: %s', (value) => {
      const dto = plainToInstance(OptionalIntegerDTO, { value })

      expect(dto.value).toBe(value == null ? value : 12)
      expect(validateSync(dto)).toHaveLength(0)
    })

    it('rejects fractional optional values', () => {
      expect(validateSync(plainToInstance(OptionalIntegerDTO, { value: 1.5 }))[0].constraints).toHaveProperty('isInt')
    })

    it('preserves the integer OpenAPI schema', () => {
      const property = Reflect.getMetadata('swagger/apiModelProperties', IntegerDTO.prototype, 'value')

      expect(property.type).toBe('integer')
    })

    it('transforms and accepts integer array elements within the bounds', () => {
      const dto = plainToInstance(IntegerArrayDTO, { values: [0, '100'] })

      expect(dto.values).toEqual([0, 100])
      expect(validateSync(dto)).toHaveLength(0)
    })

    it.each([
      [[1, 1.5], 'isInt'],
      [[-1, 50], 'min'],
      [[50, 101], 'max'],
      [1, 'isArray']
    ])('validates integer array elements and bounds: %j', (values, constraint) => {
      const errors = validateSync(plainToInstance(IntegerArrayDTO, { values }))

      expect(errors).toHaveLength(1)
      expect(errors[0].constraints).toHaveProperty(constraint)
    })

    it('supports Swagger array options and forceArray', () => {
      const dto = plainToInstance(SwaggerIntegerArrayDTO, { values: '12' })

      expect(dto.values).toEqual([12])
      expect(validateSync(dto)).toHaveLength(0)
      expect(validateSync(plainToInstance(SwaggerIntegerArrayDTO, { values: ['12.5'] }))[0].constraints).toHaveProperty('isInt')
    })

    it('preserves integer array schemas inferred from Swagger metadata factories', () => {
      class MetadataIntegerArrayDTO {
        @Field({ type: 'integer' })
        values!: number[]

        static _OPENAPI_METADATA_FACTORY() {
          return { values: { type: () => [Number] } }
        }
      }

      const dto = plainToInstance(MetadataIntegerArrayDTO, { values: ['12'] })
      const property = Reflect.getMetadata('swagger/apiModelProperties', MetadataIntegerArrayDTO.prototype, 'values')

      expect(dto.values).toEqual([12])
      expect(validateSync(dto)).toHaveLength(0)
      expect(property.type).toBe('integer')
      expect(property.isArray).toBe(true)
      expect(validateSync(plainToInstance(MetadataIntegerArrayDTO, { values: ['12.5'] }))[0].constraints).toHaveProperty('isInt')
    })

    it('preserves ordinary number validation and int64 range behavior', () => {
      class NumberDTO {
        @Field()
        value!: number

        @Field({ type: 'integer', format: 'int64' })
        large!: number
      }

      expect(validateSync(plainToInstance(NumberDTO, { value: 1.5, large: 2147483648 }))).toHaveLength(0)
    })
  })

  describe('int32 format', () => {
    class Int32DTO {
      @Field({ type: 'integer', format: 'int32' })
      value!: number
    }

    class Int32ArrayDTO {
      @Field(() => [Number], { type: 'integer', format: 'int32' })
      values!: number[]
    }

    it.each([-2147483648, 0, 2147483647])('accepts int32 values including boundaries: %s', (value) => {
      expect(validateSync(plainToInstance(Int32DTO, { value }))).toHaveLength(0)
    })

    it.each([
      [-2147483649, 'min'],
      [2147483648, 'max']
    ])('rejects values outside int32 bounds: %s', (value, constraint) => {
      expect(validateSync(plainToInstance(Int32DTO, { value }))[0].constraints).toHaveProperty(constraint)
      expect(validateSync(plainToInstance(Int32ArrayDTO, { values: [0, value] }))[0].constraints).toHaveProperty(constraint)
    })

    it('validates every int32 array element', () => {
      expect(validateSync(plainToInstance(Int32ArrayDTO, { values: ['-2147483648', '2147483647'] }))).toHaveLength(0)
      expect(validateSync(plainToInstance(Int32ArrayDTO, { values: [0, 1.5] }))[0].constraints).toHaveProperty('isInt')
    })

    it.each([Int32DTO, Int32ArrayDTO])('documents default int32 bounds for %s', (DTOClass) => {
      const key = DTOClass === Int32DTO ? 'value' : 'values'
      const property = Reflect.getMetadata('swagger/apiModelProperties', DTOClass.prototype, key)

      expect(property).toMatchObject({ minimum: -2147483648, maximum: 2147483647 })
    })

    it('honors explicit bounds without widening the int32 range', () => {
      class NarrowInt32DTO {
        @Field({ type: 'integer', format: 'int32', minimum: 0, maximum: 100 })
        value!: number
      }

      class WideInt32DTO {
        @Field({ type: 'integer', format: 'int32', minimum: -1e12, maximum: 1e12 })
        value!: number
      }

      expect(Reflect.getMetadata('swagger/apiModelProperties', NarrowInt32DTO.prototype, 'value')).toMatchObject({
        minimum: 0,
        maximum: 100
      })
      expect(Reflect.getMetadata('swagger/apiModelProperties', WideInt32DTO.prototype, 'value')).toMatchObject({
        minimum: -2147483648,
        maximum: 2147483647
      })
      expect(validateSync(plainToInstance(NarrowInt32DTO, { value: 50 }))).toHaveLength(0)
      expect(validateSync(plainToInstance(NarrowInt32DTO, { value: -1 }))[0].constraints).toHaveProperty('min')
      expect(validateSync(plainToInstance(NarrowInt32DTO, { value: 101 }))[0].constraints).toHaveProperty('max')
      expect(validateSync(plainToInstance(WideInt32DTO, { value: -2147483649 }))[0].constraints).toHaveProperty('min')
      expect(validateSync(plainToInstance(WideInt32DTO, { value: 2147483648 }))[0].constraints).toHaveProperty('max')
    })
  })

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
