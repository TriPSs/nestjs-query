import { DynamicModule, ForwardReference, Global, Module, Provider } from '@nestjs/common'
import { Assembler, Class, NestjsQueryCoreModule, AbstractClass } from '@ptc-org/nestjs-query-core'

import { DataLoaderOptions, dataLoaderOptionsToken } from './pipes/inject-data-loader-config.pipe'
import { AutoResolverOpts, createAuthorizerProviders, createHookProviders, createResolvers } from './providers'
import { ReadResolver, ReadResolverOpts } from './resolvers'
import { defaultPubSub, GraphQLPubSub, pubSubToken } from './subscription'
import { PagingStrategies } from './types/query/paging'

interface DTOModuleOpts<DTO> {
  DTOClass: Class<DTO>
  CreateDTOClass?: Class<DTO>
  UpdateDTOClass?: Class<DTO>
}

export interface DiscriminatedDTO {
  DTOClass: Class<any>
  EntityClass: Class<any>
  CreateDTOClass?: Class<any>
  AssemblerClass?: Class<Assembler<any, any, any, any, any, any>>
}

export interface DiscriminateDTOsOpts {
  baseDTO: AbstractClass<any>
  baseEntity: Class<any>
  discriminators: DiscriminatedDTO[]
}

export interface NestjsQueryGraphqlModuleRootOpts {
  dataLoader?: DataLoaderOptions
}

export interface NestjsQueryGraphqlModuleFeatureOpts {
  imports?: Array<Class<any> | DynamicModule | ForwardReference>
  services?: Provider[]
  assemblers?: Class<Assembler<any, any, any, any, any, any>>[]
  resolvers?: AutoResolverOpts<any, any, unknown, unknown, ReadResolverOpts<any>, PagingStrategies>[]
  dtos?: DTOModuleOpts<unknown>[]
  discriminateDTOs?: DiscriminateDTOsOpts[]
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
    const { discriminateDTOs = [] } = opts
    const discriminatedResolvers = discriminateDTOs.flatMap((config) => {
      const { baseDTO, baseEntity, discriminators } = config
      const baseName = baseDTO.name.replace(/DTO$/, '')
      const lowerCaseBaseName = baseName.charAt(0).toLowerCase() + baseName.slice(1)
      const baseResolverOpts: AutoResolverOpts<any, any, any, any, any, any> = {
        DTOClass: baseDTO as Class<any>,
        EntityClass: baseEntity,
        read: { one: { name: lowerCaseBaseName }, many: { name: `${lowerCaseBaseName}s` } }
      }
      const concreteResolverOpts = discriminators.map((d) => {
        const DTOClass = d.DTOClass
        const name = DTOClass.name.replace(/DTO$/, '')
        const lowerCaseName = name.charAt(0).toLowerCase() + name.slice(1)
        const resolverOpts: AutoResolverOpts<any, any, any, any, any, any> = {
          ...d,
          read: { one: { name: lowerCaseName }, many: { name: `${lowerCaseName}s` } }
        }
        if (d.AssemblerClass) {
          (resolverOpts as any).AssemblerClass = d.AssemblerClass
        }
        return resolverOpts
      })
      return [baseResolverOpts, ...concreteResolverOpts]
    })
    return createResolvers([...(opts.resolvers ?? []), ...discriminatedResolvers])
  }

  private static getAuthorizerProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    const resolverDTOs = opts.resolvers?.map((r) => r.DTOClass) ?? []
    const dtos = opts.dtos?.map((o) => o.DTOClass) ?? []
    const discriminatedBaseDTOs = opts.discriminateDTOs?.map((d) => d.baseDTO as Class<any>) ?? []
    const discriminatedDTOs = opts.discriminateDTOs?.flatMap((d) => d.discriminators.map((disc) => disc.DTOClass)) ?? []
    return createAuthorizerProviders([...resolverDTOs, ...dtos, ...discriminatedBaseDTOs, ...discriminatedDTOs])
  }

  private static getHookProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    const discriminatedDTOs = opts.discriminateDTOs?.flatMap((d) => d.discriminators.map((disc) => ({ DTOClass: disc.DTOClass }))) ?? []
    const discriminatedBaseDTOs = opts.discriminateDTOs?.map((d) => ({ DTOClass: d.baseDTO as Class<any> })) ?? []
    return createHookProviders([...(opts.resolvers ?? []), ...(opts.dtos ?? []), ...discriminatedBaseDTOs, ...discriminatedDTOs])
  }
}