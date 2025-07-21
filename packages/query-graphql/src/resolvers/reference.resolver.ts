import { BadRequestException, ExecutionContext } from '@nestjs/common'
import { Context, Resolver, ResolveReference } from '@nestjs/graphql'
import { Class, QueryService } from '@ptc-org/nestjs-query-core'

import { getDTONames } from '../common'
import { InjectDataLoaderConfig } from '../decorators/inject-dataloader-config.decorator'
import { RepresentationType } from '../federation'
import { DataLoaderFactory, ReferenceLoader } from '../loader'
import { DataLoaderOptions } from '../pipes/inject-data-loader-config.pipe'
import { BaseServiceResolver, ResolverClass, ServiceResolver } from './resolver.interface'

export interface ReferenceResolverOpts {
  key?: string
}

/**
 * @internal
 * Mixin to expose `resolveReference` for a DTO on the resolver.
 */
export const Referenceable =
  <DTO, QS extends QueryService<DTO, unknown, unknown>>(DTOClass: Class<DTO>, opts: ReferenceResolverOpts) =>
  <B extends Class<ServiceResolver<DTO, QS>>>(BaseClass: B): B => {
    if (!('key' in opts) || opts.key === undefined) {
      return BaseClass
    }
    const { key } = opts
    const { baseName } = getDTONames(DTOClass)
    const loaderName = `loadReference${baseName}`
    const referenceLoader = new ReferenceLoader<DTO>(DTOClass)

    @Resolver(() => DTOClass, { isAbstract: true })
    class ResolveReferenceResolverBase extends BaseClass {
      @ResolveReference()
      async resolveReference(
        representation: RepresentationType,
        @Context() context: ExecutionContext,
        @InjectDataLoaderConfig()
        dataLoaderConfig?: DataLoaderOptions
      ): Promise<DTO> {
        const id = representation[key]
        if (id === undefined) {
          throw new BadRequestException(`Unable to resolve reference, missing required key ${key} for ${baseName}`)
        }

        const loader = DataLoaderFactory.getOrCreateLoader(
          context,
          loaderName,
          () => referenceLoader.createLoader(this.service),
          dataLoaderConfig
        )

        const result = await loader.load({ id: id as string | number })
        if (!result) {
          throw new BadRequestException(`Unable to find ${baseName} with ${key}: ${String(id)}`)
        }

        return result
      }
    }

    return ResolveReferenceResolverBase
  }

export const ReferenceResolver = <DTO, QS extends QueryService<DTO, unknown, unknown> = QueryService<DTO, unknown, unknown>>(
  DTOClass: Class<DTO>,
  opts: ReferenceResolverOpts = {}
): ResolverClass<DTO, QS, ServiceResolver<DTO, QS>> => Referenceable<DTO, QS>(DTOClass, opts)(BaseServiceResolver)
