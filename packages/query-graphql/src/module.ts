import { DynamicModule, ForwardReference, Provider } from '@nestjs/common';
import { Class } from '@rezonate/nestjs-query-core';

import { AutoResolverOpts, createAuthorizerProviders, createHookProviders, createResolvers } from './providers';
import { ReadResolverOpts } from './resolvers';
import { defaultPubSub, GraphQLPubSub, pubSubToken } from './subscription';
import { PagingStrategies } from './types/query/paging';
import { ConnectionCursorScalar } from './types';
import { RelativeDateScalar } from './types/relative-date-scalar.type';
import { RelativeDateScalarFuture } from './types/relative-date-future-scalar.type';

interface DTOModuleOpts<DTO> {
  DTOClass: Class<DTO>
}

export interface NestjsQueryGraphqlModuleOpts {
  imports: Array<Class<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>
  services?: Provider[]
  resolvers?: AutoResolverOpts<any, any, ReadResolverOpts<any>, PagingStrategies>[]
  dtos?: DTOModuleOpts<unknown>[]
  pubSub?: Provider<GraphQLPubSub>
}

export class NestjsQueryGraphQLModule {
  static forFeature(opts: NestjsQueryGraphqlModuleOpts): DynamicModule {
    const providers = this.getProviders(opts);
    return {
      module: NestjsQueryGraphQLModule,
      imports: [...opts.imports],
      providers: [...providers],
      exports: [...providers, ...opts.imports],
    };
  }

  static defaultPubSubProvider(): Provider<GraphQLPubSub> {
    return { provide: pubSubToken(), useValue: defaultPubSub() };
  }

  private static getProviders(opts: NestjsQueryGraphqlModuleOpts): Provider<unknown>[] {
    return [
      ...this.getServicesProviders(opts),
      ...this.getPubSubProviders(opts),
      ...this.getAuthorizerProviders(opts),
      ...this.getHookProviders(opts),
      ...this.getResolverProviders(opts),
      ...this.getScalarsProviders(),
    ];
  }

  private static getScalarsProviders() {
    return [ConnectionCursorScalar, RelativeDateScalar, RelativeDateScalarFuture];
  }

  private static getPubSubProviders(opts: NestjsQueryGraphqlModuleOpts): Provider<GraphQLPubSub>[] {
    return [opts.pubSub ?? this.defaultPubSubProvider()];
  }

  private static getServicesProviders(opts: NestjsQueryGraphqlModuleOpts): Provider<unknown>[] {
    return opts.services ?? [];
  }

  private static getResolverProviders(opts: NestjsQueryGraphqlModuleOpts): Provider<unknown>[] {
    return createResolvers(opts.resolvers ?? []);
  }

  private static getAuthorizerProviders(opts: NestjsQueryGraphqlModuleOpts): Provider<unknown>[] {
    const resolverDTOs = opts.resolvers?.map((r) => r.DTOClass) ?? [];
    const dtos = opts.dtos?.map((o) => o.DTOClass) ?? [];
    return createAuthorizerProviders([...resolverDTOs, ...dtos]);
  }

  private static getHookProviders(opts: NestjsQueryGraphqlModuleOpts): Provider<unknown>[] {
    return createHookProviders([...(opts.resolvers ?? []), ...(opts.dtos ?? [])]);
  }
}
