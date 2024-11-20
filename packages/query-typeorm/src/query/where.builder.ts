import { Filter, FilterComparisons, FilterFieldComparison } from '@rezonate/nestjs-query-core';
import { Brackets, ColumnType } from 'typeorm';

import type { WhereExpressionBuilder } from 'typeorm';

import { NestedRecord } from './filter-query.builder';
import { EntityComparisonField, SQLComparisonBuilder } from './sql-comparison.builder';

const FreeTextColumnTypes = new Set<ColumnType>([
	'tinytext',
	'mediumtext',
	'text',
	'ntext',
	'citext',
	'longtext',
	'shorttext',
	'linestring',
	'multilinestring',
	'character varying',
	'varying character',
	'char varying',
	'national varchar',
	'character',
	'native character',
	'varchar',
	'char',
	'nchar',
	'national char',
	'varchar2',
	'nvarchar2',
	'alphanum',
	'shorttext',
	'string',
	String,
]);

export type ColumnMetadata = {
	isArray: boolean;
	databaseName: string;
	type: ColumnType
};

/**
 * @internal
 * Builds a WHERE clause from a Filter.
 */
export class WhereBuilder<Entity> {
	constructor(readonly sqlComparisonBuilder: SQLComparisonBuilder<Entity> = new SQLComparisonBuilder<Entity>()) {
	}

	/**
	 * Builds a WHERE clause from a Filter.
	 * @param where - the `typeorm` WhereExpression
	 * @param filter - the filter to build the WHERE clause from.
	 * @param relationNames - the relations tree.
	 * @param columns - the entity columns definition.
	 * @param alias - optional alias to use to qualify an identifier
	 */

	public build<Where extends WhereExpressionBuilder>(
		where: Where,
		filter: Filter<Entity>,
		relationNames: NestedRecord,
		columns: ColumnMetadata[],
		alias?: string,
	): Where {
		const { and, or, freeTextQuery } = filter;
		if (freeTextQuery) {
			this.filterFreeText(where, freeTextQuery, columns, relationNames, alias);
		}
		if (and && and.length) {
			this.filterAnd(where, and, relationNames, columns, alias);
		}
		if (or && or.length) {
			this.filterOr(where, or, relationNames, columns, alias);
		}
		return this.filterFields(where, filter, columns, relationNames, alias);
	}

	private filterFreeText<Where extends WhereExpressionBuilder>(
		where: Where,
		freeTextQuery: string,
		columns: ColumnMetadata[],
		relationNames: NestedRecord,
		alias?: string,
	): Where {
		const getFilter = (c: ColumnMetadata) =>
			({ [c.isArray ? 'containsLike' : 'iLike']: `%${freeTextQuery}%` } as { iLike: string } | {
				containsLike: string
			});
		const filterableColumns = columns.filter((c) => FreeTextColumnTypes.has(c.type));
		return where.andWhere(
			new Brackets((qb) =>
				filterableColumns.reduce(
					(w, c) =>
						qb.orWhere(this.createBrackets({ [c.databaseName]: getFilter(c) } as Filter<Entity>, relationNames, columns, alias)),
					qb,
				),
			),
		);
	}

	/**
	 * ANDs multiple filters together. This will properly group every clause to ensure proper precedence.
	 *
	 * @param where - the `typeorm` WhereExpression
	 * @param filters - the array of filters to AND together
	 * @param relationNames - the relations tree.
	 * @param alias - optional alias to use to qualify an identifier
	 */
	private filterAnd<Where extends WhereExpressionBuilder>(
		where: Where,
		filters: Filter<Entity>[],
		relationNames: NestedRecord,
		columns: ColumnMetadata[],
		alias?: string,
	): Where {
		return where.andWhere(
			new Brackets((qb) => filters.reduce((w, f) => qb.andWhere(this.createBrackets(f, relationNames, columns, alias)), qb)),
		);
	}

