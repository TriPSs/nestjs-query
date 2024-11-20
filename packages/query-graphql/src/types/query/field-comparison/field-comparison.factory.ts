// eslint-disable-next-line max-classes-per-file
import {
	Field,
	Float as GqlFloat,
	GraphQLISODateTime,
	GraphQLTimestamp,
	ID,
	InputType,
	Int as GqlInt,
	ReturnTypeFunc,
	ReturnTypeFuncValue,
} from '@nestjs/graphql';
import { Class, FilterComparisonOperators, FilterFieldComparison, isNamed } from '@rezonate/nestjs-query-core';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { upperCaseFirst } from 'upper-case-first';

import { getGraphqlEnumMetadata } from '../../../common';
import { SkipIf } from '../../../decorators';
import { IsUndefined } from '../../validators';
import { isInAllowedList } from '../helpers';
import { getOrCreateBooleanFieldComparison } from './boolean-field-comparison.type';
import { getOrCreateDateFieldComparison } from './date-field-comparison.type';
import { getOrCreateFloatFieldComparison } from './float-field-comparison.type';
import { getOrCreateIntFieldComparison } from './int-field-comparison.type';
import { getOrCreateJSONFieldComparison } from './json-field-comparison.type';
import { getOrCreateNumberFieldComparison } from './number-field-comparison.type';
import { getOrCreateStringFieldComparison } from './string-field-comparison.type';
import { getOrCreateStringListFieldComparison } from './string-list-field-comparison.type';
import { getOrCreateTimestampFieldComparison } from './timestamp-field-comparison.type';
import { getOrCreateDateFieldFutureComparison } from './date-field-future-comparison.type';

enum TypeNames {
	String = 'String',
	StringList = 'StringList',
	Number = 'Number',
	Int = 'Int',
	Float = 'Float',
	Boolean = 'Boolean',
	JSON = 'JSON',
	Date = 'Date',
	DateFuture = 'DateFuture',
	DateTime = 'DateTime',
	DateTimeFuture = 'DateTimeFuture',
	Timestamp = 'Timestamp',
}

/** @internal */
const filterComparisonMap = new Map<string, () => Class<FilterFieldComparison<unknown>>>();
filterComparisonMap.set('StringFilterComparison', getOrCreateStringFieldComparison);
filterComparisonMap.set('StringListFilterComparison', getOrCreateStringListFieldComparison);
filterComparisonMap.set('NumberFilterComparison', getOrCreateNumberFieldComparison);
filterComparisonMap.set('IntFilterComparison', getOrCreateIntFieldComparison);
filterComparisonMap.set('FloatFilterComparison', getOrCreateFloatFieldComparison);
filterComparisonMap.set('BooleanFilterComparison', getOrCreateBooleanFieldComparison);
filterComparisonMap.set('JSONFilterComparison', getOrCreateJSONFieldComparison);
filterComparisonMap.set('DateFilterComparison', getOrCreateDateFieldComparison);
filterComparisonMap.set('DateFutureFilterComparison', getOrCreateDateFieldFutureComparison);
filterComparisonMap.set('DateTimeFilterComparison', getOrCreateDateFieldComparison);
filterComparisonMap.set('DateTimeFutureFilterComparison', getOrCreateDateFieldFutureComparison);
filterComparisonMap.set('TimestampFilterComparison', getOrCreateTimestampFieldComparison);

const knownTypes: Set<ReturnTypeFuncValue> = new Set([
	String,
	Number,
	Boolean,
	GqlInt,
	GqlFloat,
	ID,
	Date,
	GraphQLISODateTime,
	GraphQLTimestamp,
	JSON,
]);

const knownArrTypes: Set<ReturnTypeFuncValue> = new Set([String]);

const allowedBetweenTypes: Set<ReturnTypeFuncValue> = new Set([Number, GqlInt, GqlFloat, Date, GraphQLISODateTime, GraphQLTimestamp]);

/** @internal */
const getTypeName = (SomeType: ReturnTypeFuncValue, isJSON?: boolean, futureDate?: boolean): `${TypeNames}` => {
	const futureSuffix = futureDate ? 'Future' : '';
	if (isJSON) {
		return 'JSON' as const;
	}
	if (knownTypes.has(SomeType) || isNamed(SomeType)) {
		const typeName = (SomeType as { name: string }).name;
		return (upperCaseFirst(typeName) + futureSuffix) as `${TypeNames}`;
	}
	if (typeof SomeType === 'object' && Array.isArray(SomeType)) {
		if (knownArrTypes.has(SomeType?.[0] as ReturnTypeFuncValue)) {
			const typeName = getTypeName(SomeType?.[0] as ReturnTypeFuncValue, false, futureDate);
			return `${typeName}List` as `${TypeNames}`;
		}
		throw new Error(`Unable to create filter comparison for ${JSON.stringify(SomeType)}.`);
	}
	if (typeof SomeType === 'object') {
		const enumType = getGraphqlEnumMetadata(SomeType);
		if (enumType) {
			return upperCaseFirst(enumType.name) as `${TypeNames}`;
		}
	}
	throw new Error(`Unable to create filter comparison for ${JSON.stringify(SomeType)}.`);
};

