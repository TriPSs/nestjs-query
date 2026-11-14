import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { Field } from '../../src/decorators'

describe('Field', () => {
  describe('UUID format', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'

    class UUIDDTO {
      @Field({ format: 'uuid' })
      id!: string
    }

    class UUIDArrayDTO {
      @Field(() => [String], { format: 'uuid' })
      ids!: string[]
    }

    class OptionalUUIDDTO {
      @Field({ format: 'uuid', nullable: true })
      id?: string | null
    }

    it('accepts a valid UUID and preserves the OpenAPI format', () => {
      expect(validateSync(plainToInstance(UUIDDTO, { id: uuid }))).toHaveLength(0)
      expect(Reflect.getMetadata('swagger/apiModelProperties', UUIDDTO.prototype, 'id').format).toBe('uuid')
    })

    it.each(['not-a-uuid', '', null, undefined])('rejects an invalid or missing required UUID: %s', (id) => {
      const errors = validateSync(plainToInstance(UUIDDTO, { id }))

      expect(errors).toHaveLength(1)
      expect(errors[0].constraints).toHaveProperty('isUuid')
    })

    it('validates every array element', () => {
      expect(validateSync(plainToInstance(UUIDArrayDTO, { ids: [uuid] }))).toHaveLength(0)
      const errors = validateSync(plainToInstance(UUIDArrayDTO, { ids: [uuid, 'not-a-uuid'] }))

      expect(errors).toHaveLength(1)
      expect(errors[0].constraints).toHaveProperty('isUuid')
    })

    it.each([null, undefined, uuid])('accepts an optional UUID: %s', (id) => {
      expect(validateSync(plainToInstance(OptionalUUIDDTO, { id }))).toHaveLength(0)
    })

    it('does not add UUID validation to other string formats', () => {
      class StringDTO {
        @Field()
        value!: string

        @Field({ format: 'custom' })
        custom!: string
      }

      expect(validateSync(plainToInstance(StringDTO, { value: 'text', custom: 'text' }))).toHaveLength(0)
    })
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