	/**
	 * ORs multiple filters together. This will properly group every clause to ensure proper precedence.
	 *
	 * @param where - the `typeorm` WhereExpression
	 * @param filter - the array of filters to OR together
	 * @param relationNames - the relations tree.
	 * @param alias - optional alias to use to qualify an identifier
	 */
	private filterOr<Where extends WhereExpressionBuilder>(
		where: Where,
		filter: Filter<Entity>[],
		relationNames: NestedRecord,
		columns: ColumnMetadata[],
		alias?: string,
	): Where {
		return where.andWhere(
			new Brackets((qb) => filter.reduce((w, f) => qb.orWhere(this.createBrackets(f, relationNames, columns, alias)), qb)),
		);
	}

	/**
	 * Wraps a filter in brackets to ensure precedence.
	 * ```
	 * {a: { eq: 1 } } // "(a = 1)"
	 * {a: { eq: 1 }, b: { gt: 2 } } // "((a = 1) AND (b > 2))"
	 * ```
	 * @param filter - the filter to wrap in brackets.
	 * @param relationNames - the relations tree.
	 * @param alias - optional alias to use to qualify an identifier
	 */
	private createBrackets(
		filter: Filter<Entity>,
		relationNames: NestedRecord,
		columns: ColumnMetadata[],
		alias?: string,
	): Brackets {
		return new Brackets((qb) => this.build(qb, filter, relationNames, columns, alias));
	}

	/**
	 * Creates field comparisons from a filter. This method will ignore and/or properties.
	 * @param where - the `typeorm` WhereExpression
	 * @param filter - the filter with fields to create comparisons for.
	 * @param relationNames - the relations tree.
	 * @param alias - optional alias to use to qualify an identifier
	 */
	private filterFields<Where extends WhereExpressionBuilder>(
		where: Where,
		filter: Filter<Entity>,
		columns: ColumnMetadata[],
		relationNames: NestedRecord,
		alias?: string,
	): Where {
		return Object.keys(filter).reduce((w, field) => {
			if (field !== 'and' && field !== 'or' && field !== 'freeTextQuery') {
				return this.withFilterComparison(
					where,
					field as keyof Entity,
					this.getField(filter, field as keyof Entity),
					columns,
					relationNames,
					alias,
				);
			}
			return w;
		}, where);
	}

	private getField<K extends keyof FilterComparisons<Entity>>(
		obj: FilterComparisons<Entity>,
		field: K,
	): FilterFieldComparison<Entity[K]> {
		return obj[field] as FilterFieldComparison<Entity[K]>;
	}

	private withFilterComparison<T extends keyof Entity, Where extends WhereExpressionBuilder>(
		where: Where,
		field: T,
		cmp: FilterFieldComparison<Entity[T]>,
		columns: ColumnMetadata[],
		relationNames: NestedRecord,
		alias?: string,
	): Where {
		if (relationNames[field as string]) {
			return this.withRelationFilter(where, field, cmp as Filter<Entity[T]>, columns, relationNames[field as string]);
		}
		return where.andWhere(
			new Brackets((qb) => {
				const opts = Object.keys(cmp) as (keyof FilterFieldComparison<Entity[T]>)[];
				const [relation, ...fields] = field.toString().split('_');
				const sqlComparisons = opts.map((cmpType) =>
					relationNames[relation]
						? this.sqlComparisonBuilder.build(
							fields?.join('') as T,
							cmpType,
							cmp[cmpType] as EntityComparisonField<Entity, T>,
							relation,
						)
						: this.sqlComparisonBuilder.build(field, cmpType, cmp[cmpType] as EntityComparisonField<Entity, T>, alias),
				);
				sqlComparisons.map(({ sql, params }) => qb.orWhere(sql, params));
			}),
		);
	}

	private withRelationFilter<T extends keyof Entity, Where extends WhereExpressionBuilder>(
		where: Where,
		field: T,
		cmp: Filter<Entity[T]>,
		columns: ColumnMetadata[],
		relationNames: NestedRecord,
	): Where {
		return where.andWhere(
			new Brackets((qb) => {
				const relationWhere = new WhereBuilder<Entity[T]>();
				return relationWhere.build(qb, cmp, relationNames, columns, field as string);
			}),
		);
	}
}
