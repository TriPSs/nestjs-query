import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { Class, SortDirection, SortField, SortNulls, ValueReflector } from '@rezonate/nestjs-query-core';
import { IsEnum, IsIn } from 'class-validator';

import { getGraphqlObjectName } from '../../common';
import { getFilterableFields, getShareableDTO, setShareable } from '../../decorators';
import { IsUndefined } from '../validators';
import {
  getFilterableRelationFieldsNames,
} from '../../decorators/filterable-field.decorator';

registerEnumType(SortDirection, {
  name: 'SortDirection', // this one is mandatory
  description: 'Sort Directions', // this one is optional
});

registerEnumType(SortNulls, {
  name: 'SortNulls', // this one is mandatory
  description: 'Sort Nulls Options', // this one is optional
});

const reflector = new ValueReflector('nestjs-query:sort-type');

export function getOrCreateSortType<T>(TClass: Class<T>): Class<SortField<T>> {
  return reflector.memoize(TClass, () => {
    const prefix = getGraphqlObjectName(TClass, 'Unable to make SortType.');
    const fields = getFilterableFields(TClass);
    const isShareable = getShareableDTO(TClass);

    if (!fields.length) {
      throw new Error(`No fields found to create SortType for ${TClass.name}. Ensure fields are annotated with @FilterableField`);
    }

    const fieldNames = fields.map((field) => field.propertyName);

    const relationFieldNames = getFilterableRelationFieldsNames(TClass, fieldNames, ['one']);

    const fieldNameMap = {
        ...fieldNames.reduce((acc, field) => ({ ...acc, [field]: field }), {}),
        ...relationFieldNames.reduce((acc, field) => ({ ...acc, [field]: field }), {}),
    };

    registerEnumType(fieldNameMap, { name: `${prefix}SortFields` });

    @InputType(`${prefix}Sort`)
    class Sort {
      @Field(() => fieldNameMap)
      @IsIn(fieldNames)
      field!: keyof T;

      @Field(() => SortDirection)
      @IsEnum(SortDirection)
      direction!: SortDirection;

      @Field(() => SortNulls, { nullable: true })
      @IsUndefined()
      @IsEnum(SortNulls)
      nulls?: SortNulls;
    }

    if (isShareable) setShareable(Sort);

    return Sort;
  });
}
