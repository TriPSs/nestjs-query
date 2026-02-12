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
import { CRUDController, CRUDControllerOpts } from '../controllers'
import { PagingStrategies } from '../types/query'

export type CRUDAutoControllerOpts<DTO, C, U, R, PS extends PagingStrategies> = CRUDControllerOpts<DTO, C, U, R, PS> & {
  DTOClass: Class<DTO>
}

export type EntityCRUDAutoControllerOpts<DTO, Entity, C, U, R, PS extends PagingStrategies> = CRUDAutoControllerOpts<
  DTO,
  C,
  U,
  R,
  PS
> & {
  EntityClass: Class<Entity>
}

export type AssemblerCRUDAutoControllerOpts<DTO, Assembler, C, U, R, PS extends PagingStrategies> = CRUDAutoControllerOpts<
  DTO,
  C,
  U,
  R,
  PS
> & {
  AssemblerClass: Class<Assembler>
}

export type ServiceCRUDAutoControllerOpts<DTO, QueryService, C, U, R, PS extends PagingStrategies> = CRUDAutoControllerOpts<
  DTO,
  C,
  U,
  R,
  PS
> & {
  ServiceClass: Class<QueryService>
}

export type AutoControllerOpts<DTO, EntityServiceOrAssembler, C, U, R, PS extends PagingStrategies> =
  | EntityCRUDAutoControllerOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>
  | AssemblerCRUDAutoControllerOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>
  | ServiceCRUDAutoControllerOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>

export const isServiceCRUDAutoControllerOpts = <DTO, MaybeService, C, U, R, PS extends PagingStrategies>(
  opts: AutoControllerOpts<DTO, MaybeService, C, U, R, PS>
): opts is ServiceCRUDAutoControllerOpts<DTO, MaybeService, C, U, R, PS> => 'DTOClass' in opts && 'ServiceClass' in opts

export const isAssemblerCRUDAutoControllerOpts = <DTO, MaybeAssembler, C, U, R, PS extends PagingStrategies>(
  opts: AutoControllerOpts<DTO, MaybeAssembler, C, U, R, PS>
): opts is AssemblerCRUDAutoControllerOpts<DTO, MaybeAssembler, C, U, R, PS> => 'DTOClass' in opts && 'AssemblerClass' in opts

const getEndpointToken = <DTO>(DTOClass: Class<DTO>): string => `${DTOClass.name}AutoEndpoint`

function createEntityAutoResolver<DTO, Entity extends DeepPartial<Entity>, C, U, R, PS extends PagingStrategies>(
  resolverOpts: EntityCRUDAutoControllerOpts<DTO, Entity, C, U, R, PS>
): Type {
  const { DTOClass, EntityClass, basePath } = resolverOpts
  const { endpointName } = getDTONames(DTOClass)

  const assembler = AssemblerFactory.getAssembler<DTO, Entity, C, C, U, U>(DTOClass, EntityClass)

  class Service extends AssemblerQueryService<DTO, Entity, C, C, U, U> {
    constructor(service: QueryService<Entity, C, U>) {
      super(assembler, service)
    }
  }

  @Controller(basePath || endpointName)
  class AutoController extends CRUDController(DTOClass, resolverOpts) {
    constructor(@InjectQueryService(EntityClass) service: QueryService<Entity, C, U>) {
      super(new Service(service))
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoController, 'name', { value: getEndpointToken(DTOClass), writable: false })
  return AutoController
}

function createAssemblerAutoResolver<DTO, Asmblr, C, U, R, PS extends PagingStrategies>(
  resolverOpts: AssemblerCRUDAutoControllerOpts<DTO, Asmblr, C, U, R, PS>
): Type {
  const { DTOClass, AssemblerClass, basePath } = resolverOpts
  const { endpointName } = getDTONames(DTOClass)

  @Controller(basePath || endpointName)
  class AutoController extends CRUDController(DTOClass, resolverOpts) {
    constructor(
      @InjectAssemblerQueryService(AssemblerClass as unknown as Class<Assembler<DTO, unknown, C, unknown, U, unknown>>)
      service: QueryService<DTO, C, U>
    ) {
      super(service)
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoController, 'name', { value: getEndpointToken(DTOClass), writable: false })
  return AutoController
}

function createServiceAutoResolver<DTO, Service, C, U, R, PS extends PagingStrategies>(
  resolverOpts: ServiceCRUDAutoControllerOpts<DTO, Service, C, U, R, PS>
): Type {
  const { DTOClass, ServiceClass, basePath } = resolverOpts
  const { endpointName } = getDTONames(DTOClass)

  @Controller(basePath || endpointName)
  class AutoController extends CRUDController(DTOClass, resolverOpts) {
    constructor(@Inject(ServiceClass) service: QueryService<DTO, C, U>) {
      super(service)
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(AutoController, 'name', { value: getEndpointToken(DTOClass), writable: false })
  return AutoController
}

function createEndpoint<
  DTO,
  EntityServiceOrAssembler extends DeepPartial<EntityServiceOrAssembler>,
  C,
  U,
  R,
  PS extends PagingStrategies
>(resolverOpts: AutoControllerOpts<DTO, EntityServiceOrAssembler, C, U, R, PS>): Type {
  if (isAssemblerCRUDAutoControllerOpts(resolverOpts)) {
    return createAssemblerAutoResolver(resolverOpts)
  } else if (isServiceCRUDAutoControllerOpts(resolverOpts)) {
    return createServiceAutoResolver(resolverOpts)
  }

  return createEntityAutoResolver(resolverOpts)
}

export const createEndpoints = (
  opts: AutoControllerOpts<unknown, unknown, unknown, unknown, unknown, PagingStrategies>[]
): Type[] => opts.map((opt) => createEndpoint(opt))
