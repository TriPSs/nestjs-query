import { DynamicModule, ForwardReference, Provider, Type } from '@nestjs/common'
import { Assembler, Class, NestjsQueryCoreModule } from '@ptc-org/nestjs-query-core'

import { createAuthorizerProviders } from './providers'
import { createHookProviders } from './providers/hook.provider'
import { AutoResolverOpts, createEndpoints } from './providers/resolver.provider'
import { ReadResolverOpts } from './resolvers'
import { PagingStrategies } from './types'

interface DTOModuleOpts<DTO> {
  DTOClass: Class<DTO>
}

export interface NestjsQueryRestModuleFeatureOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports?: Array<Class<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>
  services?: Provider[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assemblers?: Class<Assembler<any, any, any, any, any, any>>[]
  endpoints?: AutoResolverOpts<any, any, unknown, unknown, ReadResolverOpts<any>, PagingStrategies>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // resolvers?: AutoResolverOpts<any, any, unknown, unknown, ReadResolverOpts<any>, PagingStrategies>[]
  dtos?: DTOModuleOpts<unknown>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllers?: Array<Class<any>>
  // pubSub?: Provider<GraphQLPubSub>
}

export class NestjsQueryRestModule {
  public static forFeature(opts: NestjsQueryRestModuleFeatureOpts): DynamicModule {
    const coreModule = this.getCoreModule(opts)
    const providers = this.getProviders(opts)
    const imports = opts.imports ?? []
    const controllers = opts.controllers ?? []

    return {
      module: NestjsQueryRestModule,
      imports: [...imports, coreModule],
      providers: [...providers],
      exports: [...providers, ...imports, coreModule],
      controllers: [...this.getEndpointProviders(opts), ...controllers]
    }
  }

  private static getCoreModule(opts: NestjsQueryRestModuleFeatureOpts): DynamicModule {
    return NestjsQueryCoreModule.forFeature({
      assemblers: opts.assemblers,
      imports: opts.imports ?? []
    })
  }

  private static getProviders(opts: NestjsQueryRestModuleFeatureOpts): Provider<unknown>[] {
    return [...this.getServicesProviders(opts), ...this.getAuthorizerProviders(opts), ...this.getHookProviders(opts)]
  }

  private static getServicesProviders(opts: NestjsQueryRestModuleFeatureOpts): Provider<unknown>[] {
    return opts.services ?? []
  }

  private static getAuthorizerProviders(opts: NestjsQueryRestModuleFeatureOpts): Provider<unknown>[] {
    const endpointDTOs = opts.endpoints?.map((r) => r.DTOClass) ?? []
    const dtos = opts.dtos?.map((o) => o.DTOClass) ?? []
    return createAuthorizerProviders([...endpointDTOs, ...dtos])
  }

  private static getEndpointProviders(opts: NestjsQueryRestModuleFeatureOpts): Type[] {
    return createEndpoints(opts.endpoints ?? [])
  }

  private static getHookProviders(opts: NestjsQueryRestModuleFeatureOpts): Provider<unknown>[] {
    return createHookProviders([...(opts.endpoints ?? []), ...(opts.dtos ?? [])])
  }
}
