import { BadRequestException } from '@nestjs/common';
import { Resolver, ResolveReference } from '@nestjs/graphql';
import { Class, QueryService } from '@rezonate/nestjs-query-core';

import { getDTONames } from '../common';
import { RepresentationType } from '../federation';
import { BaseServiceResolver, ResolverClass, ServiceResolver } from './resolver.interface';

export interface ReferenceResolverOpts {
  key?: string
}

export interface ReferenceResolverType<DTO, QS extends QueryService<DTO> = QueryService<DTO>> extends ResolverClass<DTO, QS, ServiceResolver<DTO, QS>> {
	resolveReference(representation: RepresentationType):Promise<DTO>;
}

/**
 * @internal
 * Mixin to expose `resolveReference` for a DTO on the resolver.
 */
export const Referenceable =
  <DTO, QS extends QueryService<DTO>>(DTOClass: Class<DTO>, opts: ReferenceResolverOpts) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): B & Class<ReferenceResolverType<DTO, QS>> => {
    if (!('key' in opts) || opts.key === undefined) {
      return BaseClass as B & Class<ReferenceResolverType<DTO, QS>>;
    }
    const { key } = opts;

    @Resolver(() => DTOClass, { isAbstract: true })
    class ResolveReferenceResolverBase extends BaseClass {
      @ResolveReference()
      async resolveReference(representation: RepresentationType): Promise<DTO> {
        const id = representation[key];
        if (id === undefined) {
          throw new BadRequestException(
            `Unable to resolve reference, missing required key ${key} for ${getDTONames(DTOClass).baseName}`,
          );
        }
        return this.service.getById(representation[key] as string | number);
      }
    }

    return ResolveReferenceResolverBase as B & Class<ReferenceResolverType<DTO, QS>>;
  };

export const ReferenceResolver = <DTO, QS extends QueryService<DTO> = QueryService<DTO>>(
  DTOClass: Class<DTO>,
  opts: ReferenceResolverOpts = {},
): Class<ReferenceResolverType<DTO, QS>> => Referenceable<DTO, QS>(DTOClass, opts)(BaseServiceResolver);
