// eslint-disable-next-line max-classes-per-file
import { Args, ArgsType, InputType, PartialType, Resolver } from '@nestjs/graphql';
import {
  Class,
  DeepPartial,
  DeleteManyResponse,
  Filter,
  mergeFilter,
  QueryService,
  UpdateManyResponse,
} from '@rezonate/nestjs-query-core';
import omit from 'lodash.omit';

import { OperationGroup } from '../auth';
import { DTONames, getDTONames } from '../common';
import { AuthorizerFilter, MutationHookArgs, ResolverMutation, ResolverSubscription } from '../decorators';
import { HookTypes } from '../hooks';
import { AuthorizerInterceptor, HookInterceptor } from '../interceptors';
import { EventType, getDTOEventName } from '../subscription';
import {
  MutationArgsType,
  SubscriptionArgsType,
  SubscriptionFilterInputType,
  UpdateManyInputType,
  UpdateManyResponseType,
  UpdateOneInputType,
} from '../types';
import { createSubscriptionFilter, getSubscriptionEventName } from './helpers';
import { BaseServiceResolver, ResolverClass, ServiceResolver, SubscriptionResolverOpts } from './resolver.interface';

export type UpdatedEvent<DTO> = { [eventName: string]: DTO };

export interface UpdateResolverOpts<DTO> extends SubscriptionResolverOpts {
  UpdateDTOClass?: Class<DeepPartial<DTO>>
  UpdateOneInput?: Class<UpdateOneInputType<DTO>>
  UpdateManyInput?: Class<UpdateManyInputType<DTO>>
}

export interface UpdateResolver<DTO, QS extends QueryService<DTO>> extends ServiceResolver<DTO, QS> {
  updateOne(input: MutationArgsType<UpdateOneInputType<DTO>>, authFilter?: Filter<DTO>): Promise<DTO>

  updateMany(input: MutationArgsType<UpdateManyInputType<DTO>>, authFilter?: Filter<DTO>): Promise<UpdateManyResponse>

  updatedOneSubscription(input?: SubscriptionArgsType<DTO>, authFilter?: Filter<DTO>): AsyncIterator<UpdatedEvent<DTO>>

  updatedManySubscription(authFilter?: Filter<DTO>): AsyncIterator<UpdatedEvent<DeleteManyResponse>>
}

/** @internal */
const defaultUpdateInput = <DTO>(dtoNames: DTONames, DTOClass: Class<DTO>): Class<DeepPartial<DTO>> => {
  @InputType(`Update${dtoNames.baseName}`)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class UpdateType extends PartialType(DTOClass, InputType) {}

  return UpdateType as Class<DeepPartial<DTO>>;
};

/** @internal */
const defaultUpdateOneInput = <DTO>(
  dtoNames: DTONames,
  DTOClass: Class<DTO>,
  UpdateDTO: Class<DeepPartial<DTO>>,
): Class<UpdateOneInputType<DTO>> => {
  const { baseName } = dtoNames;

  @InputType(`UpdateOne${baseName}Input`)
  class UM extends UpdateOneInputType(DTOClass, UpdateDTO) {}

  return UM;
};

/** @internal */
const defaultUpdateManyInput = <DTO>(
  dtoNames: DTONames,
  DTOClass: Class<DTO>,
  UpdateDTO: Class<DeepPartial<DTO>>,
): Class<UpdateManyInputType<DTO>> => {
  const { pluralBaseName } = dtoNames;

  @InputType(`UpdateMany${pluralBaseName}Input`)
  class UM extends UpdateManyInputType(DTOClass, UpdateDTO) {}

  return UM;
};

/**
 * @internal
 * Mixin to add `update` graphql endpoints.
 */
