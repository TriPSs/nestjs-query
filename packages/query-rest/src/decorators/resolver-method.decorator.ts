/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  applyDecorators,
  CanActivate,
  ExceptionFilter,
  NestInterceptor,
  PipeTransform,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes
} from '@nestjs/common'
import { Class } from '@ptc-org/nestjs-query-core'

export interface BaseResolverOptions {
  /** An array of `nestjs` guards to apply to a endpoint */
  guards?: (Class<CanActivate> | CanActivate)[]
  /** An array of `nestjs` interceptors to apply to a endpoint */
  interceptors?: Class<NestInterceptor<any, any>>[]
  /** An array of `nestjs` pipes to apply to a endpoint */
  pipes?: Class<PipeTransform<any, any>>[]
  /** An array of `nestjs` error filters to apply to a endpoint */
  filters?: Class<ExceptionFilter<any>>[]
  /** An array of additional decorators to apply to the endpoint * */
  decorators?: (PropertyDecorator | MethodDecorator)[]
  /**
   * Tags to register for the endpoint
   */
  tags?: string[]
}

/**
 * Options for resolver methods.
 */
export interface ResolverMethodOpts extends BaseResolverOptions {
  /** Set to true to disable the endpoint */
  disabled?: boolean
}

/**
 * Options for relation resolver methods.
 */
export interface ResolverRelationMethodOpts extends BaseResolverOptions {
  /** Set to true to enable the endpoint */
  enabled?: boolean
}

/**
 * @internal
 * Creates a unique set of items.
 * @param arrs - An array of arrays to de duplicate.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createSetArray<T>(...arrs: T[][]): T[] {
  const set: Set<T> = new Set(arrs.reduce<T[]>((acc: T[], arr: T[]): T[] => [...acc, ...arr], []))
  return [...set]
}

/**
 * @internal
 * Returns true if any of the [[ResolverMethodOpts]] are disabled.
 * @param opts - The array of [[ResolverMethodOpts]] to check.
 */
export function isDisabled(opts: ResolverMethodOpts[]): boolean {
  return !!opts.find((o) => o.disabled)
}

/**
 * @internal
 * Returns true if any of the [[ResolverRelationMethodOpts]] are disabled.
 * @param opts - The array of [[ResolverRelationMethodOpts]] to check.
 */
export function isEnabled(opts: ResolverRelationMethodOpts[]): boolean {
  return opts.some((o) => o.enabled)
}

/**
 * @internal
 * Decorator for all ResolverMethods
 *
 * @param opts - the [[ResolverMethodOpts]] to apply.
 */
export function ResolverMethod(...opts: ResolverMethodOpts[]): MethodDecorator {
  return applyDecorators(
    UseGuards(...createSetArray<Class<CanActivate> | CanActivate>(...opts.map((o) => o.guards ?? []))),
    UseInterceptors(...createSetArray<Class<NestInterceptor>>(...opts.map((o) => o.interceptors ?? []))),
    UsePipes(...createSetArray<Class<PipeTransform>>(...opts.map((o) => o.pipes ?? []))),
    UseFilters(...createSetArray<Class<ExceptionFilter>>(...opts.map((o) => o.filters ?? []))),
    ...createSetArray<PropertyDecorator | MethodDecorator>(...opts.map((o) => o.decorators ?? []))
  )
}
