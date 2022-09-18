import * as nestjsGraphQL from '@nestjs/graphql';
import { FilterableField } from '@rezonate/nestjs-query-graphql';
import { getFilterableFields } from '../../src/decorators';
import { Field, registerEnumType } from '@nestjs/graphql';

const { Float, ObjectType, Int } = nestjsGraphQL;

jest.mock('@nestjs/graphql', () => ({
  Field: jest.fn(() => () => null),
  registerEnumType: jest.fn(() => null),
  ObjectType: jest.fn(() => () => null),
}));
const mockField = jest.mocked(Field);

describe('FilterableField decorator', (): void => {
  beforeAll(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should store metadata', () => {
    const floatReturnFunc = () => Float;
    @ObjectType('test')
    class TestDto {
      @FilterableField()
      stringField!: string;

      @FilterableField({ nullable: true })
      stringOptionalField?: string;

      @FilterableField(floatReturnFunc, { nullable: true })
      floatField?: number;

      @FilterableField(undefined, { nullable: true })
      numberField?: number;

      @FilterableField({ filterOnly: true })
      filterOnlyField!: string;
    }
    const fields = getFilterableFields(TestDto);
    expect(fields).toMatchObject([
      { propertyName: 'stringField', target: String, advancedOptions: undefined, returnTypeFunc: undefined },
      {
        propertyName: 'stringOptionalField',
        target: String,
        advancedOptions: { nullable: true },
        returnTypeFunc: undefined
      },
      {
        propertyName: 'floatField',
        target: Number,
        advancedOptions: { nullable: true },
        returnTypeFunc: floatReturnFunc
      },
      { propertyName: 'numberField', target: Number, advancedOptions: { nullable: true }, returnTypeFunc: undefined },
      {
        propertyName: 'filterOnlyField',
        target: String,
        advancedOptions: { filterOnly: true },
        returnTypeFunc: undefined
      }
    ]);
    expect(mockField).toHaveBeenCalledTimes(4);
    expect(mockField).toHaveBeenNthCalledWith(1);
    expect(mockField).toHaveBeenNthCalledWith(2, { nullable: true });
    expect(mockField).toHaveBeenNthCalledWith(3, floatReturnFunc, { nullable: true });
    expect(mockField).toHaveBeenNthCalledWith(4, { nullable: true });
  });

  describe('getFilterableObjectFields', () => {
    @ObjectType({ isAbstract: true })
    class BaseType {
      @FilterableField(() => Int)
      id!: number;

      @Field()
      referenceId!: number;
    }

    @ObjectType()
    class ImplementingClass extends BaseType {
      @FilterableField()
      implemented!: boolean;
    }

    @ObjectType()
    class DuplicateImplementor extends ImplementingClass {
      @FilterableField({ name: 'test' })
      id!: number;

      @Field()
      someReferenceId!: number;
    }

    it('should return filterable fields for a type', () => {
      expect(getFilterableFields(BaseType)).toEqual([
        { propertyName: 'id', target: Number, returnTypeFunc: expect.any(Function) }
      ]);
    });

    it('should return inherited filterable fields for a type', () => {
      expect(getFilterableFields(ImplementingClass)).toEqual([
        { propertyName: 'id', target: Number, returnTypeFunc: expect.any(Function) },
        { propertyName: 'implemented', target: Boolean }
      ]);
    });

    it('should exclude duplicate fields inherited filterable fields for a type', () => {
      expect(getFilterableFields(DuplicateImplementor)).toEqual([
        { propertyName: 'implemented', target: Boolean },
        { propertyName: 'id', target: Number, advancedOptions: { name: 'test' } }
      ]);
    });
  });
});
