import { DynamicModule, ForwardReference, Global, Module, Provider } from '@nestjs/common'
import { AbstractClass, Assembler, Class, NestjsQueryCoreModule } from '@ptc-org/nestjs-query-core'

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

export interface DiscriminatedDTO {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DTOClass: Class<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EntityClass: Class<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CreateDTOClass?: Class<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AssemblerClass?: Class<Assembler<any, any, any, any, any, any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResolverClass?: Class<any>
}

export interface DiscriminateDTOsOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseDTO: AbstractClass<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseEntity: Class<any>
  discriminators: DiscriminatedDTO[]
}

export interface NestjsQueryGraphqlModuleRootOpts {
  dataLoader?: DataLoaderOptions
}

export interface NestjsQueryGraphqlModuleFeatureOpts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports?: Array<Class<any> | DynamicModule | ForwardReference>
  services?: Provider[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assemblers?: Class<Assembler<any, any, any, any, any, any>>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers?: AutoResolverOpts<any, any, unknown, unknown, ReadResolverOpts<any>, PagingStrategies>[]
  dtos?: DTOModuleOpts<unknown>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const discriminatedAssemblers = (
      opts.discriminateDTOs?.flatMap((d) => d.discriminators.map((disc) => disc.AssemblerClass)) ?? []
    ).filter((AssemblerClass) => AssemblerClass)

    return NestjsQueryCoreModule.forFeature({
      assemblers: [...(opts.assemblers ?? []), ...discriminatedAssemblers],
      imports: opts.imports ?? []
    })
  }

  private static getProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    const discriminatedResolvers = (
      opts.discriminateDTOs?.flatMap((d) => d.discriminators.map((disc) => disc.ResolverClass)) ?? []
    ).filter((ResolverClass) => ResolverClass) as Provider<unknown>[]

    return [
      ...this.getServicesProviders(opts),
      ...this.getPubSubProviders(opts),
      ...this.getAuthorizerProviders(opts),
      ...this.getHookProviders(opts),
      ...this.getResolverProviders(opts),
      ...discriminatedResolvers
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baseResolverOpts: AutoResolverOpts<any, any, any, any, any, any> = {
        DTOClass: baseDTO as Class<unknown>,
        EntityClass: baseEntity,
        read: { one: { name: lowerCaseBaseName }, many: { name: `${lowerCaseBaseName}s` } }
      }
      const concreteResolverOpts = discriminators
        .filter((d) => !d.ResolverClass)
        .map((d) => {
          const DTOClass = d.DTOClass
          const name = DTOClass.name.replace(/DTO$/, '')
          const lowerCaseName = name.charAt(0).toLowerCase() + name.slice(1)

          const baseOpts = {
            DTOClass: d.DTOClass,
            CreateDTOClass: d.CreateDTOClass,
            read: { one: { name: lowerCaseName }, many: { name: `${lowerCaseName}s` } }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resolverOpts: AutoResolverOpts<any, any, any, any, any, any> = {
            ...baseOpts,
            EntityClass: d.EntityClass
          }

          if (d.AssemblerClass) {
            const resolverOptsWithAssembler = resolverOpts as unknown as { AssemblerClass: unknown }
            resolverOptsWithAssembler.AssemblerClass = d.AssemblerClass
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discriminatedBaseDTOs = opts.discriminateDTOs?.map((d) => d.baseDTO as Class<any>) ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discriminatedDTOs = opts.discriminateDTOs?.flatMap((d) => d.discriminators.map((disc) => disc.DTOClass)) ?? []
    return createAuthorizerProviders([...resolverDTOs, ...dtos, ...discriminatedBaseDTOs, ...discriminatedDTOs])
  }

  private static getHookProviders(opts: NestjsQueryGraphqlModuleFeatureOpts): Provider<unknown>[] {
    const discriminatedDTOs =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opts.discriminateDTOs?.flatMap((d) => d.discriminators.map((disc) => ({ DTOClass: disc.DTOClass }))) ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discriminatedBaseDTOs = opts.discriminateDTOs?.map((d) => ({ DTOClass: d.baseDTO as Class<any> })) ?? []
    return createHookProviders([...(opts.resolvers ?? []), ...(opts.dtos ?? []), ...discriminatedBaseDTOs, ...discriminatedDTOs])
  }
}
