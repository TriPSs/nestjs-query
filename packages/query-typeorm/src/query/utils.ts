import shajs from 'sha.js';


/**
 * This file contains code copied from the typeorm repo, since original NestJS query code uses
 * internal functions in typeorm that are no longer exposed we need to copy the functionality
 */

// From https://github.com/typeorm/typeorm/blob/master/src/util/StringUtils.ts#L87
import { Driver } from 'typeorm';

export function shorten(input: string): string {
	const segmentLength = 4;
	const separator = '__';
	const termLength = 2;

	const segments = input.split(separator);
	const shortSegments = segments.reduce((acc: string[], val: string) => {
		// split the given segment into many terms based on an eventual camel cased name
		const segmentTerms = val
			.replace(/([a-z\xE0-\xFF])([A-Z\xC0-\xDF])/g, '$1 $2')
			.split(' ');
		// "OrderItemList" becomes "OrItLi", while "company" becomes "comp"
		const length = segmentTerms.length > 1 ? termLength : segmentLength;
		const shortSegment = segmentTerms
			.map((term) => term.substr(0, length))
			.join('');

		acc.push(shortSegment);
		return acc;
	}, []);

	return shortSegments.join(separator);
}


// From https://github.com/typeorm/typeorm/blob/master/src/util/StringUtils.ts#L119;
export function hash(input: string, options: { length?: number } = {}): string {
	const hashFunction = shajs('sha1');
	hashFunction.update(input, 'utf8');
	const hashedInput = hashFunction.digest('hex');
	if (options.length) {
		return hashedInput.slice(0, options.length);
	}
	return hashedInput;
}

// From https://github.com/typeorm/typeorm/blob/master/src/driver/DriverUtils.ts#L125
export function buildAlias(
	{ maxAliasLength }: Driver,
	buildOptions: { shorten?: boolean; joiner?: string } | undefined,
	...alias: string[]
): string {
	const joiner =
		buildOptions && buildOptions.joiner ? buildOptions.joiner : '_';

	const newAlias = alias.length === 1 ? alias[0] : alias.join(joiner);

	if (
		maxAliasLength &&
		maxAliasLength > 0 &&
		newAlias.length > maxAliasLength
	) {
		if (buildOptions && buildOptions.shorten === true) {
			const shortenedAlias = shorten(newAlias);
			if (shortenedAlias.length < maxAliasLength) {
				return shortenedAlias;
			}
		}

		return hash(newAlias, { length: maxAliasLength });
	}

	return newAlias;
}