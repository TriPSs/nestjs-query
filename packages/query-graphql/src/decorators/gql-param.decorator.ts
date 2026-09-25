import { ExecutionContext, PipeTransform } from '@nestjs/common'
import { PARAM_ARGS_METADATA } from '@nestjs/graphql'
import { Class } from '@ptc-org/nestjs-query-core'

// @nestjs/graphql v14 resolves resolver parameters exclusively from its own
// PARAM_ARGS_METADATA store and no longer reads the metadata written by
// @nestjs/common's `createParamDecorator`. This mirrors it, writing into the
// GraphQL store instead. The key embeds the `__customRouteArgs__` convention
// from @nestjs/common so that ExternalContextCreator routes the value
// through our factory (see @nestjs/core external-context-creator).
const CUSTOM_ROUTE_ARGS_METADATA = '__customRouteArgs__'

const isPipe = (pipe: unknown): pipe is Class<PipeTransform> | PipeTransform => {
  if (!pipe) {
    return false
  }
  const transform = (pipe as { transform?: unknown }).transform
  if (typeof transform === 'function') {
    return true
  }
  const prototype = (pipe as { prototype?: unknown }).prototype as { transform?: unknown } | undefined
  return typeof prototype?.transform === 'function'
}

export function createGqlParamDecorator(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  factory: (data: any, executionContext: ExecutionContext) => unknown
): (data?: unknown, ...pipes: (Class<PipeTransform> | PipeTransform)[]) => ParameterDecorator {
  return (data?: unknown, ...pipes: (Class<PipeTransform> | PipeTransform)[]) =>
    (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
      // Like @nestjs/common's createParamDecorator, a pipe passed as the first
      // argument counts as a pipe, not as parameter data.
      const paramData = isPipe(data) ? undefined : data
      const paramPipes = isPipe(data) ? [data, ...pipes] : pipes
      const existing = Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, propertyKey) ?? {}
      Reflect.defineMetadata(
        PARAM_ARGS_METADATA,
        {
          ...existing,
          [`graphql${CUSTOM_ROUTE_ARGS_METADATA}:${parameterIndex}`]: {
            index: parameterIndex,
            factory,
            data: paramData,
            pipes: paramPipes
          }
        },
        target.constructor,
        propertyKey
      )
    }
}
