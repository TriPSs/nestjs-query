import { ArgsType, Field, ReturnTypeFuncValue } from '@nestjs/graphql';
import { Class } from '@rezonate/nestjs-query-core';
import { IsNotEmpty } from 'class-validator';

import { getDTOIdTypeOrDefault } from '../common';

export interface FindOneArgsType {
	id: string | number;
}

const cache = new Map<ReturnTypeFuncValue, Class<FindOneArgsType>>();

/**
 * The input type for delete one endpoints.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export function FindOneArgsType(DTOClass: Class<unknown>): Class<FindOneArgsType> {
	const IDType = getDTOIdTypeOrDefault([DTOClass]);
	const cached = cache.get(IDType);
	if (cached) return cached;

	@ArgsType()
	class FindOneArgs implements FindOneArgsType {
		@IsNotEmpty()
		@Field(() => IDType, { description: 'The id of the record to find.' })
		id!: string | number;
	}

	cache.set(IDType, FindOneArgs);

	return FindOneArgs;
}