const isCustomFieldComparison = <T>(options: FilterComparisonOptions<T>): boolean => !!options.allowedComparisons;

const getComparisonTypeName = <T>(fieldType: ReturnTypeFuncValue, options: FilterComparisonOptions<T>): string => {
	if (isCustomFieldComparison(options)) {
		return `${options.fieldName}FilterComparison`;
	}
	return `${getTypeName(fieldType, options.isJSON, options.futureDate)}FilterComparison`;
};

type FilterComparisonOptions<T> = {
	FieldType: Class<T>
	fieldName: string
	allowedComparisons?: FilterComparisonOperators<T>[]
	isJSON?: boolean
	returnTypeFunc?: ReturnTypeFunc
	futureDate?: boolean
};

/** @internal */
export function createFilterComparisonType<T>(options: FilterComparisonOptions<T>): Class<FilterFieldComparison<T>> {
	const { FieldType, returnTypeFunc } = options;
	const fieldType: ReturnTypeFuncValue = returnTypeFunc ? returnTypeFunc() : FieldType;
	const firstTypeOfArray = Array.isArray(fieldType) ? fieldType[0] : fieldType;
	const inputName = getComparisonTypeName(fieldType as ReturnTypeFuncValue, options);
	const generator = filterComparisonMap.get(inputName);

	if (generator) {
		return generator() as Class<FilterFieldComparison<T>>;
	}

	const isNotAllowed = (val: FilterComparisonOperators<unknown>, mustBeType?: Set<ReturnTypeFuncValue>) => () => {
		const comparisonAllowed = isInAllowedList(options.allowedComparisons, val as unknown);

		if (comparisonAllowed) {
			return mustBeType && !mustBeType.has(fieldType);
		}

		return true;
	};

	@InputType(`${inputName}Between`)
	class FcBetween {
		@Field(() => fieldType, { nullable: false })
		@IsDate()
		lower!: T;

		@Field(() => fieldType, { nullable: false })
		@IsDate()
		upper!: T;
	}

	@InputType(inputName)
	class Fc {
		@SkipIf(isNotAllowed('is'), Field(() => Boolean, { nullable: true }))
		@IsBoolean()
		@IsOptional()
		is?: boolean | null;

		@SkipIf(isNotAllowed('isNot'), Field(() => Boolean, { nullable: true }))
		@IsBoolean()
		@IsOptional()
		isNot?: boolean | null;

		@SkipIf(isNotAllowed('eq'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		eq?: T;

		@SkipIf(isNotAllowed('neq'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		neq?: T;

		@SkipIf(isNotAllowed('gt'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		gt?: T;

		@SkipIf(isNotAllowed('gte'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		gte?: T;

		@SkipIf(isNotAllowed('lt'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		lt?: T;

		@SkipIf(isNotAllowed('lte'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		lte?: T;

		@SkipIf(isNotAllowed('like'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		like?: T;

		@SkipIf(isNotAllowed('notLike'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		notLike?: T;

		@SkipIf(isNotAllowed('iLike'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		iLike?: T;

		@SkipIf(isNotAllowed('notILike'), Field(() => fieldType, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		notILike?: T;

		@SkipIf(isNotAllowed('in'), Field(() => [fieldType], { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		in?: T[];

		@SkipIf(isNotAllowed('notIn'), Field(() => [fieldType], { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		notIn?: T[];

		@SkipIf(isNotAllowed('between', allowedBetweenTypes), Field(() => FcBetween, { nullable: true }))
		@ValidateNested()
		@Type(() => FcBetween)
		between?: T;

		@SkipIf(isNotAllowed('notBetween', allowedBetweenTypes), Field(() => FcBetween, { nullable: true }))
		@ValidateNested()
		@Type(() => FcBetween)
		notBetween?: T;

		@SkipIf(isNotAllowed('contains'), Field(() => firstTypeOfArray, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		contains?: string;

		@SkipIf(isNotAllowed('notContains'), Field(() => firstTypeOfArray, { nullable: true }))
		@IsUndefined()
		@Type(() => FieldType)
		notContains?: string;
	}

	filterComparisonMap.set(inputName, () => Fc);
	return Fc as Class<FilterFieldComparison<T>>;
}
