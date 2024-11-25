// eslint-disable-next-line max-classes-per-file
import { Inject, Provider } from '@nestjs/common';
import { Resolver } from '@nestjs/graphql';
import {
  Class,
  InjectQueryService,
  QueryService,
} from '@rezonate/nestjs-query-core';
import { PubSub } from 'graphql-subscriptions';

import { InjectPubSub } from '../decorators';
import { CRUDResolver, CRUDResolverOpts, FederationResolver } from '../resolvers';
import { PagingStrategies } from '../types/query/paging';

export type CRUDAutoResolverOpts<DTO, R, PS extends PagingStrategies> = CRUDResolverOpts<DTO, R, PS> & {
  DTOClass: Class<DTO>
};

export type EntityCRUDAutoResolverOpts<DTO, Entity, R, PS extends PagingStrategies> = CRUDAutoResolverOpts<
  DTO,
  R,
  PS
> & {
  EntityClass: Class<Entity>
};

export type ServiceCRUDAutoResolverOpts<DTO, QueryService, R, PS extends PagingStrategies> = CRUDAutoResolverOpts<
  DTO,
  R,
  PS
> & {
  ServiceClass: Class<QueryService>
};

export type FederatedAutoResolverOpts<DTO, Service> = {
  type: 'federated'
  DTOClass: Class<DTO>
  Service: Class<Service>
};

export type AutoResolverOpts<DTO, EntityService, R, PS extends PagingStrategies> =
  | EntityCRUDAutoResolverOpts<DTO, EntityService, R, PS>
  | ServiceCRUDAutoResolverOpts<DTO, EntityService, R, PS>
  | FederatedAutoResolverOpts<DTO, EntityService>;

export const isFederatedResolverOpts = <DTO, MaybeService, R, PS extends PagingStrategies>(
  opts: AutoResolverOpts<DTO, MaybeService, R, PS>,
): opts is FederatedAutoResolverOpts<DTO, MaybeService> => 'type' in opts && opts.type === 'federated';

export const isServiceCRUDAutoResolverOpts = <DTO, MaybeService, R, PS extends PagingStrategies>(
  opts: AutoResolverOpts<DTO, MaybeService, R, PS>,
): opts is ServiceCRUDAutoResolverOpts<DTO, MaybeService, R, PS> => 'DTOClass' in opts && 'ServiceClass' in opts;

const getResolverToken = <DTO>(DTOClass: Class<DTO>): string => `${DTOClass.name}AutoResolver`;
const getFederatedResolverToken = <DTO>(DTOClass: Class<DTO>): string => `${DTOClass.name}FederatedAutoResolver`;

function createFederatedResolver<DTO, Service>(resolverOpts: FederatedAutoResolverOpts<DTO, Service>): Provider {
  const { DTOClass } = resolverOpts;

  @Resolver(() => DTOClass)
  class AutoResolver extends FederationResolver(DTOClass) {
    constructor(
      @Inject(resolverOpts.Service) readonly service: QueryService<DTO>,
      @InjectPubSub() readonly pubSub: PubSub,
    ) {
      super(service);
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoResolver, 'name', { value: getFederatedResolverToken(DTOClass), writable: false });

  return AutoResolver;
}

function createEntityAutoResolver<DTO extends object, Entity extends object, R, PS extends PagingStrategies>(
  resolverOpts: EntityCRUDAutoResolverOpts<DTO, Entity, R, PS>,
): Provider {
  const { DTOClass, EntityClass } = resolverOpts;

  @Resolver(() => DTOClass)
  class AutoResolver extends CRUDResolver(DTOClass, resolverOpts) {
    constructor(@InjectQueryService(EntityClass) service: QueryService<Entity>, @InjectPubSub() readonly pubSub: PubSub) {
      super(service);
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoResolver, 'name', { value: getResolverToken(DTOClass), writable: false });
  return AutoResolver;
}

function createServiceAutoResolver<DTO, Service, R, PS extends PagingStrategies>(
  resolverOpts: ServiceCRUDAutoResolverOpts<DTO, Service, R, PS>,
): Provider {
  const { DTOClass, ServiceClass } = resolverOpts;

  @Resolver(() => DTOClass)
  class AutoResolver extends CRUDResolver(DTOClass, resolverOpts) {
    constructor(@Inject(ServiceClass) service: QueryService<DTO>, @InjectPubSub() readonly pubSub: PubSub) {
      super(service);
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoResolver, 'name', { value: getResolverToken(DTOClass), writable: false });
  return AutoResolver;
}

function createResolver<DTO extends object, EntityService extends object, R, PS extends PagingStrategies>(
  resolverOpts: AutoResolverOpts<DTO, EntityService, R, PS>,
): Provider {
  if (isFederatedResolverOpts(resolverOpts)) {
    return createFederatedResolver(resolverOpts);
  }
  if (isServiceCRUDAutoResolverOpts(resolverOpts)) {
    return createServiceAutoResolver(resolverOpts);
  }
  return createEntityAutoResolver(resolverOpts);
}

export const createResolvers = (
  opts: AutoResolverOpts<object, object, unknown, PagingStrategies>[],
): Provider[] => opts.map((opt) => createResolver(opt));
