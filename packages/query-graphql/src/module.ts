import { DynamicModule, ForwardReference, Global, Module, Provider } from '@nestjs/common'
import { Assembler, Class, NestjsQueryCoreModule } from '@ptc-org/nestjs-query-core'

import { DataLoaderOptions, dataLoaderOptionsToken } from './pipes/inject-data-loader-config.pipe'
import { AutoResolverOpts, createAuthorizerProviders, createHookProviders, createResolvers } from './providers'
import { ReadResolverOpts } from './resolvers'
import { defaultPubSub, GraphQLPubSub, pubSubToken } from './subscription'
import { PagingStrategies } from './types/query/paging'

interface DTOModuleOpts<DTO> {
  DTOClass: Class<DTO>
  CreateDTOClass?: Class<DTO>
  UpdateDTOClass?: Class<DTO>
}

export interface NestjsQueryGraphqlModuleRootOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataLoader?: DataLoaderOptions
}

export interface NestjsQueryGraphqlModuleFeatureOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports?: Array<Class<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>
  services?: Provider[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assemblers?: Class<Assembler<any, any, any, any, any, any>>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers?: AutoResolverOpts<any, any, unknown, unknown, ReadResolverOpts<any>, PagingStrategies>[]
  dtos?: DTOModuleOpts<unknown>[]
  pubSub?: Provider<GraphQLPubSub>
}

@Global()
@Module({})
export class NestjsQueryGraphQLCoreModule {
  public static forRoot(opts: NestjsQueryGraphqlModuleRootOpts): DynamicModule {
    const providers = [{ provide: dataLoaderOptionsToken, useValue: opts.dataLoader ?? {} }]

    return {
      module: NestjsQueryGraphQLCoreModule,
      providers,
      exports: providers
    }
  }
}

export class NestjsQueryGraphQLModule {
  public static forRoot(opts: NestjsQueryGraphqlModuleRootOpts): DynamicModule {
    return {
      module: NestjsQueryGraphQLModule,
      imports: [NestjsQueryGraphQLCoreModule.forRoot(opts)]
    }
  }

  public static forFeature(opts: NestjsQueryGraphqlModuleFeatureOpts): DynamicModule {
    const coreModule = this.getCoreModule(opts)
    const providers = this.getProviders(opts)
    const imports = opts.imports ?? []

    return {
      module: NestjsQueryGraphQLModule,
      imports: [...imports, coreModule],
      providers: [...providers],
      exports: [...providers, ...imports, coreModule]
    }
  }

  public static defaultPubSubProvider(): Provider<GraphQLPubSub> {
    return { provide: pubSubToken(), useValue: defaultPubSub() }
  }

  private static getCoreModule(opts: NestjsQueryGraphqlModuleFeatureOpts): DynamicModule {
    return NestjsQueryCoreModule.forFeature({
      assemblers: opts.assemblers,
      imports: opts.imports ?? []
    })
  }

  private static getProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    return [
      ...this.getServicesProviders(opts),
      ...this.getPubSubProviders(opts),
      ...this.getAuthorizerProviders(opts),
      ...this.getHookProviders(opts),
      ...this.getResolverProviders(opts)
    ]
  }

  private static getPubSubProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<GraphQLPubSub>[] {
    return [opts.pubSub ?? this.defaultPubSubProvider()]
  }

  private static getServicesProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    return opts.services ?? []
  }

  private static getResolverProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    return createResolvers(opts.resolvers ?? [])
  }

  private static getAuthorizerProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    const resolverDTOs = opts.resolvers?.map((r) => r.DTOClass) ?? []
    const dtos = opts.dtos?.map((o) => o.DTOClass) ?? []
    return createAuthorizerProviders([...resolverDTOs, ...dtos])
  }

  private static getHookProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    return createHookProviders([...(opts.resolvers ?? []), ...(opts.dtos ?? [])])
  }
}