export const Updateable =
  <DTO, QS extends QueryService<DTO>>(DTOClass: Class<DTO>, opts: UpdateResolverOpts<DTO>) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): Class<UpdateResolver<DTO, QS>> & B => {
    const dtoNames = getDTONames(DTOClass, opts);
    const { baseName, pluralBaseName } = dtoNames;
    const UMR = UpdateManyResponseType();
    const enableSubscriptions = opts.enableSubscriptions === true;
    const enableOneSubscriptions = opts.one?.enableSubscriptions ?? enableSubscriptions;
    const enableManySubscriptions = opts.many?.enableSubscriptions ?? enableSubscriptions;
    const updateOneEvent = getDTOEventName(EventType.UPDATED_ONE, DTOClass);
    const updateManyEvent = getDTOEventName(EventType.UPDATED_MANY, DTOClass);
    const {
      UpdateDTOClass = defaultUpdateInput(dtoNames, DTOClass),
      UpdateOneInput = defaultUpdateOneInput(dtoNames, DTOClass, UpdateDTOClass),
      UpdateManyInput = defaultUpdateManyInput(dtoNames, DTOClass, UpdateDTOClass),
    } = opts;
    const updateOneMutationName = opts.one?.name ?? `updateOne${baseName}`;
    const updateManyMutationName = opts.many?.name ?? `updateMany${pluralBaseName}`;

    const commonResolverOpts = omit(opts, 'dtoName', 'one', 'many', 'UpdateDTOClass', 'UpdateOneInput', 'UpdateManyInput');

    @ArgsType()
    class UO extends MutationArgsType(UpdateOneInput) {}

    @ArgsType()
    class UM extends MutationArgsType(UpdateManyInput) {}

    @InputType(`UpdateOne${baseName}SubscriptionFilterInput`)
    class SI extends SubscriptionFilterInputType(DTOClass) {}

    @ArgsType()
    class UOSA extends SubscriptionArgsType(SI) {}

    const updateOneSubscriptionFilter = createSubscriptionFilter(SI, updateOneEvent);

    @Resolver(() => DTOClass, { isAbstract: true })
    class UpdateResolverBase extends BaseClass {
      @ResolverMutation(
        () => DTOClass,
        { name: updateOneMutationName, description: opts?.one?.description },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_UPDATE_ONE, UpdateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)],
        },
        commonResolverOpts,
        opts.one ?? {},
      )
      async updateOne(
        @MutationHookArgs() input: UO,
        @AuthorizerFilter({
          operationGroup: OperationGroup.UPDATE,
          many: false,
        })
        authorizeFilter?: Filter<DTO>,
      ): Promise<DTO> {
        const { id, update } = input.input;
        const updateResult = await this.service.updateOne(id, update, { filter: authorizeFilter ?? {} });
        if (enableOneSubscriptions) {
          await this.publishUpdatedOneEvent(updateResult, authorizeFilter);
        }
        return updateResult;
      }

      @ResolverMutation(
        () => UMR,
        { name: updateManyMutationName, description: opts?.many?.description },
        {
          interceptors: [HookInterceptor(HookTypes.BEFORE_UPDATE_MANY, UpdateDTOClass, DTOClass), AuthorizerInterceptor(DTOClass)],
        },
        commonResolverOpts,
        opts.many ?? {},
      )
      async updateMany(
        @MutationHookArgs() input: UM,
        @AuthorizerFilter({
          operationGroup: OperationGroup.UPDATE,
          many: true,
        })
        authorizeFilter?: Filter<DTO>,
      ): Promise<UpdateManyResponse> {
        const { update, filter } = input.input;
        const updateManyResponse = await this.service.updateMany(update, mergeFilter(filter, authorizeFilter ?? {}));
        if (enableManySubscriptions) {
          await this.publishUpdatedManyEvent(updateManyResponse, authorizeFilter);
        }
        return updateManyResponse;
      }

      async publishUpdatedOneEvent(dto: DTO, authorizeFilter?: Filter<DTO>): Promise<void> {
        if (this.pubSub) {
          const eventName = getSubscriptionEventName(updateOneEvent, authorizeFilter);
          await this.pubSub.publish(eventName, { [updateOneEvent]: dto });
        }
      }

      async publishUpdatedManyEvent(umr: UpdateManyResponse, authorizeFilter?: Filter<DTO>): Promise<void> {
        if (this.pubSub) {
          const eventName = getSubscriptionEventName(updateManyEvent, authorizeFilter);
          await this.pubSub.publish(eventName, { [updateManyEvent]: umr });
        }
      }

      @ResolverSubscription(() => DTOClass, { name: updateOneEvent, filter: updateOneSubscriptionFilter }, commonResolverOpts, {
        enableSubscriptions: enableOneSubscriptions,
        interceptors: [AuthorizerInterceptor(DTOClass)],
      })
      // input required so graphql subscription filtering will work.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updatedOneSubscription(
        @Args() input?: UOSA,
        @AuthorizerFilter({ operationGroup: OperationGroup.UPDATE, many: false })
        authorizeFilter?: Filter<DTO>,
      ): AsyncIterator<UpdatedEvent<DTO>> {
        if (!enableOneSubscriptions || !this.pubSub) {
          throw new Error(`Unable to subscribe to ${updateOneEvent}`);
        }
        const eventName = getSubscriptionEventName(updateOneEvent, authorizeFilter);
        return this.pubSub.asyncIterator(eventName);
      }

      @ResolverSubscription(() => UMR, { name: updateManyEvent }, commonResolverOpts, {
        enableSubscriptions: enableManySubscriptions,
        interceptors: [AuthorizerInterceptor(DTOClass)],
      })
      updatedManySubscription(
        @AuthorizerFilter({ operationGroup: OperationGroup.UPDATE, many: true })
        authorizeFilter?: Filter<DTO>,
      ): AsyncIterator<UpdatedEvent<DeleteManyResponse>> {
        if (!enableManySubscriptions || !this.pubSub) {
          throw new Error(`Unable to subscribe to ${updateManyEvent}`);
        }
        const eventName = getSubscriptionEventName(updateManyEvent, authorizeFilter);
        return this.pubSub.asyncIterator(eventName);
      }
    }

    return UpdateResolverBase;
  };
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional
export const UpdateResolver = <
  DTO,
  QS extends QueryService<DTO> = QueryService<DTO>,
>(
  DTOClass: Class<DTO>,
  opts: UpdateResolverOpts<DTO> = {},
): ResolverClass<DTO, QS, UpdateResolver<DTO, QS>> => Updateable(DTOClass, opts)(BaseServiceResolver);
