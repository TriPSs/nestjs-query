import { Resolver } from '@nestjs/graphql';
import { Class, DeepPartial, QueryService } from '@rezonate/nestjs-query-core';

import { mergeBaseResolverOpts } from '../common';
import { BaseResolverOptions } from '../decorators/resolver-method.decorator';
import { ConnectionOptions, PagingStrategies } from '../types';
import { AggregateableByTime } from './aggregate.by.time.resolver';
import { Aggregateable, AggregateResolver, AggregateResolverOpts } from './aggregate.resolver';
import { Creatable, CreateResolver, CreateResolverOpts } from './create.resolver';
import { Deletable, DeleteResolver, DeleteResolverOpts } from './delete.resolver';
import { Readable, ReadResolverFromOpts, ReadResolverOpts } from './read.resolver';
import { Referenceable, ReferenceResolverOpts } from './reference.resolver';
import { Relatable } from './relations';
import { RelatableOpts } from './relations/relations.resolver';
import { BaseServiceResolver, MergePagingStrategyOpts } from './resolver.interface';
import { Updateable, UpdateResolver, UpdateResolverOpts } from './update.resolver';

export interface CRUDResolverOpts<
	DTO,
	R extends ReadResolverOpts<DTO> = ReadResolverOpts<DTO>,
	PS extends PagingStrategies = PagingStrategies.CURSOR,
> extends BaseResolverOptions,
	Pick<ConnectionOptions, 'enableTotalCount'> {
	/**
	 * The DTO that should be used as input for create endpoints.
	 */
	CreateDTOClass?: Class<DeepPartial<DTO>>;
	/**
	 * The DTO that should be used as input for update endpoints.
	 */
	UpdateDTOClass?: Class<DeepPartial<DTO>>;
	enableSubscriptions?: boolean;
	pagingStrategy?: PS;
	enableAggregate?: boolean;
	create?: CreateResolverOpts<DTO>;
	read?: R;
	update?: UpdateResolverOpts<DTO>;
	delete?: DeleteResolverOpts<DTO>;
	referenceBy?: ReferenceResolverOpts;
	aggregate?: AggregateResolverOpts;
	limitAggregateByTableSize?: boolean;
}

export interface CRUDResolver<
	DTO,
	R extends ReadResolverOpts<DTO>,
	QS extends QueryService<DTO> = QueryService<DTO>,
> extends CreateResolver<DTO, QS>,
	ReadResolverFromOpts<DTO, R, QS>,
	UpdateResolver<DTO, QS>,
	DeleteResolver<DTO, QS>,
	AggregateResolver<DTO, QS> {
}

function extractRelatableOpts<DTO>(
	opts: CRUDResolverOpts<DTO, ReadResolverOpts<DTO>, PagingStrategies>,
): RelatableOpts {
	const { enableTotalCount, enableAggregate, aggregate } = opts;
	return mergeBaseResolverOpts<RelatableOpts>({ enableAggregate, enableTotalCount, ...aggregate }, opts);
}

function extractAggregateResolverOpts<DTO>(
	opts: CRUDResolverOpts<DTO, ReadResolverOpts<DTO>, PagingStrategies>,
): AggregateResolverOpts {
	const { enableAggregate, aggregate } = opts;
	return mergeBaseResolverOpts<AggregateResolverOpts>({ enabled: enableAggregate, ...aggregate }, opts);
}

function extractCreateResolverOpts<DTO>(
	opts: CRUDResolverOpts<DTO, ReadResolverOpts<DTO>, PagingStrategies>,
): CreateResolverOpts<DTO> {
	const { CreateDTOClass, enableSubscriptions, create } = opts;
	return mergeBaseResolverOpts<CreateResolverOpts<DTO>>({ CreateDTOClass, enableSubscriptions, ...create }, opts);
}

function extractReadResolverOpts<DTO, R extends ReadResolverOpts<DTO>, PS extends PagingStrategies>(
	opts: CRUDResolverOpts<DTO, R, PagingStrategies>,
): MergePagingStrategyOpts<DTO, R, PS> {
	const { enableTotalCount, pagingStrategy, read } = opts;
	return mergeBaseResolverOpts({
		enableTotalCount,
		pagingStrategy, ...read,
	} as MergePagingStrategyOpts<DTO, R, PS>, opts);
}

function extractUpdateResolverOpts<DTO>(
	opts: CRUDResolverOpts<DTO, ReadResolverOpts<DTO>, PagingStrategies>,
): UpdateResolverOpts<DTO> {
	const { UpdateDTOClass, enableSubscriptions, update } = opts;
	return mergeBaseResolverOpts<UpdateResolverOpts<DTO>>({ UpdateDTOClass, enableSubscriptions, ...update }, opts);
}

function extractDeleteResolverOpts<DTO>(
	opts: CRUDResolverOpts<DTO, ReadResolverOpts<DTO>, PagingStrategies>,
): DeleteResolverOpts<DTO> {
	const { enableSubscriptions, delete: deleteArgs } = opts;
	return mergeBaseResolverOpts<DeleteResolverOpts<DTO>>({ enableSubscriptions, ...deleteArgs }, opts);
}

/**
 * Factory to create a resolver that includes all CRUD methods from [[CreateResolver]], [[ReadResolver]],
 * [[UpdateResolver]], and [[DeleteResolver]].
 *
 * ```ts
 * import { CRUDResolver } from '@rezonate/nestjs-query-graphql';
 * import { Resolver } from '@nestjs/graphql';
 * import { TodoItemDTO } from './dto/todo-item.dto';
 * import { TodoItemService } from './todo-item.service';
 *
 * @Resolver()
 * export class TodoItemResolver extends CRUDResolver(TodoItemDTO) {
 *   constructor(readonly service: TodoItemService) {
 *     super(service);
 *   }
 * }
 * ```
 * @param DTOClass - The DTO Class that the resolver is for. All methods will use types derived from this class.
 * @param opts - Options to customize the resolver.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const CRUDResolver = <
	DTO,
	R extends ReadResolverOpts<DTO> = ReadResolverOpts<DTO>,
	PS extends PagingStrategies = PagingStrategies.CURSOR,
>(
	DTOClass: Class<DTO>,
	opts: CRUDResolverOpts<DTO, R, PS> = {},
):Class<CRUDResolver<DTO, R, any>> => {

	@Resolver(() => DTOClass, { isAbstract: true })
	class BaseResolver extends BaseServiceResolver<DTO, any> {
	}

	const Mixins = [] as ((cls: Class<unknown>) => Class<unknown>)[];

	Mixins.push(Referenceable(DTOClass, opts.referenceBy ?? {}));
	Mixins.push(Relatable(DTOClass, extractRelatableOpts(opts)));
	if (opts.aggregate?.disabled) Mixins.push(Aggregateable(DTOClass, extractAggregateResolverOpts(opts)));
	if (opts.aggregate?.disabled) Mixins.push(AggregateableByTime(DTOClass, extractAggregateResolverOpts(opts)));
	if (opts.create?.disabled) Mixins.push(Creatable(DTOClass, extractCreateResolverOpts(opts)));
	if (opts.read?.disabled) Mixins.push(Readable(DTOClass, extractReadResolverOpts(opts)));
	if (opts.update?.disabled) Mixins.push(Updateable(DTOClass, extractUpdateResolverOpts(opts)));
	if (opts.delete?.disabled) Mixins.push(Deletable(DTOClass, extractDeleteResolverOpts(opts)));

	return Mixins.reduce(
		(CurrResolver, action) => action(CurrResolver),
		BaseResolver,
	) as Class<CRUDResolver<DTO, R, any>>;
};
