import { Controller, Inject, Type } from '@nestjs/common'
import {
  Assembler,
  AssemblerFactory,
  AssemblerQueryService,
  Class,
  DeepPartial,
  InjectAssemblerQueryService,
  InjectQueryService,
  QueryService
} from '@ptc-org/nestjs-query-core'

import { getDTONames } from '../common'
import { CRUDResolver, CRUDResolverOpts } from '../resolvers'
import { PagingStrategies } from '../types'

export type CRUDAutoResolverOpts<DTO, C, U, R, PS extends PagingStrategies> = CRUDResolverOpts<DTO, C, U, R, PS> & {
  DTOClass: Class<DTO>
}

export type EntityCRUDAutoResolverOpts<DTO, Entity, C, U, R, PS extends PagingStrategies> = CRUDAutoResolverOpts<
  DTO,
  C,
  U,
  R,
  PS
> & {
  EntityClass: Class<Entity>
}

export type AssemblerCRUDAutoResolverOpts<DTO, Assembler, C, U, R, PS extends PagingStrategies> = CRUDAutoResolverOpts<
  DTO,
  C,
  U,
  R,
  PS
> & {
  AssemblerClass: Class<Assembler>
}

export type ServiceCRUDAutoResolverOpts<DTO, QueryService, C, U, R, PS extends PagingStrategies> = CRUDAutoResolverOpts<
  DTO,
  C,
  U,
  R,
  PS
> & {
  ServiceClass: Class<QueryService>
}

export type AutoResolverOpts<DTO, EntityServiceOrAssembler, C, U, R, PS extends PagingStrategies> =
  | EntityCRUDAutoResolverOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>
  | AssemblerCRUDAutoResolverOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>
  | ServiceCRUDAutoResolverOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>

export const isServiceCRUDAutoResolverOpts = <DTO, MaybeService, C, U, R, PS extends PagingStrategies>(
  opts: AutoResolverOpts<DTO, MaybeService, C, U, R, PS>
): opts is ServiceCRUDAutoResolverOpts<DTO, MaybeService, C, U, R, PS> => 'DTOClass' in opts && 'ServiceClass' in opts

export const isAssemblerCRUDAutoResolverOpts = <DTO, MaybeAssembler, C, U, R, PS extends PagingStrategies>(
  opts: AutoResolverOpts<DTO, MaybeAssembler, C, U, R, PS>
): opts is AssemblerCRUDAutoResolverOpts<DTO, MaybeAssembler, C, U, R, PS> => 'DTOClass' in opts && 'AssemblerClass' in opts

const getEndpointToken = <DTO>(DTOClass: Class<DTO>): string => `${DTOClass.name}AutoEndpoint`

function createEntityAutoResolver<DTO, Entity extends DeepPartial<Entity>, C, U, R, PS extends PagingStrategies>(
  resolverOpts: EntityCRUDAutoResolverOpts<DTO, Entity, C, U, R, PS>
): Type {
  const { DTOClass, EntityClass, basePath } = resolverOpts
  const { endpointName } = getDTONames(DTOClass)

  class Service extends AssemblerQueryService<DTO, Entity, C, C, U, U> {
    constructor(service: QueryService<Entity, C, U>) {
      const assembler = AssemblerFactory.getAssembler<DTO, Entity, C, C, U, U>(DTOClass, EntityClass)
      super(assembler, service)
    }
  }

  @Controller(basePath || endpointName)
  class AutoResolver extends CRUDResolver(DTOClass, resolverOpts) {
    constructor(@InjectQueryService(EntityClass) service: QueryService<Entity, C, U>) {
      super(new Service(service))
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoResolver, 'name', { value: getEndpointToken(DTOClass), writable: false })
  return AutoResolver
}

function createAssemblerAutoResolver<DTO, Asmblr, C, U, R, PS extends PagingStrategies>(
  resolverOpts: AssemblerCRUDAutoResolverOpts<DTO, Asmblr, C, U, R, PS>
): Type {
  const { DTOClass, AssemblerClass, basePath } = resolverOpts
  const { endpointName } = getDTONames(DTOClass)

  @Controller(basePath || endpointName)
  class AutoResolver extends CRUDResolver(DTOClass, resolverOpts) {
    constructor(
      @InjectAssemblerQueryService(AssemblerClass as unknown as Class<Assembler<DTO, unknown, C, unknown, U, unknown>>)
      service: QueryService<DTO, C, U>
    ) {
      super(service)
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoResolver, 'name', { value: getEndpointToken(DTOClass), writable: false })
  return AutoResolver
}

function createServiceAutoResolver<DTO, Service, C, U, R, PS extends PagingStrategies>(
  resolverOpts: ServiceCRUDAutoResolverOpts<DTO, Service, C, U, R, PS>
): Type {
  const { DTOClass, ServiceClass, basePath } = resolverOpts
  const { endpointName } = getDTONames(DTOClass)

  @Controller(basePath || endpointName)
  class AutoResolver extends CRUDResolver(DTOClass, resolverOpts) {
    constructor(@Inject(ServiceClass) service: QueryService<DTO, C, U>) {
      super(service)
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoResolver, 'name', { value: getEndpointToken(DTOClass), writable: false })
  return AutoResolver
}

function createEndpoint<
  DTO,
  EntityServiceOrAssembler extends DeepPartial<EntityServiceOrAssembler>,
  C,
  U,
  R,
  PS extends PagingStrategies
>(resolverOpts: AutoResolverOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>): Type {
  if (isAssemblerCRUDAutoResolverOpts(resolverOpts)) {
    return createAssemblerAutoResolver(resolverOpts)
  } else if (isServiceCRUDAutoResolverOpts(resolverOpts)) {
    return createServiceAutoResolver(resolverOpts)
  }

  return createEntityAutoResolver(resolverOpts)
}

export const createEndpoints = (
  opts: AutoResolverOpts<unknown, unknown, unknown, unknown, unknown, PagingStrategies>[]
): Type[] => opts.map((opt) => createEndpoint(opt))
